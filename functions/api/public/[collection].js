import { getFileWithETag } from '../../../src/core/github/github.js';
import { getPublicRateLimit, checkRateLimit } from '../../../src/core/auth/rate-limit.js';
export const onRequest = async (context) => {
    const { request, env, params } = context;
    const collectionName = params.collection;
    if (request.method === 'OPTIONS')
        return new Response(null, { status: 204 });
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405 });
    }
    // Abstracción agnóstica de colección
    const path = `data/${collectionName}.json`;
    try {
        const ip = request.headers.get('cf-connecting-ip') ?? '127.0.0.1';
        const limitRes = await checkRateLimit(getPublicRateLimit(env), ip);
        const headers = new Headers();
        headers.set('X-RateLimit-Limit', limitRes.limit.toString());
        headers.set('X-RateLimit-Remaining', limitRes.remaining.toString());
        if (!limitRes.success) {
            return new Response(JSON.stringify({ error: 'Demasiadas peticiones. Intenta más tarde.' }), { status: 429, headers });
        }
        const { getAuthPayload } = await import('../../../src/core/auth/auth.js');
        const payload = await getAuthPayload(request, env);
        const isAuthenticated = Boolean(payload);
        const ifNoneMatch = request.headers.get('if-none-match') || undefined;
        const ghRes = await getFileWithETag(path, env, ifNoneMatch);
        if (ghRes.notModified) {
            // If we are authenticated, we cannot use a 304 if it was cached as public, but the browser cache handles it.
            // Better to add Cache-Control here too.
            if (isAuthenticated) {
                headers.set('Cache-Control', 'private, no-cache, no-store');
            }
            else {
                headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=86400');
            }
            return new Response(null, { status: 304, headers });
        }
        if (ghRes.etag)
            headers.set('ETag', ghRes.etag);
        if (isAuthenticated) {
            // No cachear en el edge (CDN) respuestas de usuarios autenticados que puedan contener datos ocultos
            headers.set('Cache-Control', 'private, no-cache, no-store');
        }
        else {
            // Cachear peticiones públicas normales
            headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=86400');
        }
        headers.set('Content-Type', 'application/json');
        let records = [];
        if (ghRes.data) {
            try {
                const decodedStr = decodeURIComponent(escape(atob(ghRes.data.content)));
                const parsed = JSON.parse(decodedStr);
                if (Array.isArray(parsed))
                    records = parsed;
                else {
                    const firstArray = Object.values(parsed).find(Array.isArray);
                    records = firstArray || [];
                }
            }
            catch {
                records = [];
            }
        }
        // Filtrar registros ocultos para usuarios NO autenticados
        if (!isAuthenticated) {
            records = records.filter(r => {
                const isHidden = r.status === 'oculto' || r.hidden === true || r.attributes?.hidden === true;
                return !isHidden;
            });
        }
        return new Response(JSON.stringify(records), { status: 200, headers });
    }
    catch (err) {
        console.warn('[Public Collection Fallback]:', err);
        return new Response(JSON.stringify([]), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            }
        });
    }
};
