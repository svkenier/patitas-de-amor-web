/**
 * Footer — Pie de página institucional.
 */

import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon    from '@mui/icons-material/Phone';
import EmailIcon    from '@mui/icons-material/Email';
import PlaceIcon    from '@mui/icons-material/Place';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon  from '@mui/icons-material/Twitter';
import Skeleton     from '@mui/material/Skeleton';
import { getDonationUrl, getEmergencyUrl, getGenericInfoUrl, getVolunteerUrl, openWhatsApp } from '@ui/utils/whatsapp';
import { get } from '@core/api/client';
import { DEFAULT_SETTINGS } from '@core/types/settings';
import type { Settings } from '@core/types/settings';

const NAV_LINKS = [
  { label: 'Inicio',      to: '/' },
  { label: 'Mascotas',    to: '/mascotas' },
  { label: 'Requisitos',  to: '/requisitos' },
];

const LEGAL_LINKS = [
  { label: 'Términos y Condiciones', to: '/terminos' },
  { label: 'Política de Privacidad', to: '/privacidad' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await get<Settings | {}>('/settings');
      if (Object.keys(res).length === 0) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...res } as Settings;
    },
    initialData: DEFAULT_SETTINGS,
  });

  const config = settings || DEFAULT_SETTINGS;
  const phone = config.whatsapp;


  // Map logic
  let finalMapEmbedUrl = '';
  let finalMapLinkUrl = '';

  if (config.map_url || config.address) {
    let query = config.address || '';
    if (!query && config.map_url) {
      if (config.map_url.includes('/place/')) {
        const match = config.map_url.match(/\/place\/([^/]+)/);
        if (match) query = decodeURIComponent(match[1].replace(/\+/g, ' '));
      } else if (config.map_url.includes('?q=')) {
        const match = config.map_url.match(/[?&]q=([^&]+)/);
        if (match) query = decodeURIComponent(match[1].replace(/\+/g, ' '));
      } else if (!config.map_url.startsWith('http')) {
        query = config.map_url;
      }
    }
    if (!query) query = config.map_url || '';

    finalMapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    finalMapLinkUrl = config.map_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  return (
    <Box
      component="footer"
      sx={{
        bgcolor:    '#1E1F20', // Carbon
        color:      'rgba(255, 255, 255, 0.8)',
        mt:         'auto',
        pt:         6,
        pb:         3,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} mb={4}>

          {/* Columna 1: Marca + misión + Redes Sociales */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box component="img" src="/logo-white.svg" alt="Patitas de Amor Barquisimeto" sx={{ height: { xs: 54, md: 60 }, width: 'auto', objectFit: 'contain' }} />
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.92)' }} lineHeight={1.8}>
              Somos una fundación sin fines de lucro en Barquisimeto dedicada al rescate, rehabilitación médica y adopción responsable de perros y gatos. Operamos 100% con voluntarios y donaciones de la comunidad.
            </Typography>

            {/* Redes Sociales */}
            <Box sx={{ mt: 3, display: 'flex', gap: 1.5 }}>
              {config.whatsapp && (
                <IconButton
                  href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Contactar por WhatsApp"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    color: 'rgba(255, 255, 255, 0.90)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 0,
                    transition: 'all 0.25s ease-in-out',
                    '&:hover': {
                      bgcolor: '#25D366',
                      borderColor: '#25D366',
                      color: '#FFFFFF',
                      boxShadow: '0 0 12px rgba(37, 211, 102, 0.4)'
                    }
                  }}
                >
                  <WhatsAppIcon />
                </IconButton>
              )}
              {config.social_links?.facebook && (
                <IconButton
                  href={config.social_links.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visitar nuestro perfil de Facebook"
                  sx={{ bgcolor: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', borderRadius: '50%', transition: 'all 0.2s ease-in-out', '&:hover': { bgcolor: '#1877F2', color: '#FFFFFF' } }}
                >
                  <FacebookIcon />
                </IconButton>
              )}
              {config.social_links?.instagram && (
                <IconButton
                  href={config.social_links.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visitar nuestro perfil de Instagram"
                  sx={{ bgcolor: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', borderRadius: '50%', transition: 'all 0.2s ease-in-out', '&:hover': { bgcolor: '#E4405F', color: '#FFFFFF' } }}
                >
                  <InstagramIcon />
                </IconButton>
              )}
              {config.social_links?.twitter && (
                <IconButton
                  href={config.social_links.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visitar nuestro perfil de Twitter / X"
                  sx={{ bgcolor: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', borderRadius: '50%', transition: 'all 0.2s ease-in-out', '&:hover': { bgcolor: '#000000', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.35)' } }}
                >
                  <TwitterIcon />
                </IconButton>
              )}
            </Box>
          </Grid>

          {/* Columna 2: Navegación */}
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <Typography variant="overline" color="#FFFFFF" fontWeight={600} fontSize="1rem" letterSpacing="0.5px" display="block" mb={2.5} sx={{ textTransform: 'none' }}>
              Navegación
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.to}
                  component={RouterLink}
                  to={l.to}
                  underline="none"
                  sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.95rem', transition: 'color 0.2s ease-in-out', '&:hover': { color: '#35b4dd' } }}
                >
                  {l.label}
                </Link>
              ))}
            </Box>
          </Grid>

          {/* Columna 3: Contacto (Acciones) */}
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <Typography variant="overline" color="#FFFFFF" fontWeight={600} fontSize="1rem" letterSpacing="0.5px" display="block" mb={2.5} sx={{ textTransform: 'none' }}>
              Contacto
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Link component="button" variant="body2" onClick={() => openWhatsApp(getGenericInfoUrl(phone))} sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.95rem', '&:hover': { color: '#35b4dd' }, textAlign: 'left', display: 'block' }}>
                Adoptar
              </Link>
              <Link component="button" variant="body2" onClick={() => openWhatsApp(getVolunteerUrl(phone))} sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.95rem', '&:hover': { color: '#35b4dd' }, textAlign: 'left', display: 'block' }}>
                Ser Voluntario
              </Link>
              <Link component="button" variant="body2" onClick={() => openWhatsApp(getDonationUrl(phone))} sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.95rem', '&:hover': { color: '#35b4dd' }, textAlign: 'left', display: 'block' }}>
                Donaciones
              </Link>
              <Link component="button" variant="body2" onClick={() => openWhatsApp(getEmergencyUrl(phone))} sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.95rem', '&:hover': { color: '#35b4dd' }, textAlign: 'left', display: 'block' }}>
                Reportar Emergencia
              </Link>
            </Box>
          </Grid>

          {/* Columna 4: Información de Contacto y Mapa */}
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <Typography variant="overline" color="#FFFFFF" fontWeight={600} fontSize="1rem" letterSpacing="0.5px" display="block" mb={2.5} sx={{ textTransform: 'none' }}>
              Información de Contacto
            </Typography>
            
            {isLoading ? (
              <Skeleton sx={{ bgcolor: 'rgba(255,255,255, 0.1)' }} height={80} />
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                {config.phone && (
                  <Link href={`tel:${config.phone.replace(/\s+/g, '')}`} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', color: 'rgba(255, 255, 255, 0.75)', transition: 'color 0.2s ease-in-out', cursor: 'pointer', textDecoration: 'none', '&:hover': { color: '#35b4dd', '& .contact-icon': { transform: 'scale(1.15)', filter: 'brightness(1.2)' } } }}>
                    <PhoneIcon className="contact-icon" sx={{ fontSize: '1.2rem', color: '#35b4dd', flexShrink: 0, transition: 'all 0.2s ease-in-out' }} /> 
                    <Typography sx={{ color: 'inherit', fontSize: '0.95rem', fontWeight: 400, transition: 'color 0.2s ease-in-out' }}>{config.phone}</Typography>
                  </Link>
                )}
                {config.email && (
                  <Link href={`mailto:${config.email}`} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', color: 'rgba(255, 255, 255, 0.75)', transition: 'color 0.2s ease-in-out', cursor: 'pointer', textDecoration: 'none', '&:hover': { color: '#35b4dd', '& .contact-icon': { transform: 'scale(1.15)', filter: 'brightness(1.2)' } } }}>
                    <EmailIcon className="contact-icon" sx={{ fontSize: '1.2rem', color: '#35b4dd', flexShrink: 0, transition: 'all 0.2s ease-in-out' }} /> 
                    <Typography sx={{ color: 'inherit', fontSize: '0.95rem', fontWeight: 400, transition: 'color 0.2s ease-in-out' }}>{config.email}</Typography>
                  </Link>
                )}
                {config.address && (
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', color: 'rgba(255, 255, 255, 0.75)', transition: 'color 0.2s ease-in-out', cursor: 'pointer', '&:hover': { color: '#35b4dd', '& .contact-icon': { transform: 'scale(1.15)', filter: 'brightness(1.2)' } } }}>
                    <PlaceIcon className="contact-icon" sx={{ fontSize: '1.2rem', color: '#35b4dd', flexShrink: 0, mt: 0.3, transition: 'all 0.2s ease-in-out' }} /> 
                    <Typography sx={{ color: 'inherit', fontSize: '0.95rem', fontWeight: 400, transition: 'color 0.2s ease-in-out' }}>{config.address}</Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Mapa */}
            {finalMapEmbedUrl && (
              <Link
                href={finalMapLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir mapa en nueva pestaña"
                sx={{
                  display: 'block',
                  width: '100%',
                  height: 140,
                  overflow: 'hidden',
                  borderRadius: 2,
                  opacity: 0.9,
                  transition: 'opacity 0.2s',
                  '&:hover': { opacity: 1 }
                }}
              >
                <iframe
                  title="Ubicación del Refugio"
                  src={finalMapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0, pointerEvents: 'none' }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </Link>
            )}
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 2.5 }} />

        {/* Bottom bar */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            © {year} Patitas de Amor Barquisimeto · Todos los derechos reservados
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.to}
                component={RouterLink}
                to={l.to}
                underline="hover"
                sx={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.75rem', '&:hover': { color: '#35b4dd' } }}
              >
                {l.label}
              </Link>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
