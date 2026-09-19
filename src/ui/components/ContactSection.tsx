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
      iconBg:   'rgba(186, 254, 147, 0.25)', // Verde Menta suave
      iconColor: '#1E1F20',
      getUrl:   () => getGenericInfoUrl(phone),
    },
    {
      icon:     <CampaignOutlinedIcon sx={{ fontSize: 28 }} />,
      title:    'Reportar rescate',
      subtitle: 'Encontraste un animal en peligro o en situación de calle. Avísanos.',
      action:   'Reportar ahora',
      iconBg:   'rgba(255, 175, 43, 0.20)', // Ámbar cálido suave
      iconColor: '#1E1F20',
      getUrl:   () => getEmergencyUrl(phone),
    },
    {
      icon:     <VolunteerActivismOutlinedIcon sx={{ fontSize: 28 }} />,
      title:    'Donar / Apadrinar',
      subtitle: 'Tu apoyo económico o en especie ayuda a mantener el refugio activo.',
      action:   'Quiero ayudar',
      iconBg:   'rgba(53, 180, 221, 0.20)', // Cian suave
      iconColor: '#1E1F20',
      getUrl:   () => getDonationUrl(phone),
    },
    {
      icon:     <HandshakeOutlinedIcon sx={{ fontSize: 28 }} />,
      title:    'Voluntariado',
      subtitle: 'Únete a nuestro equipo y ayúdanos a salvar más vidas en el refugio.',
      action:   'Ser voluntario',
      iconBg:   'rgba(30, 31, 32, 0.08)', // Carbón neutro suave
      iconColor: '#1E1F20',
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
                    borderRadius: '50%', // Círculos
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
                  variant="outlined"
                  onClick={() => openWhatsApp(ch.getUrl())}
                  sx={{
                    mt: 'auto',
                    bgcolor: '#F1F5F9',
                    borderColor: 'rgba(0,0,0,0.08)',
                    color: '#1E1F20',
                    fontWeight: 600,
                    transition: 'all 200ms ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      bgcolor: '#FFFFFF',
                      borderColor: 'primary.main',
                    }
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
