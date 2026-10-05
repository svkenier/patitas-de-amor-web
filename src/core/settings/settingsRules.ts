/**
 * Reglas compartidas de la configuración del refugio (Settings).
 *
 * Módulo PURO (sin DOM, sin React, sin dependencias): lo consumen tanto el
 * formulario `SettingsManager` como la Function `functions/api/settings.ts`,
 * de modo que cliente y servidor sanitizan y validan exactamente igual.
 */

// ─── Listas blancas de claves ────────────────────────────────────────────────

/** Claves editables por `encargado` o superior (datos de contacto del refugio). */
export const SHELTER_KEYS = ['phone', 'whatsapp', 'email', 'address', 'map_url', 'social_links'] as const;

/** Claves de dominio/monitoreo: solo el `owner` puede modificarlas. */
export const DOMAIN_KEYS = ['expirationDate', 'monitoringActive', 'domainExpirationDate', 'domainAlertEnabled'] as const;

export const SOCIAL_KEYS = ['instagram', 'facebook', 'twitter'] as const;

export type ShelterKey = (typeof SHELTER_KEYS)[number];
export type DomainKey = (typeof DOMAIN_KEYS)[number];

// ─── Límites y expresiones regulares ─────────────────────────────────────────

/** E.164 sin "+": código de país (no empieza en 0) + número, 10 a 15 dígitos. */
export const WHATSAPP_REGEX = /^[1-9]\d{9,14}$/;
export const PHONE_CHARS_REGEX = /^\+?[\d\s\-().]+$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

export const LIMITS = {
  phoneDigitsMin: 7,
  phoneDigitsMax: 15,
  emailMax: 254,
  addressMin: 5,
  addressMax: 250,
  urlMax: 300,
} as const;

// ─── Sanitizadores ───────────────────────────────────────────────────────────

export const digitsOnly = (v: string | null | undefined): string => (v ?? '').replace(/\D/g, '');

/**
 * Antepone `https://` si falta el protocolo y fuerza https sobre http.
 * No restringe dominios (acepta acortadores). Si el valor trae otro esquema
 * (javascript:, mailto:, ftp:...) lo devuelve intacto para que la validación lo rechace.
 */
export const normalizeUrl = (v: string | null | undefined): string => {
  const t = (v ?? '').trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t.replace(/^http:\/\//i, 'https://');
  if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return t;
  return `https://${t.replace(/^\/+/, '')}`;
};

export const isHttpsUrl = (v: string): boolean => {
  if (!v || /\s/.test(v)) return false;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' && u.hostname.includes('.');
  } catch {
    return false;
  }
};

// ─── Comparación ─────────────────────────────────────────────────────────────

export const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => deepEqual(item, b[i]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    return ka.length === kb.length && ka.every((k) => k in b && deepEqual(a[k], b[k]));
  }
  return false;
}

/** `undefined`, `null`, `''` y `{}` se consideran "vacío": equivalentes entre sí. */
export const isEmptyValue = (v: unknown): boolean =>
  v === undefined || v === null || v === '' || (isPlainObject(v) && Object.keys(v).length === 0);

export const sameFieldValue = (a: unknown, b: unknown): boolean =>
  (isEmptyValue(a) && isEmptyValue(b)) || deepEqual(a, b);

// ─── Sanitización + validación de campos del refugio ─────────────────────────

export interface FieldResult {
  /** Valor ya limpio (se devuelve aunque haya error, para uso del cliente). */
  value: unknown;
  /** Mensaje en español si el valor es inválido; `null` si es correcto. */
  error: string | null;
}

const collapse = (s: string) => s.trim().replace(/\s+/g, ' ');

