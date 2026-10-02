import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import SaveIcon from '@mui/icons-material/Save';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { get, put, formatApiError } from '@core/api/client';
import { useAuth } from '@ui/context/AuthContext';
import { DEFAULT_SETTINGS } from '@core/types/settings';
import type { Settings } from '@core/types/settings';

const validationSchema = Yup.object({
  phone: Yup.string().required('El teléfono es obligatorio'),
  whatsapp: Yup.string().matches(/^\d+$/, 'Solo números, sin espacios ni símbolos').required('El WhatsApp es obligatorio'),
  email: Yup.string().email('Debe ser un correo válido').required('El correo es obligatorio'),
  map_url: Yup.string().url('Debe ser una URL válida'),
  address: Yup.string().required('La dirección es obligatoria'),
  social_links: Yup.object({
    instagram: Yup.string().url('Debe ser una URL válida').nullable(),
    facebook: Yup.string().url('Debe ser una URL válida').nullable(),
    twitter: Yup.string().url('Debe ser una URL válida').nullable(),
  }),
  domainExpirationDate: Yup.string().nullable(),
  domainAlertEnabled: Yup.boolean().nullable(),
});

export default function SettingsManager() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  const qc = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');
  
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<Settings | null>(null);

  const { data, isLoading, isError } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await get<Settings | {}>('/settings');
      if (Object.keys(res).length === 0) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...res } as Settings;
    },
    initialData: DEFAULT_SETTINGS,
  });
  const mutation = useMutation({
    mutationFn: (newSettings: Settings) => put('/settings', newSettings),
    onSuccess: () => {
      setSuccessMsg('Configuración guardada exitosamente.');
      setTimeout(() => setSuccessMsg(''), 3000);
      void qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const formik = useFormik({
    initialValues: data || DEFAULT_SETTINGS,
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      // Check if domain settings changed
      const domainChanged = data?.domainExpirationDate !== values.domainExpirationDate || data?.domainAlertEnabled !== values.domainAlertEnabled;
      if (domainChanged && isOwner) {
        setPendingValues(values);
        setConfirmDialogOpen(true);
      } else {
        mutation.mutate(values);
      }
    },
  });

  const handleConfirmSave = () => {
    if (pendingValues) {
      mutation.mutate(pendingValues);
    }
    setConfirmDialogOpen(false);
  };
  
  const handleDomainRenew = () => {
    const current = new Date(formik.values.domainExpirationDate || DEFAULT_SETTINGS.domainExpirationDate!);
    current.setFullYear(current.getFullYear() + 1);
    formik.setFieldValue('domainExpirationDate', current.toISOString().split('T')[0] + 'T00:00:00Z');
  };

  if (isLoading) return <CircularProgress />;
  if (isError) return <Alert severity="error">{formatApiError(mutation.error, 'Error al cargar la configuración.')}</Alert>;

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ maxWidth: 800 }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Configuración General
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Estos datos se mostrarán públicamente en el pie de página, en los botones de WhatsApp y en otras secciones de la plataforma.
      </Typography>

      {successMsg && <Alert severity="success" sx={{ mb: 3 }}>{successMsg}</Alert>}
      {mutation.isError && <Alert severity="error" sx={{ mb: 3 }}>{formatApiError(mutation.error, 'Error al guardar la configuración.')}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Teléfono de Contacto *"
            name="phone"
            value={formik.values.phone}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.phone && Boolean(formik.errors.phone)}
            helperText={(formik.touched.phone && (formik.errors.phone as string)) || "Ej. +58 412 000 0000"}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="WhatsApp (Sólo números) *"
            name="whatsapp"
            value={formik.values.whatsapp}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.whatsapp && Boolean(formik.errors.whatsapp)}
            helperText={(formik.touched.whatsapp && (formik.errors.whatsapp as string)) || "Sin espacios ni '+'. Ej. 584120000000"}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Correo Electrónico *"
            name="email"
            type="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && (formik.errors.email as string)}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Enlace de Google Maps (URL)"
            name="map_url"
            value={formik.values.map_url || ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.map_url && Boolean(formik.errors.map_url)}
            helperText={(formik.touched.map_url && (formik.errors.map_url as string)) || "Enlace corto o directo a la ubicación (opcional)"}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Dirección Física *"
            name="address"
            value={formik.values.address}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.address && Boolean(formik.errors.address)}
            helperText={formik.touched.address && (formik.errors.address as string)}
            multiline
            rows={2}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle1" fontWeight={700} mt={2} mb={1}>
            Redes Sociales
          </Typography>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            label="Instagram (URL)"
            name="social_links.instagram"
            value={formik.values.social_links?.instagram || ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={Boolean((formik.touched.social_links as any)?.instagram) && Boolean((formik.errors.social_links as any)?.instagram)}
            helperText={(formik.touched.social_links as any)?.instagram && (formik.errors.social_links as any)?.instagram}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            label="Facebook (URL)"
            name="social_links.facebook"
            value={formik.values.social_links?.facebook || ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={Boolean((formik.touched.social_links as any)?.facebook) && Boolean((formik.errors.social_links as any)?.facebook)}
            helperText={(formik.touched.social_links as any)?.facebook && (formik.errors.social_links as any)?.facebook}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            label="Twitter / X (URL)"
            name="social_links.twitter"
            value={formik.values.social_links?.twitter || ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={Boolean((formik.touched.social_links as any)?.twitter) && Boolean((formik.errors.social_links as any)?.twitter)}
            helperText={(formik.touched.social_links as any)?.twitter && (formik.errors.social_links as any)?.twitter}
          />
        </Grid>
        
        {isOwner && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" fontWeight={700} mt={2} mb={1}>
              Gestión de Dominio (Solo Owner)
            </Typography>
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Fecha de Expiración del Dominio"
                  name="domainExpirationDate"
                  type="date"
                  value={formik.values.domainExpirationDate ? formik.values.domainExpirationDate.split('T')[0] : ''}
                  onChange={(e) => {
                    const d = e.target.value;
                    if (d) {
                      formik.setFieldValue('domainExpirationDate', d + 'T00:00:00Z');
                    }
                  }}
                  onBlur={formik.handleBlur}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Button variant="outlined" onClick={handleDomainRenew}>
                  Renovar +1 Año (Autocompletar)
                </Button>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(formik.values.domainAlertEnabled)}
                      onChange={(e) => formik.setFieldValue('domainAlertEnabled', e.target.checked)}
                      name="domainAlertEnabled"
                    />
                  }
                  label="Habilitar alerta de expiración de dominio"
                />
              </Grid>
            </Grid>
          </Grid>
        )}
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          size="large"
          startIcon={(mutation.isPending || formik.isSubmitting) ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          disabled={mutation.isPending || formik.isSubmitting}
        >
          Guardar Configuración
        </Button>
      </Box>

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirmar actualización</DialogTitle>
        <DialogContent>
          ¿Confirmar actualización de vigencia del dominio? La alerta se recalculará automáticamente según la fecha seleccionada.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleConfirmSave} variant="contained" color="primary">Confirmar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
