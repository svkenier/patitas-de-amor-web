import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import MaleIcon       from '@mui/icons-material/Male';
import FemaleIcon     from '@mui/icons-material/Female';
import PetsRoundedIcon from '@mui/icons-material/PetsRounded';
import type { BaseRecord } from '@core/types/record';
import { ITEM_IMAGE_FALLBACK } from '@core/coreConfig';

// ─── Configuración de chips de estado ────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; textColor: string }> = {
  disponible: { label: 'Disponible', color: '#E8F5E9', textColor: '#2E7D32' },
  en_proceso: { label: 'En proceso', color: '#FFF8E1', textColor: '#F57F17' },
  adoptado:   { label: 'Adoptado',   color: '#F3F4F6', textColor: '#6B7280' },
  active:     { label: 'Activo',     color: '#E8F5E9', textColor: '#2E7D32' },
  inactive:   { label: 'Inactivo',   color: '#F3F4F6', textColor: '#6B7280' },
};

const SPECIES_LABEL: Record<string, string> = {
  perro: 'Perro',
  gato:  'Gato',
  otro:  'Otro',
};

const SIZE_LABEL: Record<string, string> = {
  pequeno: 'Pequeño',
  mediano: 'Mediano',
  grande:  'Grande',
};

function getOptimizedImageUrl(url: string | undefined, width = 400): string {
  if (!url) return ITEM_IMAGE_FALLBACK;
  if (url.includes('images.weserv.nl')) return url;
  if (url.startsWith('/') || url.startsWith('data:')) return url;
  const encodedUrl = encodeURIComponent(url);
  return `https://images.weserv.nl/?url=${encodedUrl}&w=${width}&fit=cover&output=webp`;
}

interface PetCardProps {
  pet: BaseRecord;
  loading?: 'lazy' | 'eager';
  baseRoute?: string;
}

