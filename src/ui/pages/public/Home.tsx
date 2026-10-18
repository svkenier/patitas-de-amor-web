/**
 * Home — Portada principal de petRescue.
 *
 * Secciones:
 * 1. Hero — gradient terracota→salvia, headline principal, CTAs.
 * 2. Anuncios y Eventos (Lazy)
 * 3. Mascotas Destacadas (Lazy - Carrusel Embla)
 * 4. Cómo funciona — 3 pasos con iconos.
 * 5. Contacto — ContactSection (Lazy - 3 canales WhatsApp).
 */

import { lazy, Suspense } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid2';
import { useTheme, alpha } from '@mui/material/styles';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Navbar from '@ui/components/Navbar';
import Footer from '@ui/components/Footer';
import AnimatedSection from '@ui/components/AnimatedSection';
import SEO from '@core/media/SEO';

// ─── Code Splitting Below-the-Fold ───────────────────────────────────────────
const AnnouncementsSection = lazy(() => import('@ui/components/AnnouncementsSection'));
const FeaturedPetsSection = lazy(() => import('@ui/components/FeaturedPetsSection'));
const ContactSection = lazy(() => import('@ui/components/ContactSection'));

// ─── Pasos de adopción ────────────────────────────────────────────────────────

const STEPS = [
  {
    icon: <SearchOutlinedIcon sx={{ fontSize: 28 }} />,
    title: 'Explora las mascotas',
    desc: 'Conoce a nuestras mascotas, lee sus historias y encuentra la que conecte contigo.',
  },
  {
    icon: <ChatOutlinedIcon sx={{ fontSize: 28 }} />,
    title: 'Contáctanos por WhatsApp',
    desc: 'Escríbenos directamente. Te informamos sobre el proceso y requisitos de adopción.',
  },
  {
    icon: <HomeOutlinedIcon sx={{ fontSize: 28 }} />,
    title: '¡Bienvenido a casa!',
    desc: 'Firma el acuerdo, prepara el espacio y dale a tu nueva mascota el hogar que merece.',
  },
];

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Home() {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SEO 
        title="Adopción y Refugio Animal · Patitas de Amor Bqto" 
        description="Fundación de rescate y adopción responsable de perros y gatos en Barquisimeto. Encuentra a tu compañero ideal." 
      />
      <Navbar />

      {/* ── Hero (Split Layout / Sharp UI) ──────────────────────────────────── */}
      <Box
        component="section"
        sx={{
          position: 'relative',
          minHeight: { xs: 'calc(100dvh - 56px)', md: 'calc(100vh - 64px)' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: { xs: 'flex-start', md: 'center' },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: {
              xs: 'linear-gradient(180deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.70) 50%, rgba(15, 23, 42, 0.10) 75%, transparent 100%)',
              md: 'linear-gradient(90deg, rgba(15, 23, 42, 0.90) 0%, rgba(15, 23, 42, 0.65) 45%, rgba(15, 23, 42, 0.15) 75%, transparent 100%)'
            },
            zIndex: 1,
          },
        }}
      >
        <Box
          component="picture"
          sx={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 0,
            '& img': {
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: { xs: 'center bottom', md: 'right 77%' }
            }
          }}
        >
          <source media="(min-width: 900px)" srcSet="/hero-desktop.webp?v=17" width="1920" height="1080" />
          <img
            src="/hero-mobile.webp?v=17"
            alt="Perros y gatos rescatados por Patitas de Amor Barquisimeto"
            {...({ fetchpriority: "high" } as any)}
            loading="eager"
            decoding="sync"
            width="800"
            height="1200"
          />
        </Box>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, pt: { xs: 3, sm: 4, md: 0 } }}>
          <Box sx={{ maxWidth: { xs: '100%', md: '580px', lg: '650px' } }}>
            <AnimatedSection>
              <Box sx={{
                mb: 3,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'fit-content',
                maxWidth: '100%',
                px: { xs: 2, md: 3 },
                py: { xs: 0.8, md: 1 },
                bgcolor: 'rgba(53, 180, 221, 0.22)',
                color: '#FFFFFF',
                border: '1px solid rgba(53, 180, 221, 0.50)',
                backdropFilter: 'blur(8px)',
                borderRadius: '9999px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <Typography component="span" sx={{
                  color: '#FFFFFF !important',
                  fontSize: { xs: '11px', sm: '12px', md: '13.5px', lg: '14px' },
                  fontWeight: 700,
                  letterSpacing: { xs: '0.04em', sm: '0.06em' },
                  textTransform: 'uppercase',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap'
                }}>
                  Refugio y Adopción en Barquisimeto
                </Typography>
              </Box>
              <Typography 
                variant="h1" 
                component="h1" 
                sx={{ 
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3.25rem', lg: '3.75rem' },
                  lineHeight: { xs: 1.15, sm: 1.15, md: 1.12 },
                  mb: 2.5,
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 8px rgba(0,0,0,0.4)'
                }}
              >
                Cambiando destinos, sanando corazones
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.90)',
                  fontSize: { xs: '1.05rem', md: '1.25rem' },
                  lineHeight: 1.6,
                  mb: 4,
                  maxWidth: '540px',
                  textShadow: '0 1px 4px rgba(0,0,0,0.3)'
                }}
              >
                Rescatamos, rehabilitamos y encontramos familias responsables para animales en situación de calle en el Estado Lara.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  component={RouterLink}
                  to="/mascotas"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    bgcolor: '#0f4c81',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    px: { xs: 2.5, md: 3.5 },
                    py: { xs: 1, md: 1.4 },
                    fontSize: { xs: '0.9rem', md: '1rem' },
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    '&:hover': {
                      bgcolor: '#0a3d6b'
                    }
                  }}
                >
                  Ver mascotas
                </Button>
                <Button
                  component={RouterLink}
                  to="/requisitos"
                  variant="outlined"
                  size="large"
                  sx={{
                    color: '#FFFFFF',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    fontWeight: 600,
                    px: { xs: 2.5, md: 3.5 },
                    py: { xs: 1, md: 1.4 },
                    fontSize: { xs: '0.9rem', md: '1rem' },
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      borderColor: '#FFFFFF',
                    },
                  }}
                >
                  ¿Cómo adoptar?
                </Button>
              </Box>
            </AnimatedSection>
          </Box>
        </Container>
      </Box>

      {/* ── Eventos y Anuncios (Lazy) ────────────────────────────────────────── */}
      <Suspense fallback={<Box sx={{ minHeight: { xs: '80px', md: '120px' } }} />}>
        <AnnouncementsSection />
      </Suspense>

      {/* ── Mascotas en busca de hogar (Lazy Carrusel) ───────────────────────── */}
      <Suspense fallback={<Box sx={{ minHeight: { xs: '450px', md: '550px' } }} />}>
        <FeaturedPetsSection />
      </Suspense>

      {/* ── Cómo funciona ────────────────────────────────────────────────────── */}
      <Box component="section" sx={{ py: { xs: 6, md: 10 }, borderTop: '1px solid rgba(30, 31, 32, 0.06)' }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography variant="overline" color="#0f4c81" fontWeight={700} letterSpacing="0.12em">
                El proceso
              </Typography>
              <Typography variant="h2" fontWeight={700} mt={0.5}>
                Adoptar es fácil
              </Typography>
            </Box>
          </AnimatedSection>

          <Grid container spacing={4}>
            {STEPS.map((step, i) => (
              <Grid key={step.title} size={{ xs: 12, md: 4 }}>
                <AnimatedSection delay={i * 100}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 3,
                      bgcolor: '#FFFFFF',
                      borderRadius: 4,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                      height: '100%',
                      position: 'relative',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 52,
                        height: 52,
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        color: 'primary.main',
                        mb: 2,
                      }}
                    >
                      {step.icon}
                    </Box>
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -14,
                        left: 24,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        bgcolor: 'rgba(53, 180, 221, 0.15)',
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      {i + 1}
                    </Box>
                    <Typography variant="h6" component="h3" fontWeight={700} gutterBottom>
                      {step.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
                      {step.desc}
                    </Typography>
                  </Box>
                </AnimatedSection>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Contacto / WhatsApp (Lazy) ───────────────────────────────────────── */}
      <Box component="section" sx={{ py: { xs: 6, md: 10 }, borderTop: '1px solid rgba(30, 31, 32, 0.06)' }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <Box sx={{ textAlign: 'center', mb: 5 }}>
              <Typography variant="overline" color="#0f4c81" fontWeight={700} letterSpacing="0.12em">
                Contáctanos
              </Typography>
              <Typography variant="h2" fontWeight={700} mt={0.5} mb={1.5}>
                ¿Cómo podemos ayudarte?
              </Typography>
              <Typography variant="body1" color="text.secondary" maxWidth={480} mx="auto">
                Toda nuestra comunicación es directa por WhatsApp.
                Sin formularios, sin esperas.
              </Typography>
            </Box>
          </AnimatedSection>

          <AnimatedSection delay={80}>
            <Suspense fallback={<Box sx={{ minHeight: { xs: '350px', md: '400px' } }} />}>
              <ContactSection />
            </Suspense>
          </AnimatedSection>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
