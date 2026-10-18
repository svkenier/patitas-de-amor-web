/**
 * App.tsx — Enrutamiento principal de petRescue.
 *
 * Rutas públicas: /, /mascotas, /mascotas/:id, /requisitos, /terminos, /privacidad, /login
 * Rutas protegidas: /admin (minRole: voluntario)
 *
 * AuthProvider envuelve toda la app para que useAuth() esté disponible
 * en Navbar, ProtectedRoute y cualquier página que lo necesite.
 */
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import { AuthProvider } from '@ui/context/AuthContext';
import ProtectedRoute from '@ui/components/ProtectedRoute';
import ScrollToTop from '@ui/components/ScrollToTop';
import ConfigErrorBanner from '@ui/components/ConfigErrorBanner';

// ─── Lazy-loading de páginas (code splitting automático por Vite) ──────────────
import Home from '@ui/pages/public/Home';
const PetsPage = lazy(() => import('@ui/pages/public/PetsPage'));
const PetDetailPage = lazy(() => import('@ui/pages/public/PetDetailPage'));
const Requirements = lazy(() => import('@ui/pages/utility/Requirements'));
const Terms        = lazy(() => import('@ui/pages/utility/Terms'));
const Privacy      = lazy(() => import('@ui/pages/utility/Privacy'));
const Login        = lazy(() => import('@ui/pages/admin/Login'));
const Admin        = lazy(() => import('@ui/pages/admin/Admin'));
const NotFound     = lazy(() => import('@ui/pages/utility/NotFound'));

// ─── Fallback de carga ───────────────────────────────────────────────────────
function TopProgressBar() {
  return (
    <LinearProgress
      color="primary"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        zIndex: 9999,
        bgcolor: 'transparent',
        '& .MuiLinearProgress-bar': {
          background: 'linear-gradient(90deg, #65C620, #84E036)',
        },
      }}
      aria-label="Cargando contenido..."
    />
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<TopProgressBar />}>
        <ScrollToTop />
        <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <ConfigErrorBanner />
          <Routes>
            {/* Rutas públicas */}
            <Route path="/"           element={<Home />} />
            <Route path="/mascotas"   element={<PetsPage />} />
            <Route path="/mascotas/:id" element={<PetDetailPage />} />
            <Route path="/requisitos" element={<Requirements />} />
            <Route path="/terminos"   element={<Terms />} />
            <Route path="/privacidad" element={<Privacy />} />
            <Route path="/login"      element={<Login />} />

            {/* Ruta protegida — acceso mínimo: voluntario */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute minRole="voluntario">
                  <Admin />
                </ProtectedRoute>
              }
            />

            {/* Catch-all → 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Box>
      </Suspense>
    </AuthProvider>
  );
}
