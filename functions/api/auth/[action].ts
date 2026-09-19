import { getAuthRateLimit, checkRateLimit } from '../../../src/core/auth/rate-limit.js';
import { signToken, verifyToken, getAuthPayload, type Env } from '../../../src/core/auth/auth.js';
import { getUser, updateLastLogin, activateTTL, cancelTTL, listUsers, setUser, updateUserPreservingTTL } from '../../../src/core/auth/kv.js';
import { verifyPassword, hashPassword } from '../../../src/core/auth/crypto.js';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const action = params.action as string;

  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });

  if (action === 'login' && request.method === 'POST') return handleLogin(request, env);
  if (action === 'logout' && request.method === 'POST') return handleLogout(request, env);
  if (action === 'verify' && request.method === 'GET') return handleVerify(request, env);

  return new Response(JSON.stringify({ error: 'Ruta no encontrada' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
};

async function handleLogin(request: Request, env: Env) {
  try {
    await ensureSeeder(env);
  } catch (err) {
    if (err && (err as any).name === 'ConfigurationError') {
      return new Response(JSON.stringify({
        ok: false,
        errorType: 'CONFIGURATION_ERROR',
        provider: (err as any).provider,
        message: (err as Error).message
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    console.error('ensureSeeder error:', err);
  }

  const ip = request.headers.get('cf-connecting-ip') ?? '127.0.0.1';
  const limitRes = await checkRateLimit(getAuthRateLimit(env), ip);

  if (!limitRes.success) {
    return new Response(JSON.stringify({ error: 'Demasiados intentos. Intenta más tarde.' }), { 
      status: 429, 
      headers: { 'Content-Type': 'application/json', 'X-RateLimit-Limit': limitRes.limit.toString(), 'X-RateLimit-Remaining': limitRes.remaining.toString() } 
    });
  }

  try {
    let { username, password } = await request.json() as any;
    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Credenciales incompletas' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const usernameClean = String(username).trim().toLowerCase();
    let user = await getUser(usernameClean, env) as any;
    
    if (typeof user === 'string') {
      try {
        user = JSON.parse(user);
      } catch {
        // failed to parse
      }
    }

    let valid = user?.password_hash ? await verifyPassword(password, user.password_hash) : false;

    const envUser = (env.ADMIN_USER ?? '').replace(/^"|"$/g, '').trim();
    const envPass = (env.ADMIN_PASSWORD ?? '').replace(/^"|"$/g, '').trim();

    // Fallback de Desarrollo / Sincronización Automática:
    if (!valid && envUser && envPass && usernameClean === envUser.toLowerCase() && password === envPass) {
      valid = true;
      console.log('[Auth Debug] Fallback activado: ADMIN_PASSWORD coincide. Resincronizando hash en Redis...');
      const newHash = await hashPassword(password);
      await updateUserPreservingTTL(usernameClean, { password_hash: newHash }, env);
    }

    console.log('[Auth Debug]', {
      requestedUser: usernameClean,
      foundInRedis: !!user,
      hasHash: !!user?.password_hash,
      isValid: valid,
      adminUserMatch: env.ADMIN_USER ? usernameClean === env.ADMIN_USER.toLowerCase() : false,
      adminPasswordMatch: env.ADMIN_PASSWORD ? password === env.ADMIN_PASSWORD : false,
      envAdminUser: env.ADMIN_USER,
      envAdminPass: env.ADMIN_PASSWORD,
      pwdLength: password.length,
      envPwdLength: env.ADMIN_PASSWORD?.length
    });

    if (!user || !valid) {
      return new Response(JSON.stringify({ error: 'Usuario o contraseña incorrectos' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const token = signToken(user.username, user.role, user.tokenVersion ?? 1, env);
    await updateLastLogin(user.username, env);
    await cancelTTL(user.username, env);

    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Set-Cookie', `auth_session_token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict; Secure`);

    return new Response(JSON.stringify({ 
      ok: true, 
      user: { username: user.username, role: user.role, last_login: user.last_login } 
    }), { status: 200, headers });
  } catch (err) {
    console.error('Error in login:', err);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleLogout(request: Request, env: Env) {
  const payload = await getAuthPayload(request, env);
  if (payload) {
    await activateTTL(payload.sub, env);
  }

  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('Set-Cookie', `auth_session_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict; Secure`);

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}

async function handleVerify(request: Request, env: Env) {
  try {
    await ensureSeeder(env);
  } catch (err) {
    if (err && (err as any).name === 'ConfigurationError') {
      return new Response(JSON.stringify({
        ok: false,
        errorType: 'CONFIGURATION_ERROR',
        provider: (err as any).provider,
        message: (err as Error).message
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    console.error('ensureSeeder error:', err);
  }
  
  const payload = await getAuthPayload(request, env);
  if (!payload) {
    return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const user = await getUser(payload.sub, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ 
    user: { username: user.username, role: user.role, last_login: user.last_login } 
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

async function ensureSeeder(env: Env) {
  const users = await listUsers(env);
  if (users.length === 0) {
    const envUser = (env.ADMIN_USER ?? '').replace(/^"|"$/g, '').trim();
    const envPass = (env.ADMIN_PASSWORD ?? '').replace(/^"|"$/g, '').trim();

    if (!envPass || !envUser) {
      throw new Error("ADMIN_USER or ADMIN_PASSWORD is missing. Initial seeding aborted for security.");
    }
    const hashed = await hashPassword(envPass);
    await setUser({
      username: envUser,
      password_hash: hashed,
      role: 'superadmin',
      tokenVersion: 1,
      last_login: new Date().toISOString(),
      created_by: 'system-seeder',
      created_at: new Date().toISOString(),
      isProtected: true
    }, env);
  }
}
