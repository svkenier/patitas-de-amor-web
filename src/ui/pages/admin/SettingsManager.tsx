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
import { get, put, formatApiError } from '@core/api/client';
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
});

export default function SettingsManager() {
  const qc = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');

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
      mutation.mutate(values);
    },
  });

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
    </Box>
  );
}
