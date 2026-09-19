import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { get, formatApiError } from '@core/api/client';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import ArrowBackIcon  from '@mui/icons-material/ArrowBack';
import WhatsAppIcon   from '@mui/icons-material/WhatsApp';
import ShareIcon      from '@mui/icons-material/Share';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon     from '@mui/icons-material/Cancel';
import MaleIcon       from '@mui/icons-material/Male';
import FemaleIcon     from '@mui/icons-material/Female';
import PetsIcon       from '@mui/icons-material/Pets';
import Navbar         from '@ui/components/Navbar';
import Footer         from '@ui/components/Footer';
import AnimatedSection from '@ui/components/AnimatedSection';
import { getPetUrl, openWhatsApp } from '@ui/utils/whatsapp';
import type { BaseRecord } from '@core/types/record';
import { ITEM_IMAGE_FALLBACK } from '@core/coreConfig';
import { DEFAULT_SETTINGS } from '@core/types/settings';
import type { Settings } from '@core/types/settings';

const STATUS_LABEL: Record<string, { label: string; color: 'success' | 'warning' | 'default' }> = {
  disponible: { label: '✅ Disponible', color: 'success' },
  en_proceso: { label: '🕐 En proceso', color: 'warning' },
  adoptado:   { label: '🏠 Adoptado',   color: 'default' },
  active:     { label: '✅ Activo',     color: 'success' },
  inactive:   { label: '❌ Inactivo',   color: 'default' },
};

const SPECIES_LABEL: Record<string, string> = { perro: '🐕 Perro', gato: '🐈 Gato', otro: '🐾 Otro' };
const SIZE_LABEL:    Record<string, string> = { pequeno: 'Pequeño', mediano: 'Mediano', grande: 'Grande' };

interface HealthBadgeProps {
  value?: boolean;
  label: string;
}
function HealthBadge({ value, label }: HealthBadgeProps) {
  if (value === undefined) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {value
        ? <CheckCircleIcon sx={{ color: 'success.main', fontSize: '1rem' }} />
        : <CancelIcon      sx={{ color: 'text.disabled', fontSize: '1rem' }} />}
      <Typography variant="body2" color={value ? 'success.main' : 'text.disabled'}>
        {label}
      </Typography>
    </Box>
  );
}

