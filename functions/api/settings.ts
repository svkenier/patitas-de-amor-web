import { getFileWithETag, putFile, SHELTER_INFO_PATH } from '../../src/core/github/github.js';
import { getAuthPayload } from '../../src/core/auth/auth.js';
import { ROLE_LEVEL, type UserRole } from '../../src/core/types/user.js';
import type { Env } from '../../src/core/auth/auth.js';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const ifNoneMatch = request.headers.get('if-none-match') || undefined;
    const ghRes = await getFileWithETag(SHELTER_INFO_PATH, env, ifNoneMatch);

    const headers = new Headers();
    if (ghRes.notModified) {
      return new Response(null, { status: 304, headers });
    }
    
    if (ghRes.etag) headers.set('ETag', ghRes.etag);
    headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=86400');
    headers.set('Content-Type', 'application/json');

    if (!ghRes.data) {
      // Return empty object fallback (HTTP 200) instead of throwing an error when file doesn't exist.
      return new Response(JSON.stringify({}), { status: 200, headers });
    }

    const content = decodeURIComponent(escape(atob(ghRes.data.content)));
    return new Response(content, { status: 200, headers });
  } catch (err) {
    console.warn('[settings.ts] Error o repositorio vacío, devolviendo fallback vacío.', err);
    // Devuelve objeto vacío con 200 OK para que el frontend no colapse
    return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const payload = await getAuthPayload(request, env);
  if (!payload) return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

  if (ROLE_LEVEL[payload.role as UserRole] < ROLE_LEVEL['encargado']) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const body = await request.json() as Record<string, any>;
    
    const current = await getFileWithETag(SHELTER_INFO_PATH, env);
    
    let currentData: Record<string, any> = {};
    if (current.data && current.data.content) {
      try {
        currentData = JSON.parse(decodeURIComponent(escape(atob(current.data.content))));
      } catch (e) {
        console.warn('[settings.ts] Error decodificando configuración actual', e);
      }
    }

    if (payload.role !== 'owner') {
      const domainKeys = ['expirationDate', 'monitoringActive', 'domainExpirationDate', 'domainAlertEnabled'];
      
      const isDomainModified = domainKeys.some(key => {
        const newVal = body[key];
        const oldVal = currentData[key];
        if (newVal === undefined && oldVal === undefined) return false;
        return newVal !== oldVal;
      });

      if (isDomainModified) {
        return new Response(JSON.stringify({ 
          error: 'Acceso denegado: solo el propietario (owner) puede modificar los parámetros de corte y monitoreo del servicio.' 
        }), { 
          status: 403, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }

      // Asegurar que los valores se mantengan inalterados
      domainKeys.forEach(key => {
        if (currentData[key] !== undefined) {
          body[key] = currentData[key];
        }
      });
    }
    
    // Convert to string and base64
    const contentStr = JSON.stringify(body, null, 2);
    
    await putFile(
      SHELTER_INFO_PATH, 
      contentStr, 
      'Update shelter settings', 
      env, 
      current.data?.sha
    );

    return new Response(JSON.stringify({ ok: true, data: body }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Error saving settings:', err);
    return new Response(JSON.stringify({ error: 'Error interno guardando configuración' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