export function sanitizeShelterField(key: ShelterKey, raw: unknown): FieldResult {
  if (key === 'social_links') {
    if (raw === undefined || raw === null) return { value: {}, error: null };
    if (!isPlainObject(raw)) return { value: {}, error: 'Las redes sociales tienen un formato inválido' };
    const out: Record<string, string> = {};
    for (const k of SOCIAL_KEYS) {
      const v = raw[k];
      if (v === undefined || v === null || v === '') continue;
      if (typeof v !== 'string') return { value: out, error: `El enlace de ${k} debe ser texto` };
      const url = normalizeUrl(v);
      if (!url) continue;
      if (!isHttpsUrl(url) || url.length > LIMITS.urlMax) {
        return { value: out, error: `El enlace de ${k} no es una URL https válida` };
      }
      out[k] = url;
    }
    return { value: out, error: null };
  }

  if (raw !== undefined && raw !== null && typeof raw !== 'string') {
    return { value: '', error: `El campo ${key} debe ser texto` };
  }
  const s = (raw as string | undefined | null) ?? '';

  switch (key) {
    case 'phone': {
      const value = collapse(s);
      const n = digitsOnly(value).length;
      if (!value) return { value, error: 'El teléfono es obligatorio' };
      if (!PHONE_CHARS_REGEX.test(value) || n < LIMITS.phoneDigitsMin || n > LIMITS.phoneDigitsMax) {
        return { value, error: `Teléfono inválido: debe tener entre ${LIMITS.phoneDigitsMin} y ${LIMITS.phoneDigitsMax} dígitos` };
      }
      return { value, error: null };
    }
    case 'whatsapp': {
      const value = digitsOnly(s);
      if (!value) return { value, error: 'El WhatsApp es obligatorio' };
      if (!WHATSAPP_REGEX.test(value)) {
        return { value, error: 'WhatsApp inválido: usa código de país sin "+" ni 0 inicial (10 a 15 dígitos)' };
      }
      return { value, error: null };
    }
    case 'email': {
      const value = s.trim().toLowerCase();
      if (!value) return { value, error: 'El correo es obligatorio' };
      if (value.length > LIMITS.emailMax || !EMAIL_REGEX.test(value)) {
        return { value, error: 'Correo electrónico inválido' };
      }
      return { value, error: null };
    }
    case 'address': {
      const value = collapse(s);
      if (!value) return { value, error: 'La dirección es obligatoria' };
      if (value.length < LIMITS.addressMin || value.length > LIMITS.addressMax) {
        return { value, error: `La dirección debe tener entre ${LIMITS.addressMin} y ${LIMITS.addressMax} caracteres` };
      }
      return { value, error: null };
    }
    case 'map_url': {
      const value = normalizeUrl(s);
      if (value && (!isHttpsUrl(value) || value.length > LIMITS.urlMax)) {
        return { value, error: 'El enlace del mapa no es una URL https válida' };
      }
      return { value, error: null };
    }
  }
}

/** Construye el payload parcial (solo claves de refugio) ya sanitizado. */
export function toShelterPayload(source: Record<string, unknown>): Record<ShelterKey, unknown> {
  const out = {} as Record<ShelterKey, unknown>;
  for (const key of SHELTER_KEYS) out[key] = sanitizeShelterField(key, source[key]).value;
  return out;
}

/** ¿El payload limpio es idéntico a lo que ya está guardado? (para evitar peticiones vacías) */
export function isShelterPayloadUnchanged(payload: Record<string, unknown>, stored: Record<string, unknown>): boolean {
  return SHELTER_KEYS.every((key) => sameFieldValue(payload[key], stored[key]));
}

// ─── Campos de dominio ───────────────────────────────────────────────────────

/** Alias heredados → clave canónica. El servidor normaliza hacia la canónica. */
export const DOMAIN_PAIRS = [
  { canonical: 'expirationDate', alias: 'domainExpirationDate', kind: 'date' },
  { canonical: 'monitoringActive', alias: 'domainAlertEnabled', kind: 'boolean' },
] as const;

export const isValidDomainDate = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) && !Number.isNaN(Date.parse(v));

/** Dos fechas son "iguales" si coincide la parte YYYY-MM-DD (ignora hora/formato). */
export const sameDomainValue = (kind: 'date' | 'boolean', a: unknown, b: unknown): boolean =>
  kind === 'date' ? typeof a === 'string' && typeof b === 'string' && a.slice(0, 10) === b.slice(0, 10) : a === b;
