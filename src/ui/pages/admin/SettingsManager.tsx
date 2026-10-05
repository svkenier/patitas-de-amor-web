import { useMemo, useState } from 'react';
import type { ChangeEvent, ClipboardEvent, FocusEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik, getIn } from 'formik';
import * as Yup from 'yup';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import SaveIcon from '@mui/icons-material/Save';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import { get, put, formatApiError, clearEtagCache } from '@core/api/client';
import { DEFAULT_SETTINGS } from '@core/types/settings';
import type { Settings } from '@core/types/settings';
import {
  LIMITS,
  PHONE_CHARS_REGEX,
  WHATSAPP_REGEX,
  EMAIL_REGEX,
  digitsOnly,
  isHttpsUrl,
  isShelterPayloadUnchanged,
  normalizeUrl,
  toShelterPayload,
} from '@core/settings/settingsRules';

interface ShelterFormValues {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  map_url: string;
  social_links: { instagram: string; facebook: string; twitter: string };
}

interface SaveResponse {
  ok: boolean;
  unchanged?: boolean;
  data?: Settings;
}

/** Valores iniciales del formulario: solo claves del refugio, sin `undefined`. */
const buildFormValues = (s?: Partial<Settings>): ShelterFormValues => ({
  phone: s?.phone ?? '',
  whatsapp: s?.whatsapp ?? '',
  email: s?.email ?? '',
  address: s?.address ?? '',
  map_url: s?.map_url ?? '',
  social_links: {
    instagram: s?.social_links?.instagram ?? '',
    facebook: s?.social_links?.facebook ?? '',
    twitter: s?.social_links?.twitter ?? '',
  },
});

const urlField = Yup.string()
  .trim()
  .max(LIMITS.urlMax, `Máximo ${LIMITS.urlMax} caracteres`)
  .test('https-url', 'Ingresa un enlace válido (https://...)', (v) => !v || isHttpsUrl(normalizeUrl(v)));

const validationSchema = Yup.object({
  phone: Yup.string()
    .trim()
    .required('El teléfono es obligatorio')
    .matches(PHONE_CHARS_REGEX, 'Solo números, espacios, guiones y paréntesis')
    .test(
      'phone-digits',
      `Debe tener entre ${LIMITS.phoneDigitsMin} y ${LIMITS.phoneDigitsMax} dígitos`,
      (v) => {
        const n = digitsOnly(v).length;
        return n >= LIMITS.phoneDigitsMin && n <= LIMITS.phoneDigitsMax;
      },
    ),
  whatsapp: Yup.string()
    .trim()
    .required('El WhatsApp es obligatorio')
    .matches(WHATSAPP_REGEX, 'Incluye el código de país, sin "+", espacios ni 0 inicial (10 a 15 dígitos). Ej. 584120000000'),
  email: Yup.string()
    .trim()
    .required('El correo es obligatorio')
    .max(LIMITS.emailMax, `Máximo ${LIMITS.emailMax} caracteres`)
    .matches(EMAIL_REGEX, 'Ingresa un correo válido (ej. nombre@dominio.com)'),
  address: Yup.string()
    .trim()
    .required('La dirección es obligatoria')
    .min(LIMITS.addressMin, `Mínimo ${LIMITS.addressMin} caracteres`)
    .max(LIMITS.addressMax, `Máximo ${LIMITS.addressMax} caracteres`),
  map_url: urlField,
  social_links: Yup.object({
    instagram: urlField,
    facebook: urlField,
    twitter: urlField,
  }),
});

