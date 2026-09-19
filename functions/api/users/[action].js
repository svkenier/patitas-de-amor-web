import { getAuthPayload } from '../../../src/core/auth/auth.js';
import { listUsers, setUser, deleteUser, getUser, updateUserPreservingTTL } from '../../../src/core/auth/kv.js';
import { hashPassword } from '../../../src/core/auth/crypto.js';
import { canManage, canCreateRole } from '../../../src/core/types/user.js';
export async function onRequest(context) {
    const request = context.request;
    const env = context.env;
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
            const body = await request.json();
            if (!body.username || !body.password || !body.role) {
                return new Response(JSON.stringify({ error: 'Bad Request' }), { status: 400 });
            }
            if (!canCreateRole(actorRole, body.role)) {
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
                role: body.role,
                created_by: payload.sub,
                created_at: new Date().toISOString()
            }, env);
            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
        }
        if (request.method === 'DELETE' && action === 'delete') {
            const body = await request.json();
            if (!body.username)
                return new Response(JSON.stringify({ error: 'Bad Request' }), { status: 400 });
            const target = await getUser(body.username, env);
            if (!target)
                return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
            if (target.isProtected || (env.ADMIN_USERNAME && body.username === env.ADMIN_USERNAME)) {
                return new Response(JSON.stringify({ error: 'Forbidden: Cannot delete a protected user' }), { status: 403 });
            }
            if (!canManage(actorRole, target.role)) {
                return new Response(JSON.stringify({ error: 'Forbidden: Insufficient role to manage this user' }), { status: 403 });
            }
            await deleteUser(body.username, env);
            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
        }
        if (request.method === 'POST' && action === 'update') {
            const body = await request.json();
            if (!body.username)
                return new Response(JSON.stringify({ error: 'Bad Request' }), { status: 400 });
            const target = await getUser(body.username, env);
            if (!target)
                return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
            if ((target.isProtected || (env.ADMIN_USERNAME && body.username === env.ADMIN_USERNAME)) && body.role && body.role !== 'superadmin') {
                return new Response(JSON.stringify({ error: 'Forbidden: Cannot downgrade a protected user' }), { status: 403 });
            }
            // Can manage?
            if (body.role) {
                if (!canManage(actorRole, target.role) || !canCreateRole(actorRole, body.role)) {
                    return new Response(JSON.stringify({ error: 'Forbidden: Insufficient role' }), { status: 403 });
                }
            }
            else {
                if (actorRole !== 'superadmin' && payload.sub !== target.username) {
                    if (!canManage(actorRole, target.role)) {
                        return new Response(JSON.stringify({ error: 'Forbidden: Insufficient role' }), { status: 403 });
                    }
                }
            }
            const updates = {};
            if (body.role)
                updates.role = body.role;
            if (body.password) {
                updates.password_hash = await hashPassword(body.password);
                updates.tokenVersion = (target.tokenVersion || 1) + 1;
            }
            await updateUserPreservingTTL(body.username, updates, env);
            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
        }
        if (request.method === 'POST' && action === 'reset-password') {
            const body = await request.json();
            if (!body.target_username || !body.new_password)
                return new Response(JSON.stringify({ error: 'Bad Request' }), { status: 400 });
            const target = await getUser(body.target_username, env);
            if (!target)
                return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
            if (!canManage(actorRole, target.role) && actorRole !== 'superadmin') {
                return new Response(JSON.stringify({ error: 'Forbidden: Insufficient role' }), { status: 403 });
            }
            const hashed = await hashPassword(body.new_password);
            await updateUserPreservingTTL(body.target_username, { password_hash: hashed, tokenVersion: (target.tokenVersion || 1) + 1 }, env);
            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
        }
        if (request.method === 'POST' && action === 'force-logout') {
            const body = await request.json();
            if (!body.username)
                return new Response(JSON.stringify({ error: 'Bad Request' }), { status: 400 });
            const target = await getUser(body.username, env);
            if (!target)
                return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
            if (payload.sub !== target.username && !canManage(actorRole, target.role)) {
                return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
            }
            await updateUserPreservingTTL(body.username, { tokenVersion: (target.tokenVersion || 1) + 1 }, env);
            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
    }
    catch (err) {
        if (err.message?.includes('Forbidden')) {
            return new Response(JSON.stringify({ error: err.message }), { status: 403 });
        }
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
