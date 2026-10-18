import Box, { type BoxProps } from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import PetsIcon from '@mui/icons-material/Pets';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { FallbackProps } from './types';

export interface CompactErrorFallbackProps extends Partial<FallbackProps> {
  /** Reserva de altura para prevenir Cumulative Layout Shift (CLS) */
  minHeight?: BoxProps['minHeight'];
  title?: string;
  message?: string;
}

export default function CompactErrorFallback({
  resetErrorBoundary,
  minHeight = { xs: '350px', md: '450px' },
  title = 'No pudimos cargar esta sección',
  message = 'Ocurrió un inconveniente temporal al procesar este contenido. Puedes reintentar sin recargar el resto de la página.',
}: CompactErrorFallbackProps) {
  return (
    <Box
      component="section"
      role="alert"
      aria-live="polite"
      sx={{
        minHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3, md: 4 },
        width: '100%',
      }}
    >
      <Card
        variant="outlined"
        sx={{
          maxWidth: 480,
          width: '100%',
          p: { xs: 3, sm: 4 },
          textAlign: 'center',
          borderRadius: 4,
          bgcolor: '#FFFFFF',
          border: '1px solid rgba(30, 31, 32, 0.08)',
          boxShadow: '0 4px 20px rgba(30, 31, 32, 0.04)',
        }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            bgcolor: 'rgba(53, 180, 221, 0.12)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            color: 'primary.main',
          }}
        >
          <PetsIcon sx={{ fontSize: 26 }} />
        </Box>

        <Typography variant="h6" component="h3" fontWeight={700} gutterBottom sx={{ fontSize: '1.1rem' }}>
          {title}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
          {message}
        </Typography>

        <Button
          variant="outlined"
          color="primary"
          size="medium"
          startIcon={<RefreshIcon />}
          onClick={resetErrorBoundary}
          sx={{
            px: 3,
            py: 0.8,
            fontWeight: 600,
            transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            '&:active': { transform: 'scale(0.97)' },
          }}
        >
          Reintentar sección
        </Button>
      </Card>
    </Box>
  );
}
