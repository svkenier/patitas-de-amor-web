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
    'Content-Type': 'application/json; charset=UTF-8',
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

const ERROR_DICTIONARY: Record<string, string> = {
  'Unauthorized': 'La sesión ha expirado o no es válida.',
  'Forbidden': 'No tienes los permisos necesarios para realizar esta acción.',
  'Forbidden: Insufficient role': 'No tienes los permisos necesarios para realizar esta acción.',
  'Forbidden: Insufficient role to create this user': 'Tu nivel de acceso no permite crear usuarios con este rol.',
  'Forbidden: Cannot delete a protected user': 'No es posible eliminar a un usuario protegido o de sistema.',
  'Forbidden: Cannot downgrade a protected user': 'No es posible reducir los privilegios de este usuario protegido.',
  'User already exists': 'Este nombre de usuario ya se encuentra registrado.',
  'Bad Request': 'La información enviada está incompleta o es incorrecta.',
  'Not Found': 'El registro o usuario solicitado ya no existe.',
  'Internal Server Error': 'Ocurrió un problema en el servidor. Intenta nuevamente más tarde.',
  'Network Error': 'Error de conexión con el servidor.',
};

const HTTP_STATUS_FALLBACK: Record<number, string> = {
  400: 'La información enviada es incorrecta o está incompleta.',
  401: 'La sesión ha expirado o no tienes acceso.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'El recurso solicitado no fue encontrado.',
  409: 'Existe un conflicto con los datos ingresados.',
  429: 'Demasiados intentos. Intenta más tarde.',
  500: 'Ocurrió un error inesperado en el servidor.',
};

const isSpanishMessage = (msg: string): boolean => {
  const spanishChars = /[áéíóúñ¿¡]/i;
  const spanishWords = /\b(el|la|los|las|un|una|unos|unas|de|del|que|en|por|para|con|sin|como|pero|o|y|no|si|usuario|contraseña|acceso|denegado|incorrecto|incorrecta|intentos|error)\b/i;
  return spanishChars.test(msg) || spanishWords.test(msg);
};

/**
 * Formatea un error para mostrar al usuario, traduciendo mensajes crudos de la API
 * y manteniendo los códigos HTTP para trazabilidad.
 */
export const formatApiError = (error: unknown, fallbackMessage: string): string => {
  if (axios.isAxiosError<ApiError>(error)) {
    const status = error.response?.status;
    const axiosMsg = error.response?.data?.message || error.response?.data?.error || error.message || '';
    
    let friendlyMessage = fallbackMessage;

    if (ERROR_DICTIONARY[axiosMsg]) {
      friendlyMessage = ERROR_DICTIONARY[axiosMsg];
    } else if (axiosMsg.startsWith('Request failed with status code')) {
      friendlyMessage = status && HTTP_STATUS_FALLBACK[status] ? HTTP_STATUS_FALLBACK[status] : fallbackMessage;
    } else if (isSpanishMessage(axiosMsg)) {
      friendlyMessage = axiosMsg;
    } else if (status && HTTP_STATUS_FALLBACK[status]) {
      friendlyMessage = HTTP_STATUS_FALLBACK[status];
    } else {
      friendlyMessage = fallbackMessage;
    }

    return status ? `${friendlyMessage} (${status})` : friendlyMessage;
  }
  
  if (error instanceof Error) {
    return `${fallbackMessage} (${error.message})`;
  }
  
  return `${fallbackMessage} (${String(error)})`;
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
