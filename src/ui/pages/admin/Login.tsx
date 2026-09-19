/**
 * Login — Formulario de acceso para staff del refugio.
 *
 * Diseño: panel centrado sobrio con logo, form de dos campos y feedback de error.
 * Tras login exitoso, redirige a /admin (o a la ruta que intentaba acceder).
 */

import { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon   from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import IconButton from '@mui/material/IconButton';
import { alpha } from '@mui/material/styles';
import { useAuth } from '@ui/context/AuthContext';
import { formatApiError } from '@core/api/client';

// Tipo de estado de location que puede contener la ruta de retorno
interface LocationState {
  from?: { pathname: string };
}

const validationSchema = Yup.object({
  username: Yup.string()
    .matches(/^[a-z0-9_]+$/, 'Solo letras minúsculas, números y guiones bajos')
    .min(2, 'Debe tener al menos 2 caracteres')
    .required('El usuario es obligatorio'),
  password: Yup.string().required('La contraseña es obligatoria'),
});

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuth();
  const from = (location.state as LocationState)?.from?.pathname ?? '/admin';

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');

      try {
        await login({ username: values.username.trim().toLowerCase(), password: values.password });
        navigate(from, { replace: true });
      } catch (err) {
        setError(formatApiError(err, 'No se pudo iniciar sesión. Credenciales no válidas.'));
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.2)} 100%)`,
        p: 2,
      }}
    >
      <Container maxWidth="xs">
        {/* Logo y Encabezado */}
        <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box
            component="img"
            src="/logo.svg"
            alt="Patitas de Amor Barquisimeto"
            sx={{ height: 56, width: 'auto', objectFit: 'contain', mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary">
            Acceso exclusivo para el equipo de Patitas de Amor
          </Typography>
        </Box>

        {/* Card del formulario */}
        <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Iniciar sesión
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={formik.handleSubmit} noValidate>
              <TextField
                id="login-username"
                name="username"
                label="Usuario"
                type="text"
                value={formik.values.username}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.username && Boolean(formik.errors.username)}
                helperText={formik.touched.username && formik.errors.username}
                fullWidth
                autoComplete="username"
                autoFocus
                size="small"
                inputProps={{ pattern: '[a-z0-9_]+', minLength: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                id="login-password"
                name="password"
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                fullWidth
                autoComplete="current-password"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <Button
                id="login-submit"
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading || !formik.values.username.trim() || !formik.values.password}
                sx={{ borderRadius: 0, py: 1.2 }}
              >
                {loading
                  ? <CircularProgress size={22} color="inherit" />
                  : 'Ingresar'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Divider sx={{ my: 3 }} />

        <Typography variant="caption" color="text.disabled" textAlign="center" display="block">
          ¿Problemas para acceder? Contacta al SuperAdmin del refugio.
        </Typography>
        <Box textAlign="center" mt={1.5}>
          <Link component={RouterLink} to="/" underline="hover" color="primary" variant="body2">
            ← Volver al sitio público
          </Link>
        </Box>
      </Container>
    </Box>
  );
}
