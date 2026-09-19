import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { post, formatApiError } from '@core/api/client';
import type { PublicUser } from '@core/types/user';

interface PasswordResetModalProps {
  target:  PublicUser | null;
  onClose: () => void;
}

const resetPasswordSchema = Yup.object({
  password: Yup.string()
    .min(8, 'Debe tener al menos 8 caracteres')
    .required('La contraseña es obligatoria'),
});

export function PasswordResetModal({ target, onClose }: PasswordResetModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);

  const formik = useFormik({
    initialValues: {
      password: '',
    },
    validationSchema: resetPasswordSchema,
    onSubmit: () => {
      mutation.mutate();
    },
  });

  const mutation = useMutation({
    mutationFn: () => post('/users/reset-password', { target_username: target?.username, new_password: formik.values.password }),
    onSuccess:  () => setDone(true),
    onError:    (e: unknown) => setError(formatApiError(e, 'Error al resetear la contraseña')),
  });

  const handleClose = () => {
    onClose();
    formik.resetForm();
    setError('');
    setDone(false);
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog open={Boolean(target)} onClose={handleClose} maxWidth="xs" fullWidth fullScreen={isMobile} PaperProps={{ sx: { borderRadius: 0 } }}>
      <DialogTitle fontWeight={700}>Resetear contraseña</DialogTitle>
      <DialogContent>
        {done ? (
          <Alert severity="success">
            Contraseña de <strong>{target?.username}</strong> actualizada exitosamente.
          </Alert>
        ) : (
          <>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            <Typography variant="body2" color="text.secondary" mb={2} mt={1}>
              Nueva contraseña para <strong>{target?.username}</strong>:
            </Typography>
            <TextField
              type={showPassword ? 'text' : 'password'}
              label="Nueva contraseña *"
              name="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={(formik.touched.password && formik.errors.password) || "Mínimo 8 caracteres"}
              fullWidth size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton aria-label="Acción" onClick={() => setShowPassword(!showPassword)} edge="end" size="small" tabIndex={-1}>
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">{done ? 'Cerrar' : 'Cancelar'}</Button>
        {!done && (
          <Button
            variant="contained"
            color="warning"
            disabled={mutation.isPending || formik.isSubmitting}
            onClick={() => formik.handleSubmit()}
            startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            Resetear
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
