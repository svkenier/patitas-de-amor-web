import { getFileWithETag, putFile, SHELTER_INFO_PATH } from '../../src/core/github/github.js';
import { getAuthPayload } from '../../src/core/auth/auth.js';
import { ROLE_LEVEL, type UserRole } from '../../src/core/types/user.js';
import type { Env } from '../../src/core/auth/auth.js';
import {
  DOMAIN_PAIRS,
  SHELTER_KEYS,
  deepEqual,
  isPlainObject,
  isValidDomainDate,
  sameDomainValue,
  sameFieldValue,
  sanitizeShelterField,
} from '../../src/core/settings/settingsRules.js';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

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

/**
 * PUT parcial con merge:
 *  - Solo se aceptan claves de las listas blancas (SHELTER_KEYS / DOMAIN_KEYS); el resto se ignora.
 *  - `next = { ...currentData, ...clavesAceptadas }`: lo que no se envía se conserva intacto.
 *  - Claves de dominio: solo `owner` puede cambiarlas. Si el valor enviado coincide con el
 *    actual (o no se envía) se permite sin error. Los alias heredados se normalizan hacia
 *    `expirationDate` / `monitoringActive`.
 *  - Si `next` es idéntico a lo guardado, no se llama a GitHub (cero commits).
 */
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const payload = await getAuthPayload(request, env);
  if (!payload) return jsonResponse({ error: 'No autenticado' }, 401);

  if (ROLE_LEVEL[payload.role as UserRole] < ROLE_LEVEL['encargado']) {
    return jsonResponse({ error: 'No autorizado' }, 403);
  }
  const isOwner = payload.role === 'owner';

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'El cuerpo de la petición no es un JSON válido' }, 400);
    }
    if (!isPlainObject(body)) {
      return jsonResponse({ error: 'El cuerpo de la petición debe ser un objeto' }, 400);
    }

    const current = await getFileWithETag(SHELTER_INFO_PATH, env);

    let currentData: Record<string, unknown> = {};
    if (current.data && current.data.content) {
      try {
        const parsed: unknown = JSON.parse(decodeURIComponent(escape(atob(current.data.content))));
        if (!isPlainObject(parsed)) throw new Error('El archivo de configuración no es un objeto JSON');
        currentData = parsed;
      } catch (e) {
        // Con merge ya no se puede "reemplazar a ciegas": si el archivo está corrupto, se aborta
        // en lugar de sobrescribirlo con un objeto parcial.
        console.error('[settings.ts] Error decodificando configuración actual', e);
        return jsonResponse({ error: 'No se pudo leer la configuración actual; no se guardaron cambios' }, 500);
      }
    }

    const next: Record<string, unknown> = { ...currentData };

    // 1) Datos del refugio (encargado o superior) ─ sanitizar, validar y mezclar
    for (const key of SHELTER_KEYS) {
      if (!(key in body)) continue;
      const { value, error } = sanitizeShelterField(key, body[key]);
      if (error) return jsonResponse({ error }, 400);
      if (sameFieldValue(value, currentData[key])) continue; // idéntico: no tocar (evita '' vs ausente)
      next[key] = value;
    }

    // 2) Datos de dominio (solo owner) ─ normalizando alias hacia la clave canónica
    for (const { canonical, alias, kind } of DOMAIN_PAIRS) {
      const provided = body[canonical] !== undefined ? body[canonical] : body[alias];
      if (provided === undefined) continue;

      const valid = kind === 'date' ? isValidDomainDate(provided) : typeof provided === 'boolean';
      if (!valid) {
        return jsonResponse({
          error: kind === 'date'
            ? 'La fecha de expiración debe tener el formato AAAA-MM-DD'
            : 'El estado de monitoreo debe ser verdadero o falso',
        }, 400);
      }

      const effectiveCurrent = currentData[canonical] ?? currentData[alias];
      if (effectiveCurrent !== undefined && sameDomainValue(kind, provided, effectiveCurrent)) continue;

      if (!isOwner) {
        return jsonResponse({
          error: 'Acceso denegado: solo el propietario (owner) puede modificar los parámetros de corte y monitoreo del servicio.',
        }, 403);
      }
      next[canonical] = provided;
      next[alias] = provided; // compatibilidad con lectores que aún usan el alias
    }

    // 3) Sin cambios reales → no se crea ningún commit
    if (deepEqual(next, currentData)) {
      return jsonResponse({ ok: true, unchanged: true, data: currentData });
    }

    await putFile(
      SHELTER_INFO_PATH,
      JSON.stringify(next, null, 2),
      'Update shelter settings',
      env,
      current.data?.sha,
    );

    return jsonResponse({ ok: true, data: next });
  } catch (err) {
    console.error('Error saving settings:', err);
    // GitHub responde "<path> does not match <sha>" si el archivo cambió entre la lectura y la escritura
    if (err instanceof Error && /does not match|conflict/i.test(err.message)) {
      return jsonResponse({ error: 'La configuración cambió mientras guardabas. Recarga la página e inténtalo de nuevo.' }, 409);
    }
    return jsonResponse({ error: 'Error interno guardando configuración' }, 500);
  }
};
