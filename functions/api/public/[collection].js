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
        const ifNoneMatch = request.headers.get('if-none-match') || undefined;
        const ghRes = await getFileWithETag(path, env, ifNoneMatch);
        if (ghRes.notModified) {
            return new Response(null, { status: 304, headers });
        }
        if (ghRes.etag)
            headers.set('ETag', ghRes.etag);
        headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=86400');
        headers.set('Content-Type', 'application/json');
        let records = [];
        if (ghRes.data) {
            try {
                const parsed = JSON.parse(atob(ghRes.data.content));
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
