/**
 * ProtectedRoute — Guardián de rutas autenticadas.
 *
 * Redirige a /login si:
 *  - La sesión no está cargada aún (isLoading → muestra spinner).
 *  - El usuario no está autenticado.
 *  - El usuario no tiene el nivel de rol mínimo requerido.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '@ui/context/AuthContext';
import { ROLE_LEVEL, type UserRole } from '@core/types/user';
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
  const { isLoading, isAuthenticated, user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) return;

    let intervalId: number | undefined;

    const checkSession = async () => {
      try {
        await get('/auth/verify');
      } catch {
        // El interceptor de Axios (client.ts) captura el 401, limpia la sesión y redirige
      }
    };

    const startPolling = () => {
      if (intervalId) clearInterval(intervalId);
      // Latido cada 20 segundos para respuesta pasiva
      intervalId = window.setInterval(checkSession, 20000);
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    // Revisión inmediata al recuperar el foco de la pestaña
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSession();
        startPolling();
      } else {
        stopPolling();
      }
    };

    // Para navegadores móviles (iOS Safari, Android)
    const handlePageShow = () => {
      checkSession();
      startPolling();
    };
    
    const handlePageHide = () => {
      stopPolling();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);

    // Verificación inicial
    if (document.visibilityState === 'visible') {
      checkSession();
      startPolling();
    }

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