const PetCard = memo(function PetCard({ pet, loading = 'lazy', baseRoute = '/mascotas' }: PetCardProps) {
  const navigate = useNavigate();
  const status   = STATUS_CONFIG[pet.status] ?? STATUS_CONFIG.disponible;
  const isAdopted = pet.status === 'adoptado' || pet.status === 'inactive';
  
  const especie = pet.attributes?.['especie'] as string | undefined;
  const sexo = pet.attributes?.['sexo'] as string | undefined;
  const tamano = pet.attributes?.['tamano'] as string | undefined;
  const edad = pet.attributes?.['edad_aproximada'] as string | undefined;
  const destacado = pet.attributes?.['destacado'] as boolean | undefined;
  const urgente   = pet.attributes?.['urgente'] as boolean | undefined;
  const casoEspecial = pet.attributes?.['caso_especial'] as boolean | undefined;

  return (
    <Card
      sx={{
        height:      '100%',
        display:     'flex',
        flexDirection: 'column',
        opacity: isAdopted ? 0.72 : 1,
        transition: 'transform 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 250ms',
        '&:active': {
          transform: 'scale(0.98)',
        },
      }}
    >
      <CardActionArea
        onClick={() => navigate(`${baseRoute}/${pet.id}`)}
        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <Box sx={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden', bgcolor: 'grey.100' }}>
          {pet.main_image ? (
            <CardMedia
              component="img"
              loading={loading}
              fetchPriority={loading === 'eager' ? 'high' : 'auto'}
              decoding="async"
              image={getOptimizedImageUrl(pet.main_image)}
              alt={pet.title}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.fallback-icon')?.removeAttribute('hidden');
              }}
              sx={{
                position:   'absolute',
                top:        0,
                left:       0,
                width:      '100%',
                height:     '100%',
                objectFit:  'cover',
              }}
            />
          ) : null}
          {(!pet.main_image) && (
            <Box
              className="fallback-icon"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#F5F5F4',
                borderBottom: '1px solid #E7E5E4',
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'rgba(0,0,0,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PetsRoundedIcon sx={{ fontSize: 48, color: 'primary.main' }} />
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  px: 1.5,
                  py: 0.4,
                  borderRadius: 4,
                  bgcolor: '#FFFFFF',
                  border: '1px solid #E7E5E4',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: 'text.secondary',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                En adopción
              </Box>
            </Box>
          )}
          <Box
            sx={{
              position:    'absolute',
              top:          10,
              right:        10,
              px:           1.2,
              py:           0.4,
              bgcolor:      status.color,
              color:        status.textColor,
              fontSize:     '0.7rem',
              fontWeight:   700,
              letterSpacing: '0.04em',
              backdropFilter: 'blur(4px)',
            }}
          >
            {status.label}
          </Box>
          {destacado && (
            <Box
              sx={{
                position:    'absolute',
                top:          10,
                left:         10,
                px:           1.2,
                py:           0.4,
                bgcolor:      'warning.main',
                color:        'warning.contrastText',
                fontSize:     '0.7rem',
                fontWeight:   700,
                boxShadow:    '0 2px 8px rgba(255, 175, 42, 0.4)',
              }}
            >
              ⭐ Destacado
            </Box>
          )}
          {!destacado && (urgente || casoEspecial) && (
            <Box
              sx={{
                position:    'absolute',
                top:          10,
                left:         10,
                px:           1.2,
                py:           0.4,
                bgcolor:      'warning.main',
                color:        'warning.contrastText',
                fontSize:     '0.7rem',
                fontWeight:   700,
                boxShadow:    '0 2px 8px rgba(255, 175, 42, 0.4)',
              }}
            >
              ⚠️ {urgente ? 'Urgente' : 'Caso Especial'}
            </Box>
          )}
        </Box>

        <CardContent sx={{ flexGrow: 1, pb: 1, minHeight: 170 }}>
          <Typography
            variant="h6"
            component="h3"
            fontWeight={700}
            gutterBottom
            sx={{
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '2.6em',
            }}
          >
            {pet.title}
          </Typography>
          
          {(especie || sexo || tamano || edad) && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mb: 1 }}>
              {especie && (
                <Chip
                  icon={<PetsRoundedIcon sx={{ fontSize: '0.9rem !important' }} />}
                  label={SPECIES_LABEL[especie] ?? especie}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem', fontWeight: 600, height: 24 }}
                />
              )}
              {sexo === 'macho' && (
                <Chip
                  icon={<MaleIcon sx={{ fontSize: '0.9rem !important', color: '#1976D2 !important' }} />}
                  label="Macho"
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem', fontWeight: 600, height: 24 }}
                />
              )}
              {sexo === 'hembra' && (
                <Chip
                  icon={<FemaleIcon sx={{ fontSize: '0.9rem !important', color: '#C2185B !important' }} />}
                  label="Hembra"
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem', fontWeight: 600, height: 24 }}
                />
              )}
              {tamano && (
                <Chip
                  label={SIZE_LABEL[tamano] ?? tamano}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem', fontWeight: 600, height: 24 }}
                />
              )}
              {edad && (
                <Chip
                  label={edad}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem', fontWeight: 600, height: 24 }}
                />
              )}
            </Box>
          )}

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display:           '-webkit-box',
              WebkitLineClamp:   2,
              WebkitBoxOrient:   'vertical',
              overflow:          'hidden',
              lineHeight:        1.5,
              minHeight:         '3em',
            }}
          >
            {pet.description || 'Sin descripción disponible.'}
          </Typography>
        </CardContent>
      </CardActionArea>
      <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          size="small"
          disabled={isAdopted}
          onClick={() => navigate(`${baseRoute}/${pet.id}`)}
        >
          {isAdopted ? 'No disponible' : 'Conocer más'}
        </Button>
      </CardActions>
    </Card>
  );
});

export default PetCard;

export function PetCardSkeleton() {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', opacity: 0.8 }}>
      <Skeleton animation="wave" variant="rectangular" sx={{ aspectRatio: '4/3', width: '100%', height: 'auto' }} />
      <CardContent sx={{ flexGrow: 1, pb: 1, minHeight: 170 }}>
        <Typography variant="h6" gutterBottom sx={{ minHeight: '2.6em' }}>
          <Skeleton animation="wave" />
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mb: 1 }}>
          <Skeleton animation="wave" variant="rounded" width={70} height={24} />
          <Skeleton animation="wave" variant="rounded" width={60} height={24} />
          <Skeleton animation="wave" variant="rounded" width={80} height={24} />
        </Box>
        <Typography variant="body2" sx={{ minHeight: '3em' }}>
          <Skeleton animation="wave" />
          <Skeleton animation="wave" width="80%" />
        </Typography>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
        <Skeleton animation="wave" variant="rounded" width="100%" height={30.75} />
      </CardActions>
    </Card>
  );
}

