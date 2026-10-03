/**
 * Terms — Términos y Condiciones (/terminos).
 */

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import GavelIcon from '@mui/icons-material/Gavel';
import Navbar from '@ui/components/Navbar';
import Footer from '@ui/components/Footer';
import AnimatedSection from '@ui/components/AnimatedSection';
import SEO from '@core/media/SEO';

const SECTIONS = [
  {
    title: '1. Naturaleza de la Plataforma',
    body:  `El sitio web de Patitas de Amor Barquisimeto actúa exclusivamente como un puente de difusión y catálogo digital sin fines de lucro. Nuestro objetivo es visibilizar a perros y gatos rescatados en situación de vulnerabilidad para facilitar su adopción responsable.`,
  },
  {
    title: '2. Proceso y Evaluación de Adopción',
    body:  `Iniciar contacto por una mascota no garantiza su adopción. Patitas de Amor Barquisimeto se reserva el derecho exclusivo de evaluar a los postulantes, solicitar requisitos (entrevistas, planillas) y aprobar o denegar la solicitud basándose únicamente en garantizar el bienestar físico y emocional del animal rescatado.`,
  },
  {
    title: '3. Compromiso Inquebrantable del Adoptante',
    body:  `Al concretar una adopción, el adoptante asume la responsabilidad legal y moral de: (a) proveer alimentación, techo y cuidados veterinarios oportunos; (b) no abandonar, regalar ni ceder al animal sin previa notificación a la fundación; y (c) cumplir obligatoriamente con la esterilización o castración en el plazo acordado.`,
  },
  {
    title: '4. Seguimiento Post-Adopción',
    body:  `La fundación podrá requerir, como condición de adopción, material fotográfico o visitas programadas durante los primeros meses tras la entrega, con el fin de velar por la correcta adaptación del animal a su nuevo hogar.`,
  },
  {
    title: '5. Limitación de Responsabilidad Técnica',
    body:  `Patitas de Amor Barquisimeto no se hace responsable por caídas del servidor, interrupciones temporales del catálogo web por parte de nuestros proveedores (Cloudflare/GitHub), ni por fallas en la red de WhatsApp al momento de procesar solicitudes.`,
  },
];

export default function Terms() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SEO title="Términos y Condiciones · Patitas de Amor Bqto" description="Términos y Condiciones de uso de la plataforma Patitas de Amor Barquisimeto." url="/terminos" />
      <Navbar />

      {/* Encabezado */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', py: { xs: 5, md: 7 } }}>
        <Container maxWidth="md">
          <AnimatedSection>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <GavelIcon sx={{ fontSize: '2.2rem', color: 'primary.main' }} />
              <Typography variant="overline" color="primary" fontWeight={700} letterSpacing="0.12em">
                Legal
              </Typography>
            </Box>
            <Typography variant="h2" fontWeight={800} mb={2}>
              Términos y Condiciones
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Última actualización: {new Date().toLocaleDateString('es-VE', { year: 'numeric', month: 'long' })}
            </Typography>
          </AnimatedSection>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 6, md: 9 }, bgcolor: 'background.default', flexGrow: 1, contentVisibility: 'auto', containIntrinsicSize: 'auto 800px' }}>
        <Container maxWidth="md">
          {SECTIONS.map((s, i) => (
            <AnimatedSection key={s.title} delay={i * 40}>
              <Card sx={{ mb: 2.5 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {s.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" lineHeight={1.8}>
                    {s.body}
                  </Typography>
                </CardContent>
              </Card>
            </AnimatedSection>
          ))}
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