export default function PetDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [snackOpen, setSnackOpen]   = useState(false);

  const { data: record, isLoading, isError, error } = useQuery<BaseRecord>({
    queryKey: ['pet', id],
    queryFn:  async () => {
      const records = await get<BaseRecord[]>('/public/pets');
      const found = records?.find(p => p.id === id);
      if (!found) throw new Error('Registro no encontrado');
      return found;
    },
    enabled: Boolean(id),
  });

  const { data: settings } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await get<Settings | {}>('/settings');
      if (Object.keys(res).length === 0) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...res } as Settings;
    },
    initialData: DEFAULT_SETTINGS,
  });

  const phone = settings?.whatsapp || DEFAULT_SETTINGS.whatsapp;

  const allImages = record
    ? [record.main_image, ...(record.gallery ?? [])].filter(Boolean) as string[]
    : [];

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setSnackOpen(true);
    } catch {
      setSnackOpen(true);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <Container maxWidth="lg" sx={{ py: 6, flexGrow: 1 }}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Skeleton variant="rounded" height={420} />
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                {[1, 2, 3].map((n) => <Skeleton key={n} variant="rounded" width={80} height={60} />)}
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Skeleton variant="text" width="70%" height={40} />
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="rounded" height={120} sx={{ mt: 2 }} />
              <Skeleton variant="rounded" height={48} sx={{ mt: 3 }} />
            </Grid>
          </Grid>
        </Container>
        <Footer />
      </Box>
    );
  }

  if (isError || !record) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center', flexGrow: 1 }}>
          <Typography fontSize="4rem" mb={2}>🔍</Typography>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Registro no encontrado
          </Typography>
          <Typography color="text.secondary" mb={3}>
            {isError ? formatApiError(error, 'Ocurrió un problema de conexión al servidor.') : 'Es posible que esta ficha haya sido eliminada o el ID no sea correcto.'}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/mascotas')}>
            Ver listado
          </Button>
        </Container>
        <Footer />
      </Box>
    );
  }

  const status   = STATUS_LABEL[record.status] ?? STATUS_LABEL.disponible;
  const isAdopted = record.status === 'adoptado' || record.status === 'inactive';

  const attributes = record.attributes || {};
  const especie = attributes['especie'] as string | undefined;
  const sexo = attributes['sexo'] as string | undefined;
  const tamano = attributes['tamano'] as string | undefined;
  const edad = attributes['edad_aproximada'] as string | undefined;
  const raza = attributes['raza'] as string | undefined;
  const peso_kg = attributes['peso_kg'] as number | undefined;
  
  const vacunado = attributes['vacunado'] as boolean | undefined;
  const esterilizado = attributes['esterilizado'] as boolean | undefined;
  const desparasitado = attributes['desparasitado'] as boolean | undefined;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <Box sx={{ py: { xs: 3, md: 6 }, flexGrow: 1 }}>
        <Container maxWidth="lg">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ mb: 3, color: 'text.secondary' }}
          >
            Volver
          </Button>

          <Grid container spacing={{ xs: 3, md: 5 }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <AnimatedSection direction="left">
                <Box
                  sx={{
                    borderRadius: 0,
                    overflow:     'hidden',
                    border:       '1px solid',
                    borderColor:  'divider',
                    bgcolor:      'grey.100',
                    aspectRatio:  '4/3',
                  }}
                >
                  {allImages.length > 0 ? (
                    <Box
                      component="img"
                      src={allImages[galleryIdx]}
                      alt={record.title ? `Foto ${galleryIdx + 1} de ${record.title}` : `Foto ${galleryIdx + 1}`}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                        e.currentTarget.parentElement?.querySelector('.fallback-icon')?.removeAttribute('hidden');
                      }}
                      sx={{
                        width:      '100%',
                        height:     '100%',
                        objectFit:  'cover',
                        transition: 'opacity 250ms',
                      }}
                    />
                  ) : null}
                  {(allImages.length === 0) && (
                    <Box
                      className="fallback-icon"
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.100',
                      }}
                    >
                      <PetsIcon sx={{ fontSize: 80, color: 'text.disabled', opacity: 0.5 }} />
                    </Box>
                  )}
                </Box>

                {allImages.length > 1 && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                    {allImages.map((img, idx) => (
                      <Box
                        key={idx}
                        component="img"
                        src={img}
                        alt={`Miniatura ${idx + 1}`}
                        onClick={() => setGalleryIdx(idx)}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = ITEM_IMAGE_FALLBACK;
                        }}
                        sx={{
                          width:      72,
                          height:     56,
                          objectFit:  'cover',
                          borderRadius: 0,
                          cursor:     'pointer',
                          border:     '2px solid',
                          borderColor: idx === galleryIdx ? 'primary.main' : 'transparent',
                          opacity:    idx === galleryIdx ? 1 : 0.65,
                          transition: 'all 200ms',
                          '&:hover':  { opacity: 1 },
                        }}
                      />
                    ))}
                  </Box>
                )}
              </AnimatedSection>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <AnimatedSection direction="right">
                <Chip
                  label={status.label}
                  color={status.color}
                  size="small"
                  sx={{ mb: 1.5, fontWeight: 600 }}
                />

                <Typography variant="h2" fontWeight={800} mb={0.5}>
                  {record.title}
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                  {especie && (
                    <Chip label={SPECIES_LABEL[especie] ?? especie} variant="outlined" size="small" />
                  )}
                  {sexo === 'macho'  && <Chip icon={<MaleIcon />}   label="Macho"  size="small" variant="outlined" />}
                  {sexo === 'hembra' && <Chip icon={<FemaleIcon />} label="Hembra" size="small" variant="outlined" />}
                  {tamano            && <Chip label={SIZE_LABEL[tamano] ?? tamano} size="small" variant="outlined" />}
                  {edad              && <Chip label={edad} size="small" variant="outlined" />}
                  {raza              && <Chip label={raza} size="small" variant="outlined" />}
                  {typeof peso_kg !== 'undefined' && (
                    <Chip label={`${peso_kg} kg`} size="small" variant="outlined" />
                  )}
                </Box>

                <Divider sx={{ mb: 2.5 }} />

                {record.description && (
                  <Typography variant="body1" color="text.secondary" lineHeight={1.8} mb={3}>
                    {record.description}
                  </Typography>
                )}

                {(vacunado !== undefined || esterilizado !== undefined || desparasitado !== undefined) && (
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 0, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                      Información Adicional
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <HealthBadge value={vacunado}      label="Vacunado" />
                      <HealthBadge value={esterilizado}  label="Esterilizado/a" />
                      <HealthBadge value={desparasitado} label="Desparasitado/a" />
                    </Box>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<WhatsAppIcon />}
                    disabled={isAdopted}
                    onClick={() =>
                      openWhatsApp(getPetUrl(phone, { petName: record.title, petId: record.id }))
                    }
                    sx={{ flexGrow: 1, borderRadius: 0, py: 1.3, fontWeight: 700 }}
                  >
                    {isAdopted ? 'No disponible 🎉' : `Consultar por ${record.title}`}
                  </Button>

                  <Tooltip title="Copiar enlace">
                    <IconButton aria-label="Acción"
                      onClick={() => void handleShare()}
                      sx={{
                        border:     '1px solid',
                        borderColor: 'divider',
                        borderRadius: 0,
                      }}
                    >
                      <ShareIcon />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Typography variant="caption" color="text.disabled" display="block" mt={1.5}>
                  ID: {record.id} · Registrado el {new Date(record.created_at).toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Typography>
              </AnimatedSection>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Snackbar
        open={snackOpen}
        autoHideDuration={2500}
        onClose={() => setSnackOpen(false)}
        message="✅ Enlace copiado al portapapeles"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      <Footer />
    </Box>
  );
}
