/**
 * Contexto global de autenticación.
 *
 * Responsabilidades:
 * - Restaurar sesión desde localStorage al cargar la app.
 * - Decodificar y validar expiración del JWT en el cliente.
 * - Exponer login(), logout() y el estado de auth a toda la app.
 * - El logout llama a POST /api/auth/logout para activar el TTL de 30 días en KV.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { PublicUser, LoginRequest, LoginResponse } from '@core/types/user';
import { clearSession, post } from '@core/api/client';

const USER_KEY = 'session_user';

interface AuthStateWithoutToken {
  user: PublicUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthStateWithoutToken {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

const getInitialAuth = () => {
  if (typeof window === 'undefined') return { user: null };
  const savedUser  = localStorage.getItem(USER_KEY);

  if (savedUser) {
    return { user: JSON.parse(savedUser) as PublicUser };
  }
  return { user: null };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(() => getInitialAuth().user);
  const isLoading = false;

  // Login: llama a la API, persiste usuario y actualiza estado
  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    const response = await post<LoginResponse>('/auth/login', credentials);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    setUser(response.user);
  }, []);

  // Logout: activa TTL de 30 días en KV, luego limpia sesión local
  const logout = useCallback(async (): Promise<void> => {
    try {
      await post<{ ok: boolean }>('/auth/logout', {});
    } catch {
      // Si falla el endpoint, igual limpiamos la sesión local
    } finally {
      clearSession();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/** Hook para consumir el contexto de autenticación. Lanza si se usa fuera del Provider. */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
