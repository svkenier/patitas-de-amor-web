/**
 * Privacy — Política de Privacidad (/privacidad).
 */

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert';
import ShieldIcon from '@mui/icons-material/Shield';
import Navbar from '@ui/components/Navbar';
import Footer from '@ui/components/Footer';
import AnimatedSection from '@ui/components/AnimatedSection';

const SECTIONS = [
  {
    title: '1. ¿Qué información recopilamos?',
    body:  `Este sitio web NO almacena datos personales de los visitantes. No usamos formularios
            de contacto web, ni bases de datos de usuarios públicos. El único canal de comunicación
            es WhatsApp, que opera bajo sus propias políticas de privacidad (Meta, Inc.).`,
  },
  {
    title: '2. Cookies y rastreo',
    body:  `No utilizamos cookies de rastreo de terceros ni herramientas de analítica que
            recopilen datos personales identificables. La caché de las mascotas se
            almacena temporalmente en el navegador para mejorar el rendimiento de carga.`,
  },
  {
    title: '3. Datos del personal del refugio',
    body:  `Los usuarios con acceso al panel de administración (staff del refugio) tienen sus
            credenciales almacenadas de forma segura y privada en Upstash Redis,
            con contraseñas hasheadas mediante bcrypt. Estos datos NUNCA se exponen públicamente
            ni se almacenan en el repositorio de GitHub.`,
  },
  {
    title: '4. Fichas de mascotas',
    body:  `Las fotografías y datos de las mascotas (nombre, especie, descripción, estado de
            adopción) son información pública alojada en un repositorio de GitHub. No contienen
            datos personales de adoptantes ni de personal.`,
  },
  {
    title: '5. Comunicación por WhatsApp',
    body:  `Toda comunicación de adopción, rescate y donación se realiza a través de WhatsApp.
            Al contactarnos, usted está interactuando directamente con la plataforma de
            Meta Platforms, Inc., sujeta a su propia Política de Privacidad y Términos de Servicio.
            petRescue no retiene ni comparte los mensajes de WhatsApp recibidos.`,
  },
  {
    title: '6. Seguridad',
    body:  `Toda la infraestructura de la aplicación opera sobre HTTPS. Los secretos sensibles
            (tokens de API, claves JWT) están almacenados exclusivamente en variables de
            entorno de Cloudflare Pages y nunca son expuestos al navegador del usuario.`,
  },
  {
    title: '7. Cambios a esta política',
    body:  `Podemos actualizar esta Política de Privacidad ocasionalmente. Te recomendamos
            revisarla periódicamente. Cualquier cambio relevante será publicado en esta misma página.`,
  },
];

export default function Privacy() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Encabezado */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', py: { xs: 5, md: 7 } }}>
        <Container maxWidth="md">
          <AnimatedSection>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <ShieldIcon sx={{ fontSize: '2.2rem', color: 'secondary.main' }} />
              <Typography variant="overline" color="secondary" fontWeight={700} letterSpacing="0.12em">
                Legal
              </Typography>
            </Box>
            <Typography variant="h2" fontWeight={800} mb={2}>
              Política de Privacidad
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Última actualización: {new Date().toLocaleDateString('es-VE', { year: 'numeric', month: 'long' })}
            </Typography>
          </AnimatedSection>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 6, md: 9 }, bgcolor: 'background.default', flexGrow: 1, contentVisibility: 'auto', containIntrinsicSize: 'auto 800px' }}>
        <Container maxWidth="md">

          <AnimatedSection>
            <Alert severity="success" variant="outlined" sx={{ mb: 4 }}>
              <strong>Resumen:</strong> Este sitio NO almacena datos personales de visitantes.
              No hay cookies de rastreo ni formularios que capturen información personal.
              La comunicación es 100% vía WhatsApp.
            </Alert>
          </AnimatedSection>

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
