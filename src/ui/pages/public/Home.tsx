/**
 * Home — Portada principal de petRescue.
 *
 * Secciones:
 * 1. Hero — gradient terracota→salvia, headline principal, CTAs.
 * 2. Mascotas Destacadas — grid de PetCard con TanStack Query.
 * 3. Cómo funciona — 3 pasos con iconos.
 * 4. Contacto — ContactSection (3 canales WhatsApp).
 */

import { useMemo, useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid2';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import { useTheme, alpha } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import SearchOutlinedIcon      from '@mui/icons-material/SearchOutlined';
import ChatOutlinedIcon        from '@mui/icons-material/ChatOutlined';
import HomeOutlinedIcon        from '@mui/icons-material/HomeOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PetsIcon from '@mui/icons-material/Pets';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ChevronLeftIcon   from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon  from '@mui/icons-material/ChevronRight';
import Navbar          from '@ui/components/Navbar';
import Footer          from '@ui/components/Footer';
import PetCard, { PetCardSkeleton } from '@ui/components/PetCard';
import AnimatedSection from '@ui/components/AnimatedSection';
import ContactSection  from '@ui/components/ContactSection';
import AnnouncementsSection from '@ui/components/AnnouncementsSection';
import EmptyState      from '@ui/components/EmptyState';
import SEO             from '@core/media/SEO';
import { get, formatApiError } from '@core/api/client';
import type { BaseRecord, PaginatedRecords } from '@core/types/record';

// ─── Pasos de adopción ────────────────────────────────────────────────────────

const STEPS = [
  {
    icon:     <SearchOutlinedIcon sx={{ fontSize: 28 }} />,
    title:    'Explora las mascotas',
    desc:     'Conoce a nuestras mascotas, lee sus historias y encuentra la que conecte contigo.',
  },
  {
    icon:     <ChatOutlinedIcon sx={{ fontSize: 28 }} />,
    title:    'Contáctanos por WhatsApp',
    desc:     'Escríbenos directamente. Te informamos sobre el proceso y requisitos de adopción.',
  },
  {
    icon:     <HomeOutlinedIcon sx={{ fontSize: 28 }} />,
    title:    '¡Bienvenido a casa!',
    desc:     'Firma el acuerdo, prepara el espacio y dale a tu nueva mascota el hogar que merece.',
  },
];

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Home() {
  // Fetch del índice de mascotas desde el CDN
  const { data, isLoading, isError, error } = useQuery<PaginatedRecords>({
    queryKey: ['pets-index'],
    queryFn: async () => {
      const res = await get<{ records: BaseRecord[] }>('/public/pets');
      const records = res.records ?? [];
      return { 
        records: records, 
        page: 1,
        limit: records.length,
        total: records.length 
      } as PaginatedRecords;
    },
    staleTime: 5 * 60 * 1000,
  });

  const theme = useTheme();

  // Mostrar hasta 8 mascotas: priorizar destacadas, rellenar con recientes
  const displayPets = useMemo(() => {
    if (!data?.records) return [];
    return data.records
      .filter((p) => p.status !== 'adoptado')
      .sort((a, b) => {
        const aDestacado = Boolean(a.attributes?.destacado);
        const bDestacado = Boolean(b.attributes?.destacado);
        if (aDestacado && !bDestacado) return -1;
        if (!aDestacado && bDestacado) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 8);
  }, [data]);
  
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const itemsVisible = isDesktop ? 3 : isTablet ? 2 : 1;
  const loopActive = displayPets.length > itemsVisible;
  const hasMultiplePets = displayPets.length > 1;
  const hasPets = displayPets.length > 0;

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: loopActive,
    align: 'start',
    active: loopActive,
    watchDrag: hasMultiplePets,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onInit = useCallback((emblaApi: any) => {
    setScrollSnaps(emblaApi.scrollSnapList());
  }, []);

  const onSelect = useCallback((emblaApi: any) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onInit(emblaApi);
    onSelect(emblaApi);
    emblaApi.on('reInit', onInit).on('reInit', onSelect).on('select', onSelect);
  }, [emblaApi, onInit, onSelect]);

  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SEO 
        title="Inicio — Patitas de Amor Barquisimeto" 
        description="Fundación de rescate y adopción responsable de perros y gatos en Barquisimeto. Encuentra a tu compañero ideal." 
      />
      <Navbar />

      {/* ── Hero (Split Layout / Sharp UI) ──────────────────────────────────── */}
      <Box
        component="section"
        sx={{
          position: 'relative',
          minHeight: { xs: '75vh', md: '80vh' },
          display: 'flex',
          alignItems: 'center',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: {
              xs: 'linear-gradient(90deg, rgba(13, 34, 53, 0.95) 0%, rgba(13, 34, 53, 0.70) 50%, rgba(13, 34, 53, 0) 100%)',
              md: 'linear-gradient(135deg, rgba(13, 34, 53, 0.90) 0%, rgba(13, 34, 53, 0.65) 50%, rgba(13, 34, 53, 0.40) 100%)'
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
              objectPosition: { xs: 'right bottom', md: 'center right' }
            }
          }}
        >
          <source media="(min-width: 900px)" srcSet="/hero-desktop.webp" width="1920" height="1080" />
          <img
            src="/hero-mobile.webp"
            alt="Perros y gatos rescatados por Patitas de Amor Barquisimeto"
            fetchPriority="high"
            loading="eager"
            width="800"
            height="1200"
          />
        </Box>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ maxWidth: { xs: '75%', sm: '65%', md: '750px' } }}>
            <AnimatedSection>
              <Chip
                label="Rescate · Rehabilitación · Adopción · Barquisimeto"
                sx={{
                  mb: 3,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: 'primary.light',
                  border: (theme) => `1px solid ${theme.palette.primary.light}`,
                  fontWeight: 600,
                  backdropFilter: 'blur(4px)',
                }}
              />
            </AnimatedSection>

            <AnimatedSection delay={80}>
              <Typography
                variant="h2"
                component="h1"
                fontWeight={800}
                color="common.white"
                mb={2.5}
                sx={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
              >
                Dale una segunda oportunidad a quien más lo necesita
              </Typography>
            </AnimatedSection>

            <AnimatedSection delay={160}>
              <Typography
                variant="body1"
                mb={4.5}
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: { xs: '1rem', md: '1.2rem' },
                }}
              >
                En Patitas de Amor rescatamos, rehabilitamos y buscamos hogares responsables para perros y gatos en Barquisimeto. Juntos, salvamos vidas.
              </Typography>
            </AnimatedSection>

            <AnimatedSection delay={240}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  component={RouterLink}
                  to="/mascotas"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    fontWeight: 700,
                    '&:hover': { bgcolor: 'primary.dark' },
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
                    color: 'primary.light',
                    borderColor: 'primary.light',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.light, 0.1),
                      borderColor: 'primary.light',
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

      {/* ── Eventos y Anuncios ─────────────────────────────────────────────── */}
      <AnnouncementsSection />

      {/* ── Mascotas en busca de hogar ───────────────────────────────────────── */}

      <Box component="section" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default', contentVisibility: 'auto', containIntrinsicSize: 'auto 500px' }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <Box sx={{ textAlign: 'center', mb: 5 }}>
              <Typography variant="overline" color="primary" fontWeight={700} letterSpacing="0.12em">
                Adopción responsable
              </Typography>
              <Typography variant="h2" fontWeight={700} mt={0.5} mb={1.5}>
                Mascotas en busca de hogar
              </Typography>
              <Typography variant="body1" color="text.secondary" maxWidth={480} mx="auto">
                Cada uno tiene una historia. Encuentra a tu compañero ideal y
                cambia su vida para siempre.
              </Typography>
            </Box>
          </AnimatedSection>

          {isError ? (
            <AnimatedSection>
              <Box component={Card} variant="outlined" sx={{ bgcolor: 'transparent', textAlign: 'center', py: 8, borderColor: 'error.light' }}>
                <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
                <Typography variant="h6" component="h3" color="error.main" fontWeight={600} gutterBottom>
                  Error al cargar la lista de mascotas
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatApiError(error, 'Por favor, intenta nuevamente más tarde o contacta al administrador.')}
                </Typography>
              </Box>
            </AnimatedSection>
          ) : (
            <>
              {(isLoading || hasPets) && (
                <Box sx={{ position: 'relative', px: { xs: 0, md: 6 } }}>
                {isDesktop && loopActive && hasMultiplePets && (
                  <IconButton 
                    aria-label="Ver mascotas anteriores"
                    onClick={() => emblaApi && emblaApi.scrollPrev()}
                    sx={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 2, bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: 'grey.100' } }}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                )}

                <Box sx={{ overflow: 'hidden' }} ref={emblaRef}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      touchAction: 'pan-y', 
                      ml: loopActive ? { xs: 0, sm: -2, md: -3 } : 0,
                      justifyContent: loopActive ? 'flex-start' : 'center',
                      gap: loopActive ? 0 : { xs: 2, sm: 3 }
                    }}
                  >
                    {isLoading
                      ? Array.from({ length: itemsVisible }).map((_, i) => (
                          <Box key={i} sx={{ 
                            flex: '0 0 auto', 
                            minWidth: 0, 
                            pl: loopActive ? { xs: 0, sm: 2, md: 3 } : 0, 
                            width: { xs: '100%', sm: '50%', md: '33.3333%' } 
                          }}>
                            <Box sx={{ maxWidth: { xs: '92%', sm: 'none' }, mx: 'auto', height: '100%' }}>
                              <PetCardSkeleton />
                            </Box>
                          </Box>
                        ))
                      : displayPets?.map((pet, i) => (
                          <Box key={pet?.id || i} sx={{ 
                            flex: '0 0 auto', 
                            minWidth: 0, 
                            pl: loopActive ? { xs: 0, sm: 2, md: 3 } : 0, 
                            width: { xs: '100%', sm: '50%', md: '33.3333%' } 
                          }}>
                            <AnimatedSection delay={i * 60} sx={{ height: '100%' }}>
                              <Box sx={{ maxWidth: { xs: '92%', sm: 'none' }, mx: 'auto', height: '100%' }}>
                                {pet ? <PetCard pet={pet} /> : null}
                              </Box>
                            </AnimatedSection>
                          </Box>
                        ))}
                  </Box>
                </Box>

                {isDesktop && loopActive && hasMultiplePets && (
                  <IconButton 
                    aria-label="Ver mascotas siguientes"
                    onClick={() => emblaApi && emblaApi.scrollNext()}
                    sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 2, bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: 'grey.100' } }}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                )}

                {/* Dots */}
                {!isLoading && hasMultiplePets && scrollSnaps.length > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 3 }}>
                    {scrollSnaps.map((_, i) => (
                      <Box
                        key={i}
                        onClick={() => scrollTo(i)}
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: i === selectedIndex ? 'primary.main' : 'grey.300',
                          cursor: 'pointer',
                          transition: 'background-color 0.3s',
                          '&:hover': { bgcolor: 'primary.light' }
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
              )}

              {!isLoading && hasPets && (
                <AnimatedSection sx={{ textAlign: 'center', mt: 5 }}>
                  <Button
                    component={RouterLink}
                    to="/mascotas"
                    variant="outlined"
                    color="primary"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    sx={{ px: 4 }}
                  >
                    Ver todas las mascotas
                  </Button>
                </AnimatedSection>
              )}

              {!isLoading && !hasPets && (
                <AnimatedSection>
                  <EmptyState 
                    icon={<PetsIcon />}
                    title="No hay mascotas registradas por el momento"
                    description="Pronto publicaremos nuevos peludos que buscan un hogar lleno de amor."
                  />
                </AnimatedSection>
              )}
            </>
          )}
        </Container>
      </Box>

      {/* ── Cómo funciona ────────────────────────────────────────────────────── */}
      <Box component="section" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#F8FAFC' }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography variant="overline" color="secondary" fontWeight={700} letterSpacing="0.12em">
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
                      p:         3,
                      bgcolor:   'background.paper',
                      border:    '1px solid',
                      borderColor: 'divider',
                      height:    '100%',
                      position:  'relative',
                    }}
                  >
                    <Box
                      sx={{
                        display:  'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width:    52,
                        height:   52,
                        bgcolor:  alpha(theme.palette.primary.main, 0.12),
                        color:    'primary.main',
                        mb:       2,
                      }}
                    >
                      {step.icon}
                    </Box>
                    <Box
                      sx={{
                        position: 'absolute',
                        top:      16,
                        left:     16,
                        width:    28,
                        height:   28,
                        bgcolor:  'primary.main',
                        color:    'white',
                        display:  'flex',
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

      {/* ── Contacto / WhatsApp ────────────────────────────────────────────── */}
      <Box component="section" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <AnimatedSection>
            <Box sx={{ textAlign: 'center', mb: 5 }}>
              <Typography variant="overline" color="primary" fontWeight={700} letterSpacing="0.12em">
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
            <ContactSection />
          </AnimatedSection>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
