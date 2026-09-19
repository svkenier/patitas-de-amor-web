/**
 * ContactSection — Tarjetas de contacto por WhatsApp.
 *
 * Canales institucionales (Rules.md §3):
 *  1. Adopción — mensaje pre-armado con nombre y URL de la ficha (o genérico aquí).
 *  2. Rescate / Emergencia — reporte de animal en situación de calle.
 *  3. Donaciones / Ingreso — apadrinamiento y entrega responsable.
 *  4. Voluntariado — postulación para voluntariado.
 */

import { useQuery } from '@tanstack/react-query';
import Grid from '@mui/material/Grid2';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import PetsOutlinedIcon from '@mui/icons-material/PetsOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import type { SxProps, Theme } from '@mui/material/styles';
import { useTheme, alpha } from '@mui/material/styles';
import { 
  getEmergencyUrl, 
  getDonationUrl, 
  getVolunteerUrl, 
  getGenericInfoUrl,
  openWhatsApp 
} from '@ui/utils/whatsapp';
import { get } from '@core/api/client';
import { DEFAULT_SETTINGS } from '@core/types/settings';
import type { Settings } from '@core/types/settings';

interface ContactSectionProps {
  sx?: SxProps<Theme>;
}

export default function ContactSection({ sx }: ContactSectionProps) {
  const theme = useTheme();
  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await get<Settings | {}>('/settings');
      if (Object.keys(res).length === 0) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...res } as Settings;
    },
    initialData: DEFAULT_SETTINGS,
  });

  const phone = settings?.whatsapp || DEFAULT_SETTINGS.whatsapp;

  const CHANNELS = [
    {
      icon:     <PetsOutlinedIcon sx={{ fontSize: 28 }} />,
      title:    'Quiero adoptar',
      subtitle: 'Iniciemos el proceso de adopción juntos. Te guiamos paso a paso.',
      action:   'Escribir al refugio',
      iconBg:   alpha(theme.palette.primary.main, 0.12),
      iconColor: 'primary.main',
      getUrl:   () => getGenericInfoUrl(phone),
    },
    {
      icon:     <CampaignOutlinedIcon sx={{ fontSize: 28 }} />,
      title:    'Reportar rescate',
      subtitle: 'Encontraste un animal en peligro o en situación de calle. Avísanos.',
      action:   'Reportar ahora',
      iconBg:   alpha(theme.palette.secondary.main, 0.12),
      iconColor: 'secondary.dark',
      getUrl:   () => getEmergencyUrl(phone),
    },
    {
      icon:     <VolunteerActivismOutlinedIcon sx={{ fontSize: 28 }} />,
      title:    'Donar / Apadrinar',
      subtitle: 'Tu apoyo económico o en especie ayuda a mantener el refugio activo.',
      action:   'Quiero ayudar',
      iconBg:   alpha(theme.palette.primary.main, 0.12),
      iconColor: 'primary.main',
      getUrl:   () => getDonationUrl(phone),
    },
    {
      icon:     <HandshakeOutlinedIcon sx={{ fontSize: 28 }} />,
      title:    'Voluntariado',
      subtitle: 'Únete a nuestro equipo y ayúdanos a salvar más vidas en el refugio.',
      action:   'Ser voluntario',
      iconBg:   alpha(theme.palette.secondary.main, 0.12),
      iconColor: 'secondary.dark',
      getUrl:   () => getVolunteerUrl(phone),
    },
  ];

  if (isLoading) {
    return (
      <Box sx={sx}>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
              <Skeleton variant="rounded" height={280} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={sx}>
      <Grid container spacing={3}>
        {CHANNELS.map((ch) => (
          <Grid key={ch.title} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  height:      '100%',
                  display:     'flex',
                  flexDirection: 'column',
                  // Verde Patitas de Amor
                  borderTop: 4,
                  borderColor: 'primary.main',
                }}
              >
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', textAlign: 'center', alignItems: 'center', px: 3, py: 3 }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: ch.iconBg,
                    color: ch.iconColor,
                    mb: 2,
                  }}
                >
                  {ch.icon}
                </Box>
                <Typography variant="h6" component="h3" fontWeight={700} gutterBottom>
                  {ch.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  {ch.subtitle}
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={() => openWhatsApp(ch.getUrl())}
                  sx={{
                    mt:          'auto', // Push to bottom
                  }}
                >
                  {ch.action}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
