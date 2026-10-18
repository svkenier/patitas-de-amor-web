import { useMemo, useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PetsIcon from '@mui/icons-material/Pets';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PetCard, { PetCardSkeleton } from '@ui/components/PetCard';
import AnimatedSection from '@ui/components/AnimatedSection';
import EmptyState from '@ui/components/EmptyState';
import { get, formatApiError } from '@core/api/client';
import type { BaseRecord, PaginatedRecords } from '@core/types/record';

export default function FeaturedPetsSection() {
  const theme = useTheme();

  // Fetch del índice de mascotas desde el CDN
  const { data, isLoading, isError, error } = useQuery<PaginatedRecords>({
    queryKey: ['pets-index'],
    queryFn: async () => {
      const res = await get<BaseRecord[] | { records: BaseRecord[] }>('/public/pets');
      const records = Array.isArray(res) ? res : (res?.records ?? []);
      return { 
        records: records, 
        page: 1,
        limit: records.length,
        total: records.length 
      } as PaginatedRecords;
    },
  });

  // Mostrar hasta 8 mascotas: priorizar destacadas, rellenar con recientes
  const displayPets = useMemo(() => {
    if (!data?.records) return [];
    return data.records
      .filter((p) => p.status !== 'adoptado' && p.attributes?.is_active !== false)
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

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap?.() ?? 0);
    };

    const onInit = () => {
      setScrollSnaps(emblaApi.scrollSnapList?.() ?? []);
      onSelect();
    };

    emblaApi.on('reInit', onInit).on('select', onSelect);
    queueMicrotask(onInit);

    return () => {
      emblaApi.off('reInit', onInit).off('select', onSelect);
    };
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  return (
    <Box component="section" sx={{ py: { xs: 6, md: 10 }, borderTop: '1px solid rgba(30, 31, 32, 0.06)', contentVisibility: 'auto', containIntrinsicSize: 'auto 500px' }}>
      <Container maxWidth="lg">
        <AnimatedSection>
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Typography variant="overline" color="#0f4c81" fontWeight={700} letterSpacing="0.12em">
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

                <Box sx={{ overflow: 'hidden', p: { xs: 2, sm: 3 }, m: { xs: -2, sm: -3 } }} ref={emblaRef}>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      touchAction: 'pan-y', 
                      ml: { xs: -2, sm: -3 },
                    }}
                  >
                    {isLoading
                      ? Array.from({ length: itemsVisible }).map((_, i) => (
                          <Box key={i} sx={{ 
                            flex: '0 0 auto', 
                            minWidth: 0, 
                            pl: { xs: 2, sm: 3 }, 
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
                            pl: { xs: 2, sm: 3 }, 
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
  );
}
