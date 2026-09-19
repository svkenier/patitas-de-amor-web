/**
 * Cliente HTTP centralizado para petRescue.
 *
 * Características:
 * - Instancia única de Axios apuntando a los Serverless Functions de Cloudflare Pages (/api).
 * - Interceptor de REQUEST: inyecta automáticamente el token JWT desde localStorage.
 * - Interceptor de RESPONSE: ante un 401, limpia la sesión y redirige al /login.
 * - Tipado genérico para todas las respuestas de API.
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

// ─── Constantes ───────────────────────────────────────────────────────────────

// ─── Helpers de sesión ───────────────────────────────────────────────────────

/** Elimina los datos de sesión del localStorage. */
export const clearSession = (): void => {
  localStorage.removeItem('session_user');
};

// ─── Caché ETag en memoria ───────────────────────────────────────────────────
interface CacheEntry {
  etag: string;
  data: any;
}
export const etagCache = new Map<string, CacheEntry>();

/** Elimina una o todas las entradas de la caché ETag para forzar un re-fetch limpio. */
export const clearEtagCache = (urlFragment?: string): void => {
  if (!urlFragment) {
    etagCache.clear();
    return;
  }
  for (const key of etagCache.keys()) {
    if (key.includes(urlFragment)) etagCache.delete(key);
  }
};

// ─── Instancia de Axios ───────────────────────────────────────────────────────

const BASE_URL  = '/api'; // Cloudflare Pages rewrites /api/* → Serverless Functions

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000, // 20 segundos máximo por petición
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
});

// ─── Interceptor de REQUEST ───────────────────────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // Inyectar ETag si existe en caché para peticiones GET
    if (config.method?.toLowerCase() === 'get' && config.url) {
      if (config.headers) {
        // Anti-cache headers para evitar que el navegador sirva versiones obsoletas
        config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        config.headers['Pragma'] = 'no-cache';
        config.headers['Expires'] = '0';
        
        const cached = etagCache.get(config.url);
        if (cached) {
          config.headers['If-None-Match'] = cached.etag;
        }
      }
    }

    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// ─── Interceptor de RESPONSE ──────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const url = response.config.url;
    if (response.config.method?.toLowerCase() === 'get' && url) {
      if (response.status === 304) {
        const cached = etagCache.get(url);
        if (cached) {
          response.status = 200;
          response.data = cached.data;
        }
      } else if (response.status === 200) {
        const etag = response.headers['etag'] || response.headers['ETag'];
        if (etag) {
          etagCache.set(url, { etag, data: response.data });
        }
      }
    }
    return response;
  },

  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.errorType === 'CONFIGURATION_ERROR') {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('app:config-error', { detail: error.response.data }));
        }
      } else if (error.response?.status === 401) {
        // Limpiar sesión corrupta o expirada.
        clearSession();

        // Redirigir al login sin romper el historial de React Router.
        // Usamos location.replace para forzar recarga limpia del estado de la app.
        if (window.location.pathname !== '/login') {
          window.location.replace('/login');
        }
      }
    }

    return Promise.reject(error);
  },
);

// ─── Tipo de error tipado ─────────────────────────────────────────────────────

/** Estructura estándar del cuerpo de error devuelto por los endpoints /api. */
export interface ApiError {
  error: string;
  message?: string;
}

/**
 * Extrae el mensaje de error de una respuesta fallida de la API.
 * Devuelve un string legible.
 */
export const extractApiError = (error: unknown): string => {
  if (axios.isAxiosError<ApiError>(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      'Error desconocido'
    );
  }
  if (error instanceof Error) return error.message;
  return 'Error inesperado';
};

/**
 * Formatea un error para mostrar al usuario, concatenando el mensaje descriptivo
 * con el error técnico real (ej: "No se pudo iniciar sesión. (\"Request failed with status code 401\")").
 */
export const formatApiError = (error: unknown, fallbackMessage: string): string => {
  let technicalMsg = '';
  if (axios.isAxiosError<ApiError>(error)) {
    const status = error.response?.status;
    const axiosMsg = error.response?.data?.message || error.response?.data?.error || error.message;
    technicalMsg = status ? `${axiosMsg} - ${status}` : axiosMsg;
  } else if (error instanceof Error) {
    technicalMsg = error.message;
  } else {
    technicalMsg = String(error);
  }
  return `${fallbackMessage} ("${technicalMsg}")`;
};


// ─── Helpers tipados de conveniencia ─────────────────────────────────────────

/**
 * GET tipado.
 * @example const pets = await get<PetsIndex>('/pets');
 */
export const get = <T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> =>
  apiClient.get<T>(url, config).then((r) => r.data);

/**
 * POST tipado.
 * @example const res = await post<LoginResponse>('/auth/login', payload);
 */
export const post = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> =>
  apiClient.post<T>(url, data, config).then((r) => r.data);

/**
 * DELETE tipado.
 * @example await del<{ ok: boolean }>('/pets', { data: { id } });
 */
export const del = <T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> =>
  apiClient.delete<T>(url, config).then((r) => r.data);

/**
 * PUT tipado.
 * @example const res = await put<Settings>('/settings', payload);
 */
export const put = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> =>
  apiClient.put<T>(url, data, config).then((r) => r.data);

export default apiClient;