export default function SettingsManager() {
  const qc = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');

  const flashSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const { data, isLoading, isError, error: loadError } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await get<Settings | {}>('/settings');
      if (Object.keys(res).length === 0) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...res } as Settings;
    },
  });

  const mutation = useMutation({
    // Payload parcial: SOLO claves del refugio. Las de dominio nunca se reenvían desde aquí.
    mutationFn: (payload: Record<string, unknown>) => put<SaveResponse>('/settings', payload),
    onSuccess: (res) => {
      clearEtagCache('/settings');
      if (res?.data) qc.setQueryData(['settings'], { ...DEFAULT_SETTINGS, ...res.data });
      flashSuccess(res?.unchanged ? 'No había cambios que guardar.' : 'Configuración guardada exitosamente.');
      void qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const initialValues = useMemo(() => buildFormValues(data), [data]);

  const formik = useFormik<ShelterFormValues>({
    initialValues,
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      const payload = toShelterPayload(values as unknown as Record<string, unknown>);
      // Guardia: si lo limpio es idéntico a lo guardado, no se llama al backend (evita commits vacíos).
      if (data && isShelterPayloadUnchanged(payload, data as unknown as Record<string, unknown>)) {
        flashSuccess('No hay cambios que guardar.');
        formik.resetForm({ values: buildFormValues(data) });
        return;
      }
      try {
        await mutation.mutateAsync(payload);
      } catch {
        // El error se muestra mediante `mutation.isError`.
      }
    },
  });

  if (isLoading || !data) return <CircularProgress />;
  if (isError) return <Alert severity="error">{formatApiError(loadError, 'Error al cargar la configuración.')}</Alert>;

  /** Props comunes de un campo, con soporte de rutas anidadas (`social_links.instagram`). */
  const fieldProps = (name: string, helper?: string) => {
    const err = getIn(formik.touched, name) ? (getIn(formik.errors, name) as string | undefined) : undefined;
    return {
      name,
      fullWidth: true,
      value: (getIn(formik.values, name) as string | undefined) ?? '',
      onChange: formik.handleChange,
      onBlur: formik.handleBlur,
      error: Boolean(err),
      helperText: err || helper,
    };
  };

  /** onBlur que además autocompleta `https://` en enlaces. */
  const urlBlur = (name: string) => (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    formik.handleBlur(e);
    const normalized = normalizeUrl(e.target.value);
    if (normalized !== e.target.value) void formik.setFieldValue(name, normalized);
  };

  const handleWhatsappChange = (e: ChangeEvent<HTMLInputElement>) => {
    void formik.setFieldValue('whatsapp', digitsOnly(e.target.value).slice(0, 15));
  };

  // maxLength truncaría un texto pegado con símbolos ("+58 (412) 000-0000") ANTES de limpiarlo,
  // por eso el pegado se intercepta y se sanitiza primero.
  const handleWhatsappPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    const pasted = digitsOnly(e.clipboardData.getData('text'));
    const cur = el.value;
    const merged = cur.slice(0, el.selectionStart ?? cur.length) + pasted + cur.slice(el.selectionEnd ?? cur.length);
    void formik.setFieldValue('whatsapp', digitsOnly(merged).slice(0, 15));
  };

  const handleEmailBlur = (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    formik.handleBlur(e);
    const cleaned = e.target.value.trim().toLowerCase();
    if (cleaned !== e.target.value) void formik.setFieldValue('email', cleaned);
  };

  const noChanges = !formik.dirty;
  const isSaveDisabled = noChanges || mutation.isPending || formik.isSubmitting;
  const isSaving = mutation.isPending || formik.isSubmitting;

  return (
    <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ maxWidth: 800 }}>
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
            {...fieldProps('phone', 'Formato legible. Ej. +58 412 000 0000')}
            label="Teléfono de Contacto *"
            type="tel"
            inputProps={{ inputMode: 'tel', autoComplete: 'tel', maxLength: 30 }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            {...fieldProps('whatsapp', "Código de país + número, sin '+' ni espacios. Ej. 584120000000")}
            label="WhatsApp (Sólo números) *"
            onChange={handleWhatsappChange}
            inputProps={{ inputMode: 'numeric', maxLength: 15, onPaste: handleWhatsappPaste }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            {...fieldProps('email')}
            label="Correo Electrónico *"
            type="email"
            onBlur={handleEmailBlur}
            inputProps={{ inputMode: 'email', autoComplete: 'email', maxLength: LIMITS.emailMax }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            {...fieldProps('map_url', 'Enlace corto o directo a la ubicación (opcional)')}
            label="Enlace de Google Maps (URL)"
            onBlur={urlBlur('map_url')}
            placeholder="https://maps.app.goo.gl/..."
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            {...fieldProps('address', `${formik.values.address.length}/${LIMITS.addressMax}`)}
            label="Dirección Física *"
            multiline
            rows={2}
            inputProps={{ maxLength: LIMITS.addressMax }}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle1" fontWeight={700} mt={2} mb={1}>
            Redes Sociales
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            {...fieldProps('social_links.instagram')}
            label="Instagram (URL)"
            onBlur={urlBlur('social_links.instagram')}
            placeholder="https://instagram.com/tu_usuario"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            {...fieldProps('social_links.facebook')}
            label="Facebook (URL)"
            onBlur={urlBlur('social_links.facebook')}
            placeholder="https://facebook.com/tu_pagina"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            {...fieldProps('social_links.twitter')}
            label="Twitter / X (URL)"
            onBlur={urlBlur('social_links.twitter')}
            placeholder="https://x.com/tu_usuario"
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Tooltip title={noChanges ? 'No hay cambios pendientes por guardar' : ''} arrow placement="top">
          <span>
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              disabled={isSaveDisabled}
            >
              Guardar Configuración
            </Button>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
}
