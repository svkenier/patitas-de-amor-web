import { getFileWithETag, putFile, SHELTER_INFO_PATH } from '../../src/core/github/github.js';
import { getAuthPayload } from '../../src/core/auth/auth.js';
import { ROLE_LEVEL } from '../../src/core/types/user.js';
export const onRequestGet = async (context) => {
    const { request, env } = context;
    try {
        const ifNoneMatch = request.headers.get('if-none-match') || undefined;
        const ghRes = await getFileWithETag(SHELTER_INFO_PATH, env, ifNoneMatch);
        const headers = new Headers();
        if (ghRes.notModified) {
            return new Response(null, { status: 304, headers });
        }
        if (ghRes.etag)
            headers.set('ETag', ghRes.etag);
        headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=86400');
        headers.set('Content-Type', 'application/json');
        if (!ghRes.data) {
            // Return empty object fallback (HTTP 200) instead of throwing an error when file doesn't exist.
            return new Response(JSON.stringify({}), { status: 200, headers });
        }
        const content = atob(ghRes.data.content);
        return new Response(content, { status: 200, headers });
    }
    catch (err) {
        console.warn('[settings.ts] Error o repositorio vacío, devolviendo fallback vacío.', err);
        // Devuelve objeto vacío con 200 OK para que el frontend no colapse
        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
};
export const onRequestPut = async (context) => {
    const { request, env } = context;
    const payload = await getAuthPayload(request, env);
    if (!payload)
        return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    if (ROLE_LEVEL[payload.role] < ROLE_LEVEL['encargado']) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }
    try {
        const body = await request.json();
        const current = await getFileWithETag(SHELTER_INFO_PATH, env);
        // Convert to string and base64
        const contentStr = JSON.stringify(body, null, 2);
        await putFile(SHELTER_INFO_PATH, contentStr, 'Update shelter settings', env, current.data?.sha);
        return new Response(JSON.stringify({ ok: true, data: body }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    catch (err) {
        console.error('Error saving settings:', err);
        return new Response(JSON.stringify({ error: 'Error interno guardando configuración' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};
