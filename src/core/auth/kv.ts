/**
 * Utilidades de Upstash Redis para el almacenamiento de usuarios.
 *
 * Variables de entorno requeridas:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * Esquema de claves:
 *   user:{username}  → JSON serializado de KVUser
 *
 * TTL de 30 días (2_592_000 s) se activa al logout y se cancela al login.
 * El SuperAdmin (SUPERADMIN_USERNAME) nunca tiene TTL.
 */

import { Redis } from '@upstash/redis/cloudflare';
import type { KVUser, PublicUser } from '../types/user.js';
import type { Env } from './auth.js';

export class ConfigurationError extends Error {
  constructor(public provider: 'GitHub' | 'Upstash', message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export const TTL_30_DAYS = 30 * 24 * 60 * 60; // 2,592,000 segundos
export const TTL_6_MONTHS = 180 * 24 * 60 * 60; // 15,552,000 segundos

export function getRedis(env: Env): Redis {
  const missingVars: string[] = [];
  if (!env.UPSTASH_REDIS_REST_URL) missingVars.push('UPSTASH_REDIS_REST_URL');
  if (!env.UPSTASH_REDIS_REST_TOKEN) missingVars.push('UPSTASH_REDIS_REST_TOKEN');

  if (missingVars.length > 0) {
    console.error(`[Upstash Config Error]: Faltan variables de entorno requeridas: ${missingVars.join(', ')}`);
  }

  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL ?? '',
    token: env.UPSTASH_REDIS_REST_TOKEN ?? '',
  });
}

const userKey = (username: string) => `user:${username}`;
const USER_INDEX = 'user:index';

export async function getUser(username: string, env: Env): Promise<KVUser | null> {
  return getRedis(env).get<KVUser>(userKey(username));
}

export async function setUser(user: KVUser, env: Env, ttl?: number): Promise<void> {
  const redis = getRedis(env);
  if (ttl) {
    await redis.set(userKey(user.username), user, { ex: ttl });
  } else {
    await redis.set(userKey(user.username), user);
  }
  await redis.sadd(USER_INDEX, user.username);
}

export async function deleteUser(username: string, env: Env): Promise<void> {
  const user = await getUser(username, env);
  if (user?.isProtected || (env.ADMIN_USER && username === env.ADMIN_USER)) {
    throw new Error('Forbidden: Cannot delete a protected user or the root superadmin.');
  }

  const redis = getRedis(env);
  await redis.del(userKey(username));
  await redis.srem(USER_INDEX, username);
}

export async function updateUserPreservingTTL(username: string, updates: Partial<KVUser>, env: Env): Promise<void> {
  const user = await getUser(username, env);
  if (!user) return;

  if ((user.isProtected || (env.ADMIN_USER && username === env.ADMIN_USER)) && updates.role && updates.role !== 'superadmin') {
    throw new Error('Forbidden: Cannot downgrade a protected user or the root superadmin.');
  }

  const redis = getRedis(env);
  const currentTtl = await redis.ttl(userKey(username));
  const updatedUser = { ...user, ...updates };
  if (currentTtl > 0) {
    await redis.set(userKey(username), updatedUser, { ex: currentTtl });
  } else {
    await redis.set(userKey(username), updatedUser);
  }
}

export async function activateTTL(username: string, env: Env, durationSeconds: number = TTL_30_DAYS): Promise<void> {
  const user = await getUser(username, env);
  if (user?.isProtected || (env.ADMIN_USER && username === env.ADMIN_USER)) return;

  await getRedis(env).expire(userKey(username), durationSeconds);
}

export async function cancelTTL(username: string, env: Env): Promise<void> {
  await getRedis(env).persist(userKey(username));
}

export async function userExists(username: string, env: Env): Promise<boolean> {
  const exists = await getRedis(env).exists(userKey(username));
  return exists === 1;
}

export async function listUsers(env: Env): Promise<PublicUser[]> {
  const redis = getRedis(env);
  let usernames: string[] = [];
  
  try {
    usernames = await redis.smembers(USER_INDEX);
    
    if (usernames.length === 0) {
      const allKeys = await redis.keys('user:*');
      usernames = allKeys
        .filter((k) => k !== USER_INDEX && !k.startsWith('user:rate-limit'))
        .map((k) => k.replace(/^user:/, ''));
        
      if (usernames.length > 0) {
        const [first, ...rest] = usernames;
        await redis.sadd(USER_INDEX, first, ...rest);
      }
    }
  } catch (err) {
    console.error('[Upstash Config Error]:', err);
    throw new ConfigurationError('Upstash', `Error de conexión o token inválido: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (usernames.length === 0) return [];

  const userKeys = usernames.map(userKey);
  const users = (await redis.mget(...userKeys)) as (KVUser | null)[];

  return users
    .filter((u): u is KVUser => Boolean(u))
    .map(({ password_hash: _ph, ...pub }) => pub as PublicUser)
    .sort((a, b) => a.username.localeCompare(b.username));
}

export async function updateLastLogin(username: string, env: Env): Promise<void> {
  await updateUserPreservingTTL(username, { last_login: new Date().toISOString() }, env);
}
