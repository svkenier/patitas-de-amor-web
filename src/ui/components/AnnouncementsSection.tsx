/**
 * AnnouncementsSection — Sección pública para visualizar eventos activos
 */

import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { useQuery } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon    from '@mui/icons-material/AccessTime';
import LocationOnIcon    from '@mui/icons-material/LocationOn';
import WhatsAppIcon      from '@mui/icons-material/WhatsApp';
import CampaignIcon      from '@mui/icons-material/Campaign';
import CampaignRoundedIcon from '@mui/icons-material/CampaignRounded';
import ErrorOutlineIcon  from '@mui/icons-material/ErrorOutline';
import ChevronLeftIcon   from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon  from '@mui/icons-material/ChevronRight';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { get, formatApiError } from '@core/api/client';
import AnimatedSection from '@ui/components/AnimatedSection';
import EmptyState      from '@ui/components/EmptyState';
import type { BaseRecord } from '@core/types/record';
import { ITEM_IMAGE_FALLBACK } from '@core/coreConfig';
import { DEFAULT_SETTINGS, type Settings } from '@core/types/settings';

import { TYPE_COLORS, TYPE_TEXT_COLORS, TYPE_LABELS } from '@core/utils/recordHelpers';

function formatDateNatural(dateString: string): string {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    if (!isNaN(date.getTime())) {
      const dayStr = day.padStart(2, '0');
      const monthNames = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
      ];
      const monthStr = monthNames[date.getMonth()];
      return `${dayStr} de ${monthStr} del ${year}`;
    }
  }
  return dateString;
}



