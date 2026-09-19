/**
 * Requirements — Requisitos de adopción responsable (/requisitos).
 */

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DoNotDisturbOnIcon     from '@mui/icons-material/DoNotDisturbOn';
import WhatsAppIcon           from '@mui/icons-material/WhatsApp';
import AssignmentIcon         from '@mui/icons-material/Assignment';
import Navbar                 from '@ui/components/Navbar';
import Footer                 from '@ui/components/Footer';
import AnimatedSection        from '@ui/components/AnimatedSection';
import SEO                    from '@core/media/SEO';
import { getGenericInfoUrl, openWhatsApp } from '@ui/utils/whatsapp';
import { useQuery } from '@tanstack/react-query';
import { get } from '@core/api/client';
import { DEFAULT_SETTINGS } from '@core/types/settings';
import type { Settings } from '@core/types/settings';
const REQUISITOS = [
  'Ser mayor de 18 años.',
  'Tener capacidad económica para cubrir alimentación, vacunas y atención veterinaria.',
  'Contar con un espacio adecuado según el tamaño de la mascota.',
  'Comprometerse a no abandonar ni re-ceder la mascota sin informar al refugio.',
  'Comprometerse a esterilizar a la mascota si aún no lo está (en los primeros 6 meses).',
  'No convivir con mascotas agresivas sin supervisión adecuada.',
  'Aceptar el seguimiento post-adopción del refugio (visita o foto al mes).',
];

const RESTRICCIONES = [
  'No adoptamos a personas que vivan en apartamentos sin área de esparcimiento para razas grandes.',
  'No se entregan mascotas como regalos sorpresa.',
  'No se adopta a personas con antecedentes de maltrato animal.',
];

const PASOS = [
  { n: '01', title: 'Elige tu mascota', desc: 'Explora las mascotas en adopción y encuentra la que conecte contigo.' },
  { n: '02', title: 'Contáctanos',       desc: 'Escríbenos por WhatsApp con el nombre e ID de la mascota.' },
  { n: '03', title: 'Entrevista breve',  desc: 'Charlamos contigo para conocer tu contexto de vida.' },
  { n: '04', title: '¡Bienvenida a casa!', desc: 'Firma el acuerdo y dale el hogar que merece.' },
];

export default function Requirements() {
  const { data: settings } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await get<Settings | {}>('/settings');
      if (Object.keys(res).length === 0) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...res } as Settings;
    },
    staleTime: 5 * 60 * 1000,
    initialData: DEFAULT_SETTINGS,
  });

  const phone = settings?.whatsapp || DEFAULT_SETTINGS.whatsapp;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SEO 
        title="Requisitos de Adopción" 
        description="Conoce los requisitos de adopción de Patitas de Amor Barquisimeto. Queremos garantizar el bienestar permanente de nuestras mascotas rescatadas."
        url="/requisitos"
      />
      <Navbar />

      {/* Encabezado */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', py: { xs: 5, md: 7 } }}>
        <Container maxWidth="md">
          <AnimatedSection>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <AssignmentIcon sx={{ fontSize: '2.2rem', color: 'primary.main' }} />
              <Typography variant="overline" color="primary" fontWeight={700} letterSpacing="0.12em">
                Adopción responsable
              </Typography>
            </Box>
            <Typography variant="h2" fontWeight={800} mb={2}>
              Requisitos de adopción
            </Typography>
            <Typography variant="body1" color="text.secondary" maxWidth={540}>
              Queremos garantizar el bienestar de nuestras mascotas. Por eso pedimos
              un compromiso real a quienes deseen adoptarlas.
            </Typography>
          </AnimatedSection>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 6, md: 9 }, bgcolor: 'background.default', flexGrow: 1, contentVisibility: 'auto', containIntrinsicSize: 'auto 800px' }}>
        <Container maxWidth="md">

          {/* Requisitos */}
          <AnimatedSection>
            <Typography variant="h4" fontWeight={700} mb={3}>
              ✅ Requisitos básicos
            </Typography>
          </AnimatedSection>

          <AnimatedSection delay={60}>
            <Card sx={{ mb: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <List disablePadding>
                  {REQUISITOS.map((req, i) => (
                    <ListItem key={i} alignItems="flex-start" disablePadding sx={{ mb: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36, pt: 0.3 }}>
                        <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: '1.1rem' }} />
                      </ListItemIcon>
                      <ListItemText primary={req} primaryTypographyProps={{ variant: 'body1' }} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </AnimatedSection>

          {/* Restricciones */}
          <AnimatedSection delay={80}>
            <Typography variant="h4" fontWeight={700} mb={3}>
              🚫 Restricciones
            </Typography>
          </AnimatedSection>

          <AnimatedSection delay={120}>
            <Card sx={{ mb: 5, borderLeft: '4px solid', borderColor: 'error.main' }}>
              <CardContent sx={{ p: 3 }}>
                <List disablePadding>
                  {RESTRICCIONES.map((r, i) => (
                    <ListItem key={i} alignItems="flex-start" disablePadding sx={{ mb: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36, pt: 0.3 }}>
                        <DoNotDisturbOnIcon sx={{ color: 'error.main', fontSize: '1.1rem' }} />
                      </ListItemIcon>
                      <ListItemText primary={r} primaryTypographyProps={{ variant: 'body1' }} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </AnimatedSection>

          <Divider sx={{ mb: 5 }} />

          {/* Proceso */}
          <AnimatedSection>
            <Typography variant="h4" fontWeight={700} mb={3}>
              📋 El proceso paso a paso
            </Typography>
          </AnimatedSection>

          <Grid container spacing={2.5} mb={6}>
            {PASOS.map((paso, i) => (
              <Grid key={paso.n} size={{ xs: 12, sm: 6 }}>
                <AnimatedSection delay={i * 80}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography
                        variant="h4"
                        fontWeight={800}
                        color="primary.main"
                        mb={1}
                        sx={{ opacity: 0.5, fontSize: '2rem' }}
                      >
                        {paso.n}
                      </Typography>
                      <Typography variant="h6" fontWeight={700} gutterBottom>{paso.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{paso.desc}</Typography>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              </Grid>
            ))}
          </Grid>

          {/* CTA */}
          <AnimatedSection>
            <Box
              sx={{
                textAlign:  'center',
                p:          4,
                bgcolor:    'background.paper',
                borderRadius: 0,
                border:     '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="h5" fontWeight={700} mb={1.5}>
                ¿Listo para adoptar?
              </Typography>
              <Typography color="text.secondary" mb={3}>
                Escríbenos por WhatsApp y comenzamos el proceso.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<WhatsAppIcon />}
                onClick={() => openWhatsApp(getGenericInfoUrl(phone))}
                sx={{ borderRadius: 0, px: 4, py: 1.3 }}
              >
                Iniciar adopción
              </Button>
            </Box>
          </AnimatedSection>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
