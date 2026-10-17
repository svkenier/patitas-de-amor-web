/**
 * ProtectedRoute — Guardián de rutas autenticadas.
 *
 * Redirige a /login si:
 *  - La sesión no está cargada aún (isLoading → muestra spinner).
 *  - El usuario no está autenticado.
 *  - El usuario no tiene el nivel de rol mínimo requerido.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '@ui/context/AuthContext';
import { ROLE_LEVEL, type UserRole, type PublicUser } from '@core/types/user';
import { get } from '@core/api/client';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * Rol mínimo requerido para acceder a la ruta.
   * @default 'voluntario'
   */
  minRole?: UserRole;
}

export default function ProtectedRoute({
  children,
  minRole = 'voluntario',
}: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, user, syncUser } = useAuth();
  const location = useLocation();

  const userRef = useRef(user);
  const syncUserRef = useRef(syncUser);

  useEffect(() => {
    userRef.current = user;
    syncUserRef.current = syncUser;
  }, [user, syncUser]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let intervalId: number | undefined;
    let lastChecked = Date.now();

    const checkSession = async () => {
      lastChecked = Date.now();
      try {
        const res = await get<{ user: PublicUser }>('/auth/verify');
        const currentUser = userRef.current;
        if (res?.user && (res.user.role !== currentUser?.role || res.user.username !== currentUser?.username)) {
          syncUserRef.current(res.user);
        }
      } catch {
        // El interceptor de Axios (client.ts) captura el 401, limpia la sesión y redirige
      }
    };

    const checkSessionThrottled = () => {
      const now = Date.now();
      // Throttle de 60 segundos
      if (now - lastChecked >= 60000) {
        void checkSession();
      }
    };

    const startPolling = () => {
      if (intervalId) clearInterval(intervalId);
      // Latido pasivo cada 180 segundos
      intervalId = window.setInterval(checkSession, 180000);
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    // Revisión al recuperar el foco de la pestaña con throttle de 60s
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSessionThrottled();
        startPolling();
      } else {
        stopPolling();
      }
    };

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        checkSessionThrottled();
      }
    };

    // Para navegadores móviles (iOS Safari, Android)
    const handlePageShow = () => {
      checkSessionThrottled();
      startPolling();
    };
    
    const handlePageHide = () => {
      stopPolling();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);

    // Verificación inicial
    if (document.visibilityState === 'visible') {
      void checkSession();
      startPolling();
    }

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [isAuthenticated]);

  // Verificar la sesión al cambiar de ruta interna
  useEffect(() => {
    if (isAuthenticated) {
      get('/auth/verify').catch(() => {});
    }
  }, [location.pathname, isAuthenticated]);

  // Mientras se restaura la sesión desde localStorage
  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight:      '100vh',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          bgcolor:        'background.default',
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // No autenticado → /login con estado de retorno
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nivel insuficiente → /login (no revela la existencia de la ruta a roles menores)
  if (ROLE_LEVEL[user.role] < ROLE_LEVEL[minRole]) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
