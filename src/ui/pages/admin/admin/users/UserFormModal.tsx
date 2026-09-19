import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { post, formatApiError } from '@core/api/client';
import { canCreateRole } from '@core/types/user';
import type { UserRole } from '@core/types/user';

interface UserFormModalProps {
  open:        boolean;
  actorRole:   UserRole;
  onClose:     () => void;
  onCreated:   () => void;
}

const createUserSchema = Yup.object({
  username: Yup.string()
    .matches(/^[a-z0-9_]+$/, 'Solo letras minúsculas, números y _')
    .required('El usuario es obligatorio'),
  password: Yup.string()
    .min(8, 'Debe tener al menos 8 caracteres')
    .required('La contraseña es obligatoria'),
  role: Yup.string().required('El rol es obligatorio'),
});

export function UserFormModal({ open, actorRole, onClose, onCreated }: UserFormModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]       = useState('');

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
      role: 'voluntario' as UserRole,
    },
    validationSchema: createUserSchema,
    onSubmit: () => {
      mutation.mutate();
    },
  });

  const mutation = useMutation({
    mutationFn: () => post('/users/create', formik.values),
    onSuccess:  () => { onCreated(); onClose(); formik.resetForm(); },
    onError:    (e: unknown) => setError(formatApiError(e, 'Error al crear usuario')),
  });

  const availableRoles: UserRole[] = (['voluntario', 'encargado', 'superadmin'] as UserRole[])
    .filter((r) => canCreateRole(actorRole, r));

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth fullScreen={isMobile} PaperProps={{ sx: { borderRadius: 0 } }}>
      <DialogTitle fontWeight={700}>Crear usuario</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Usuario *"
            name="username"
            value={formik.values.username}
            onChange={(e) => {
              const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
              formik.setFieldValue('username', val);
            }}
            onBlur={formik.handleBlur}
            error={formik.touched.username && Boolean(formik.errors.username)}
            helperText={(formik.touched.username && formik.errors.username) || "Solo letras minúsculas, números y _"}
            fullWidth size="small"
          />
          <TextField
            label="Contraseña *"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={(formik.touched.password && formik.errors.password) || "Mínimo 8 caracteres"}
            fullWidth size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" tabIndex={-1}>
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <FormControl fullWidth size="small" error={formik.touched.role && Boolean(formik.errors.role)}>
            <InputLabel>Rol</InputLabel>
            <Select name="role" value={formik.values.role} label="Rol" onChange={formik.handleChange} onBlur={formik.handleBlur}>
              {availableRoles.map((r) => (
                <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>{r}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => { onClose(); formik.resetForm(); setError(''); }} color="inherit">Cancelar</Button>
        <Button
          variant="contained"
          disabled={mutation.isPending || formik.isSubmitting}
          onClick={() => formik.handleSubmit()}
          startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          Crear
        </Button>
      </DialogActions>
    </Dialog>
  );
}
