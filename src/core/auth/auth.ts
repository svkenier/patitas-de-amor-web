/**
 * Utilidades de autenticación JWT para los Serverless Functions.
 * Solo se usa en el backend — NO importar desde src/.
 */

import jwt from 'jsonwebtoken';
import type { JWTPayload, UserRole } from '../types/user.js';
import { getUser } from './kv.js';

export interface Env {
  JWT_SECRET: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  GITHUB_TOKEN: string;
  ADMIN_USER?: string;
  ADMIN_PASSWORD?: string;
  [key: string]: string | undefined;
}

const JWT_EXPIRES = '7d';

export function signToken(username: string, role: UserRole, tokenVersion: number = 1, env: Env): string {
  if (!env.JWT_SECRET) throw new Error("JWT_SECRET environment variable is missing");
  return jwt.sign({ sub: username, role, tokenVersion }, env.JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token: string, env: Env): JWTPayload {
  if (!env.JWT_SECRET) throw new Error("JWT_SECRET environment variable is missing");
  return jwt.verify(token, env.JWT_SECRET) as unknown as JWTPayload;
}

export function extractToken(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  let token: string | null = null;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const authCookie = cookies.find(c => c.startsWith('auth_session_token='));
    if (authCookie) {
      token = authCookie.split('=')[1];
    }
  }
  if (token) return token;

  const auth = request.headers.get('authorization');
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim() || null;
  }
  return null;
}

export async function getAuthPayload(request: Request, env: Env): Promise<JWTPayload | null> {
  const token = extractToken(request);
  if (!token) return null;
  try {
    const payload = verifyToken(token, env);
    const user = await getUser(payload.sub, env);
    if (!user) return null;

    const dbVersion = user.tokenVersion ?? 1;
    const payloadVersion = payload.tokenVersion ?? 1;

    if (payloadVersion !== dbVersion) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
