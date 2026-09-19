import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation } from '@tanstack/react-query';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { post, formatApiError } from '@core/api/client';
import { useAuth } from '@ui/context/AuthContext';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

const validationSchema = Yup.object({
  currentPassword: Yup.string().required('La contraseña actual es obligatoria'),
  newPassword: Yup.string().min(8, 'Debe tener al menos 8 caracteres').required('La nueva contraseña es obligatoria'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Las contraseñas no coinciden')
    .required('Debes confirmar la contraseña'),
});

export default function ChangePasswordDialog({ open, onClose }: ChangePasswordDialogProps) {
  const { user } = useAuth();
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const formik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: () => {
      mutation.mutate();
    },
  });

  const mutation = useMutation({
    mutationFn: () => post('/users/change-password', { current_password: formik.values.currentPassword, new_password: formik.values.newPassword }),
    onSuccess: () => {
      setSuccess(true);
      formik.resetForm();
    },
    onError: (e: unknown) => setError(formatApiError(e, 'Error al cambiar la contraseña')),
  });

  const handleClose = () => {
    onClose();
    // Reset state after dialog closes animation
    setTimeout(() => {
      formik.resetForm();
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setError('');
      setSuccess(false);
    }, 300);
  };

  const handleSubmit = () => {
    setError('');
    setSuccess(false);
    formik.handleSubmit();
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth fullScreen={isMobile} PaperProps={{ sx: { borderRadius: 0 } }}>
      <DialogTitle fontWeight={700}>Cambiar mi contraseña</DialogTitle>
      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mt: 1 }}>
            Contraseña actualizada exitosamente. Ya puedes usar tu nueva contraseña en tu próximo inicio de sesión.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Usuario: <strong>{user?.username}</strong>
            </Typography>
            
            {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

            <TextField
              label="Contraseña actual"
              name="currentPassword"
              type={showCurrent ? 'text' : 'password'}
              value={formik.values.currentPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.currentPassword && Boolean(formik.errors.currentPassword)}
              helperText={formik.touched.currentPassword && (formik.errors.currentPassword as string)}
              fullWidth size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton aria-label="Acción" onClick={() => setShowCurrent(!showCurrent)} edge="end" size="small" tabIndex={-1}>
                      {showCurrent ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Nueva contraseña"
              name="newPassword"
              type={showNew ? 'text' : 'password'}
              value={formik.values.newPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.newPassword && Boolean(formik.errors.newPassword)}
              helperText={(formik.touched.newPassword && (formik.errors.newPassword as string)) || "Mínimo 8 caracteres"}
              fullWidth size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton aria-label="Acción" onClick={() => setShowNew(!showNew)} edge="end" size="small" tabIndex={-1}>
                      {showNew ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Confirmar nueva contraseña"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              fullWidth size="small"
              error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && (formik.errors.confirmPassword as string)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton aria-label="Acción" onClick={() => setShowConfirm(!showConfirm)} edge="end" size="small" tabIndex={-1}>
                      {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">{success ? 'Cerrar' : 'Cancelar'}</Button>
        {!success && (
          <Button
            variant="contained"
            color="primary"
            disabled={mutation.isPending || formik.isSubmitting}
            onClick={handleSubmit}
            startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            Guardar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
