import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import Navbar from '@ui/components/Navbar';
import Footer from '@ui/components/Footer';
import SEO from '@core/media/SEO';
import AnimatedSection from '@ui/components/AnimatedSection';

export default function NotFound() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SEO title="Página no encontrada" description="La página que buscas no existe." />
      <Navbar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          py: 8,
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <AnimatedSection>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '6rem', md: '8rem' },
                fontWeight: 900,
                color: 'primary.main',
                lineHeight: 1,
                mb: 2,
              }}
            >
              404
            </Typography>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              ¡Ups! Nos hemos perdido
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              Parece que la página que estás buscando no existe o fue movida.
              Regresa al inicio para seguir explorando.
            </Typography>
            <Button
              component={RouterLink}
              to="/"
              variant="contained"
              size="large"
              startIcon={<HomeOutlinedIcon />}
              sx={{ px: 4, py: 1.5, borderRadius: 2 }}
            >
              Volver al inicio
            </Button>
          </AnimatedSection>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
