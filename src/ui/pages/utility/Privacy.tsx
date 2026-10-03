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
    title: '1. ¿Qué información recopilamos del público?',
    body:  `Este sitio web funciona como un catálogo estrictamente informativo y NO recopila, intercepta ni almacena datos personales de los visitantes. No empleamos formularios de captura de datos en nuestra web. Toda comunicación e intercambio de información personal para adopciones se canaliza externamente a través de WhatsApp.`,
  },
  {
    title: '2. Rastreo, Cookies y Almacenamiento Local',
    body:  `No utilizamos cookies publicitarias ni herramientas de rastreo de terceros. Empleamos mecanismos de almacenamiento local en el navegador (localStorage) de manera exclusiva para gestionar de forma segura los tokens de sesión de nuestro personal interno autorizado (panel de administración). Ningún visitante público es rastreado por esta vía.`,
  },
  {
    title: '3. Uso de Plataformas de Terceros (WhatsApp)',
    body:  `Al hacer clic en los botones de contacto, usted será redirigido a WhatsApp (propiedad de Meta Platforms, Inc.). Al interactuar por esa vía, sus datos, número telefónico y mensajes quedan sujetos a la propia Política de Privacidad de Meta. Patitas de Amor Barquisimeto no automatiza, extrae ni respalda los datos de dichas conversaciones en servidores propios.`,
  },
  {
    title: '4. Infraestructura y Procesadores Técnicos',
    body:  `El sitio web está alojado en Cloudflare Pages, y las fichas de las mascotas (fotografías, nombres y estado de salud) se consultan de manera abierta y anónima desde los repositorios de GitHub, Inc. Estas empresas tecnológicas actúan únicamente como distribuidores de contenido y procesadores de red, garantizando conexiones seguras vía HTTPS.`,
  },
  {
    title: '5. Datos del personal del refugio',
    body:  `Las credenciales de nuestro equipo voluntario y administrador se almacenan cifradas en bases de datos protegidas (Upstash Redis) y nunca se exponen públicamente.`,
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
