import { getAuthPayload, type Env } from '../../../src/core/auth/auth.js';
import { listUsers, setUser, deleteUser, getUser, updateUserPreservingTTL, activateTTL } from '../../../src/core/auth/kv.js';
import { hashPassword } from '../../../src/core/auth/crypto.js';
import { canManage, canCreateRole, type CreateUserRequest, type ResetPasswordRequest, type UserRole, ROLE_LEVEL } from '../../../src/core/types/user.js';

export async function onRequest(context: any) {
  const request: Request = context.request;
  const env: Env = context.env;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const action = pathParts[pathParts.length - 1];

  const payload = await getAuthPayload(request, env);
  if (!payload) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const actorRole = payload.role;

  try {
    if (request.method === 'GET' && action === 'list') {
      if (actorRole === 'voluntario') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
      }
      const users = await listUsers(env);
      return new Response(JSON.stringify({ users, total: users.length }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (request.method === 'POST' && action === 'create') {
      const body = await request.json() as CreateUserRequest;
      if (!body.username || !body.password || !body.role) {
        return new Response(JSON.stringify({ error: 'Bad Request' }), { status: 400 });
      }

      if (actorRole !== 'owner' && (String(body.role) === 'owner' || body.role === 'superadmin')) {
        return new Response(JSON.stringify({ error: 'Acceso denegado: solo el propietario (owner) puede asignar roles de nivel owner o superadmin.' }), { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }

      if (!canCreateRole(actorRole, body.role as UserRole)) {
        return new Response(JSON.stringify({ error: 'Forbidden: Insufficient role to create this user' }), { status: 403 });
      }

      const existing = await getUser(body.username, env);
      if (existing) {
        return new Response(JSON.stringify({ error: 'User already exists' }), { status: 409 });
      }

      const hashed = await hashPassword(body.password);
      await setUser({
        username: body.username,
        password_hash: hashed,
        role: body.role as UserRole,
        created_by: payload.sub,
        created_at: new Date().toISOString()
      }, env);
      
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (request.method === 'DELETE' && action === 'delete') {
      const body = await request.json() as { username: string };
      if (!body.username) return new Response(JSON.stringify({ error: 'Bad Request' }), { status: 400 });

      if (body.username === payload.sub) {
        return new Response(JSON.stringify({ error: 'Acceso denegado: no puedes eliminarte a ti mismo.' }), { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }

      const target = await getUser(body.username, env);
      if (!target) return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });

      if (ROLE_LEVEL[actorRole] <= ROLE_LEVEL[target.role]) {
        return new Response(JSON.stringify({ error: 'No tienes permisos para eliminar a un usuario de igual o mayor jerarquía.' }), { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }
      
      if (target.isProtected || (env.ADMIN_USERNAME && body.username === env.ADMIN_USERNAME)) {
        return new Response(JSON.stringify({ error: 'Forbidden: Cannot delete a protected user' }), { status: 403 });
      }

      await deleteUser(body.username, env);
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (request.method === 'POST' && action === 'update') {
      const body = await request.json() as { username: string; role?: UserRole; password?: string };
      if (!body.username) return new Response(JSON.stringify({ error: 'Bad Request' }), { status: 400 });

      const target = await getUser(body.username, env);
      if (!target) return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
      
      if ((target.isProtected || (env.ADMIN_USERNAME && body.username === env.ADMIN_USERNAME)) && body.role && body.role !== 'superadmin') {
        return new Response(JSON.stringify({ error: 'Forbidden: Cannot downgrade a protected user' }), { status: 403 });
      }

      // Validación estricta para modificación de roles
      if (body.role) {
        if (actorRole !== 'owner' && (body.role === 'owner' || body.role === 'superadmin')) {
          return new Response(JSON.stringify({ error: 'Acceso denegado: solo el propietario (owner) puede asignar roles de nivel owner o superadmin.' }), { 
            status: 403, 
            headers: { 'Content-Type': 'application/json' } 
          });
        }
        if (actorRole !== 'owner' && payload.sub === body.username) {
          return new Response(JSON.stringify({ error: 'Acceso denegado: no puedes promover o cambiar tu propio rol.' }), { 
            status: 403, 
            headers: { 'Content-Type': 'application/json' } 
          });
        }

        if (!canManage(actorRole, target.role) || !canCreateRole(actorRole, body.role as UserRole)) {
          return new Response(JSON.stringify({ error: 'Forbidden: Insufficient role' }), { status: 403 });
        }
      } else {
        if (actorRole !== 'superadmin' && payload.sub !== target.username) {
           if (!canManage(actorRole, target.role)) {
              return new Response(JSON.stringify({ error: 'Forbidden: Insufficient role' }), { status: 403 });
           }
        }
      }

      const updates: any = {};
      if (body.role) updates.role = body.role;
      if (body.password) {
        updates.password_hash = await hashPassword(body.password);
        updates.tokenVersion = (target.tokenVersion || 1) + 1;
      }

      await updateUserPreservingTTL(body.username, updates, env);
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (request.method === 'POST' && action === 'reset-password') {
      const body = await request.json() as ResetPasswordRequest;
      if (!body.target_username || !body.new_password) return new Response(JSON.stringify({ error: 'Bad Request' }), { status: 400 });

      const target = await getUser(body.target_username, env);
      if (!target) return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });

      if (body.target_username !== payload.sub) {
        if (target.role === 'owner') {
          return new Response(JSON.stringify({ error: 'Acceso denegado: la cuenta del propietario es inviolable.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }
        if (ROLE_LEVEL[actorRole] <= ROLE_LEVEL[target.role]) {
          return new Response(JSON.stringify({ error: 'Acceso denegado: no puedes modificar la contraseña de un usuario de igual o mayor jerarquía.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }
      }

      const hashed = await hashPassword(body.new_password);
      await updateUserPreservingTTL(body.target_username, { password_hash: hashed, tokenVersion: (target.tokenVersion || 1) + 1 }, env);
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }
    
    if (request.method === 'POST' && action === 'force-logout') {
      if (actorRole !== 'owner') {
        return new Response(JSON.stringify({ error: 'Acceso denegado: solo el propietario puede forzar el cierre de sesión.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
      }
      
      const body = await request.json() as { username: string };
      if (!body.username) return new Response(JSON.stringify({ error: 'Bad Request' }), { status: 400 });

      const target = await getUser(body.username, env);
      if (!target) return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });

      await updateUserPreservingTTL(body.username, { tokenVersion: (target.tokenVersion || 1) + 1 }, env);
      await activateTTL(body.username, env);
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });

  } catch (err: any) {
    if (err.message?.includes('Forbidden')) {
      return new Response(JSON.stringify({ error: err.message }), { status: 403 });
    }
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
