import { getFileWithETag } from '../../../src/core/github/github.js';
import type { Env } from '../../../src/core/auth/auth.js';
import { isRecordPubliclyVisible } from '../../../src/core/schema/collections.js';

const ALLOWED_COLLECTIONS = new Set(['pets', 'announcements']);

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const collectionName = params.collection as string;

  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405 });
  }

  if (!ALLOWED_COLLECTIONS.has(collectionName)) {
    return new Response(JSON.stringify({ error: 'Colección no permitida' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Abstracción agnóstica de colección
  const path = `data/${collectionName}.json`;

  try {
    const url = new URL(request.url);
    const isAdminScope = url.searchParams.get('scope') === 'admin';

    const { getAuthPayload } = await import('../../../src/core/auth/auth.js');
    const payload = await getAuthPayload(request, env);
    const isAuthenticated = Boolean(payload);

    const headers = new Headers();
    headers.set('Vary', 'Accept-Encoding, Cookie, Authorization');
    headers.set('Content-Type', 'application/json');

    // [EDGE-01] Aislamiento de caché para panel administrativo
    if (isAdminScope || isAuthenticated) {
      headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    } else {
      headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=86400');
    }

    const ifNoneMatch = request.headers.get('if-none-match') || undefined;
    const ghRes = await getFileWithETag(path, env, ifNoneMatch);

    if (ghRes.notModified) {
      return new Response(null, { status: 304, headers });
    }
    
    if (ghRes.etag) headers.set('ETag', ghRes.etag);

    let records: any[] = [];
    if (ghRes.data && ghRes.data.content) {
      try {
        // [QUAL-01 & QUAL-02] Decodificación UTF-8 segura y eficiente con Buffer
        const decodedStr = Buffer.from(ghRes.data.content, 'base64').toString('utf-8');
        const parsed = JSON.parse(decodedStr);
        if (Array.isArray(parsed)) {
          records = parsed;
        } else {
          const firstArray = Object.values(parsed).find(Array.isArray);
          records = (firstArray as any[]) || [];
        }
      } catch {
        records = [];
      }
    }

    // Filtrar registros ocultos para usuarios NO autenticados mediante el predicado canónico
    if (!isAuthenticated) {
      records = records.filter(isRecordPubliclyVisible);
    }

    return new Response(JSON.stringify(records), { status: 200, headers });
  } catch (err) {
    // [EDGE-03] Manejo resiliente ante fallos de conexión con GitHub (Eliminar Fail-as-Success)
    console.error('[Public Collection Error]:', err);
    return new Response(JSON.stringify({ error: 'Servicio temporalmente no disponible' }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache',
        'Retry-After': '30'
      }
    });
  }
};
