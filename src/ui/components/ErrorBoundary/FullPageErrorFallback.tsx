import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import PetsIcon from '@mui/icons-material/Pets';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { Link as RouterLink } from 'react-router-dom';
import type { FallbackProps } from './types';

export default function FullPageErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <Box
      component="main"
      role="alert"
      aria-live="assertive"
      sx={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
        py: 8,
        bgcolor: '#FAF9F6',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, sm: 6 },
            textAlign: 'center',
            borderRadius: 4,
            bgcolor: '#FFFFFF',
            border: '1px solid rgba(30, 31, 32, 0.08)',
            boxShadow: '0 8px 30px rgba(30, 31, 32, 0.06)',
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: 'rgba(53, 180, 221, 0.12)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              color: 'primary.main',
            }}
          >
            <PetsIcon sx={{ fontSize: 36 }} />
          </Box>

          <Typography variant="h3" component="h1" fontWeight={800} gutterBottom sx={{ fontSize: { xs: '1.75rem', sm: '2.1rem' } }}>
            ¡Una patita tropezó en el camino!
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 440, mx: 'auto', lineHeight: 1.6 }}>
            Tuvimos un inconveniente inesperado al cargar esta página. Nuestros peluditos están a salvo;
            intentemos recargar la vista o regresar al inicio.
          </Typography>

          {import.meta.env.DEV && error?.message && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                bgcolor: 'rgba(220, 38, 38, 0.06)',
                borderRadius: 2,
                border: '1px solid rgba(220, 38, 38, 0.2)',
                textAlign: 'left',
                overflowX: 'auto',
              }}
            >
              <Typography variant="caption" component="pre" color="error.main" sx={{ fontFamily: 'monospace', m: 0, whiteSpace: 'pre-wrap' }}>
                {error.message}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<RefreshIcon />}
              onClick={resetErrorBoundary}
              sx={{
                px: 3.5,
                py: 1.2,
                fontWeight: 700,
                transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 200ms',
                '&:active': { transform: 'scale(0.97)' },
              }}
            >
              Reintentar
            </Button>
            <Button
              component={RouterLink}
              to="/"
              variant="outlined"
              size="large"
              startIcon={<HomeOutlinedIcon />}
              onClick={resetErrorBoundary}
              sx={{
                px: 3.5,
                py: 1.2,
                fontWeight: 600,
                borderColor: 'rgba(30, 31, 32, 0.15)',
                color: '#1E1F20',
                transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                '&:active': { transform: 'scale(0.97)' },
                '&:hover': { bgcolor: '#F8FAFC', borderColor: '#1E1F20' },
              }}
            >
              Ir al Inicio
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