function AnnouncementCard({ announcement, whatsappNumber }: { announcement: BaseRecord; whatsappNumber: string }) {
  const [expanded, setExpanded] = useState(false);
  const message = 
`¡Hola! Quisiera consultar más información sobre: *${announcement.title}*

¿Podrían darme más detalles al respecto?`;
  const text = encodeURIComponent(message);
  const waUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${text}` : '#';
  const isLong = announcement.description.length > 120;

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ position: 'relative' }}>
        {announcement.main_image ? (
          <CardMedia
            component="img"
            loading="lazy"
            height="220"
            image={announcement.main_image}
            alt={announcement.title ? `Imagen de ${announcement.title}` : 'Imagen del anuncio'}
            sx={{ objectFit: 'cover' }}
          />
        ) : (
          <Box
            sx={{
              height: 220,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${TYPE_COLORS[announcement.type] ?? '#7C3AED'}22 0%, ${TYPE_COLORS[announcement.type] ?? '#7C3AED'}44 100%)`,
              borderBottom: `3px solid ${TYPE_COLORS[announcement.type] ?? '#7C3AED'}55`,
            }}
          >
            <Box
              sx={{
                width: 88,
                height: 88,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.60)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 6px 24px ${TYPE_COLORS[announcement.type] ?? '#7C3AED'}33`,
              }}
            >
              <CampaignRoundedIcon
                sx={{
                  fontSize: 52,
                  color: TYPE_COLORS[announcement.type] ?? '#7C3AED',
                }}
              />
            </Box>
          </Box>
        )}
        <Chip
          label={TYPE_LABELS[announcement.type] || 'Evento'}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            fontWeight: 700,
            backdropFilter: 'blur(4px)',
            bgcolor: TYPE_COLORS[announcement.type] || '#71717A',
            color: TYPE_TEXT_COLORS[announcement.type] || '#FFFFFF'
          }}
        />
      </Box>
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h6" component="h3" fontWeight={700} gutterBottom lineHeight={1.2}>
          {announcement.title}
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
            <CalendarTodayIcon fontSize="small" />
            <Typography variant="body2">
              {announcement.type === 'perdida' 
                ? (announcement.attributes?.date ? `Visto por última vez: ${formatDateNatural(announcement.attributes.date as string)}${announcement.attributes.time ? ` a las ${announcement.attributes.time}` : ''}` : 'Fecha no especificada')
                : formatDateNatural((announcement.attributes?.date as string) || '')
              }
            </Typography>
          </Box>
          
          {announcement.type !== 'perdida' && announcement.attributes?.time && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
              <AccessTimeIcon fontSize="small" />
              <Typography variant="body2">{announcement.attributes.time as string}</Typography>
            </Box>
          )}

          {announcement.attributes?.location && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, color: 'text.secondary' }}>
              <LocationOnIcon fontSize="small" sx={{ mt: 0.3 }} />
              <Typography variant="body2" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {announcement.type === 'perdida' ? `Última ubicación: ${announcement.attributes.location}` : announcement.attributes.location as string}
              </Typography>
            </Box>
          )}
        </Box>

        <Box>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={!expanded ? { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : { whiteSpace: 'pre-line' }}
          >
            {announcement.description}
          </Typography>
          {isLong && (
            <Typography
              variant="body2"
              component="span"
              onClick={() => setExpanded(!expanded)}
              sx={{
                color: 'primary.main',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'inline-block',
                mt: 0.5,
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {expanded ? 'Ver menos' : 'Ver más'}
            </Typography>
          )}
        </Box>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0, mt: 'auto' }}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          startIcon={<WhatsAppIcon />}
          href={waUrl}
          disabled={!whatsappNumber}
          aria-label={`Más Información sobre ${announcement.title}`}
        >
          <Typography component="span" sx={{ color: 'primary.contrastText', fontSize: 'inherit', fontWeight: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit' }}>
            Más Información 
            <Box component="span" sx={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
              sobre {announcement.title}
            </Box>
          </Typography>
        </Button>
      </CardActions>
    </Card>
  );
}

export default function AnnouncementsSection() {
  const { data: settings } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await get<Settings | {}>('/settings');
      return res as Settings;
    },
    staleTime: 5 * 60 * 1000,
    initialData: DEFAULT_SETTINGS,
  });
  
  const { data: announcements, isLoading, isError, error } = useQuery<BaseRecord[]>({
    queryKey: ['announcements-public'],
    queryFn: async () => {
      const data = await get<any>('/public/announcements');
      return Array.isArray(data) ? data : (data?.announcements || []);
    },
    staleTime: 5 * 60 * 1000,
  });

  const activeAnnouncements = announcements?.filter(a => 
    a && (
      a.status === 'active' || 
      (a as any).is_active === true || 
      String((a as any).is_active) === 'true' || 
      ((a as any).is_active as unknown) === 1
    )
  ) || [];

  const orderedAnnouncements = activeAnnouncements;

  const whatsappNumber = settings?.whatsapp ? settings.whatsapp.replace(/\D/g, '') : '';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const itemsVisible = isDesktop ? 3 : isTablet ? 2 : 1;
  const loopActive = orderedAnnouncements.length > itemsVisible;

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: loopActive,
    align: 'start',
    active: loopActive,
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
    <Box component="section" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default', contentVisibility: 'auto', containIntrinsicSize: 'auto 500px' }}>
      <Container maxWidth="lg">
        <AnimatedSection>
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Typography variant="overline" color="primary" fontWeight={700} letterSpacing="0.12em">
              Próximos Eventos y Jornadas
            </Typography>
            <Typography variant="h3" component="h2" fontWeight={700} mt={0.5} mb={1.5}>
              ¡Participa y ayúdanos a ayudar!
            </Typography>
            <Typography variant="body1" color="text.secondary" maxWidth={500} mx="auto">
              Únete a nuestras actividades para seguir transformando las vidas de cientos de peluditos.
            </Typography>
          </Box>
        </AnimatedSection>

        {isError ? (
          <AnimatedSection>
            <Box component={Card} variant="outlined" sx={{ bgcolor: 'transparent', textAlign: 'center', py: 8, borderColor: 'error.light' }}>
              <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="h6" component="h3" color="error.main" fontWeight={600} gutterBottom>
                Error al cargar los eventos
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatApiError(error, 'Por favor, intenta nuevamente más tarde o contacta al administrador.')}
              </Typography>
            </Box>
          </AnimatedSection>
        ) : (
          <>
            {(!isLoading && activeAnnouncements.length === 0) ? (
              <AnimatedSection>
                <EmptyState
                  icon={<CampaignIcon />}
                  title="No hay eventos ni anuncios activos"
                  description="Mantente atento a nuestras próximas jornadas y actividades comunitarias."
                />
              </AnimatedSection>
            ) : (
              <Box sx={{ position: 'relative', px: { xs: 0, md: 6 } }}>
                {!isMobile && loopActive && (
                  <IconButton aria-label="Acción" 
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
                              <Card sx={{ height: '100%' }}>
                                <Skeleton variant="rectangular" height={220} />
                                <CardContent>
                                  <Skeleton variant="text" width="60%" height={32} />
                                  <Skeleton variant="text" width="100%" height={24} />
                                  <Skeleton variant="text" width="80%" height={24} />
                                </CardContent>
                              </Card>
                            </Box>
                          </Box>
                        ))
                      : orderedAnnouncements?.map((announcement, i) => (
                          <Box key={announcement?.id || i} sx={{ 
                            flex: '0 0 auto', 
                            minWidth: 0, 
                            pl: loopActive ? { xs: 0, sm: 2, md: 3 } : 0, 
                            width: { xs: '100%', sm: '50%', md: '33.3333%' } 
                          }}>
                            <AnimatedSection delay={i * 100} sx={{ height: '100%' }}>
                              <Box sx={{ maxWidth: { xs: '92%', sm: 'none' }, mx: 'auto', height: '100%' }}>
                                {announcement ? <AnnouncementCard announcement={announcement} whatsappNumber={whatsappNumber} /> : null}
                              </Box>
                            </AnimatedSection>
                          </Box>
                        ))}
                  </Box>
                </Box>

                {!isMobile && loopActive && (
                  <IconButton aria-label="Acción" 
                    onClick={() => emblaApi && emblaApi.scrollNext()}
                    sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 2, bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: 'grey.100' } }}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                )}

                {/* Pagination Dots */}
                {!isLoading && scrollSnaps.length > 1 && (
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
          </>
        )}
      </Container>
    </Box>
  );
}
