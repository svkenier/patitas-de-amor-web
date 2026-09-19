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

const SECTIONS = [
  {
    title: '1. Aceptación de los términos',
    body:  `Al navegar por este sitio web y utilizar sus servicios, usted acepta cumplir
            con los presentes Términos y Condiciones. Si no está de acuerdo con alguno de
            ellos, le pedimos que se abstenga de usar el sitio.`,
  },
  {
    title: '2. Sobre el proceso de adopción',
    body:  `La adopción de mascotas a través de petRescue es un proceso voluntario que requiere
            cumplir con los requisitos establecidos por el refugio. El refugio se reserva el
            derecho de rechazar solicitudes que no cumplan los criterios de bienestar animal.
            La entrega de la mascota está sujeta a disponibilidad y evaluación del adoptante.`,
  },
  {
    title: '3. Compromiso del adoptante',
    body:  `Al adoptar una mascota, el adoptante se compromete a: (a) brindarle alimentación
            adecuada, atención veterinaria y un ambiente seguro; (b) no abandonar, maltratar ni
            re-ceder la mascota a terceros sin notificar previamente al refugio; (c) esterilizar
            a la mascota si aún no lo está, dentro de los primeros seis (6) meses tras la adopción.`,
  },
  {
    title: '4. Seguimiento post-adopción',
    body:  `El refugio podrá solicitar evidencia fotográfica o una visita de seguimiento dentro
            del primer mes tras la adopción, con el único fin de verificar el bienestar de la
            mascota. Esto no constituye una fiscalización punitiva, sino un acompañamiento.`,
  },
  {
    title: '5. Devolución responsable',
    body:  `Si por circunstancias excepcionales el adoptante no puede continuar cuidando a la
            mascota, debe contactar al refugio antes de tomar cualquier otra decisión. El refugio
            facilitará la devolución o la reubicación responsable de la mascota.`,
  },
  {
    title: '6. Limitación de responsabilidad',
    body:  `petRescue actúa como facilitador entre mascotas en situación de calle o abandono y
            familias adoptantes. Si bien velamos por la salud y el comportamiento de las mascotas,
            no nos hacemos responsables de daños o imprevistos posteriores a la entrega formal.`,
  },
  {
    title: '7. Modificaciones',
    body:  `Nos reservamos el derecho de actualizar estos Términos en cualquier momento.
            Los cambios serán efectivos desde su publicación en este sitio.
            Se recomienda revisar esta página periódicamente.`,
  },
];

export default function Terms() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
