import { useQuery } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { get } from '@core/api/client';
import { useAuth } from '@ui/context/AuthContext';
import type { Settings } from '@core/types/settings';

export default function DomainAlert({ preview = false }: { preview?: boolean }) {
  const { user } = useAuth();
  
  const { data: settings } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await get<Settings | {}>('/settings');
      return res as Settings;
    },
    enabled: user?.role === 'owner' || user?.role === 'superadmin',
  });

  if (!settings || !settings.domainExpirationDate) return null;

  const today = new Date();
  const expiration = new Date(settings.domainExpirationDate);
  const diffTime = expiration.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const shouldShowRealAlert = diffDays <= 15 && diffDays > 0 && settings.domainAlertEnabled;

  if (shouldShowRealAlert || preview) {
    return (
      <Box sx={{ mb: 3 }}>
        <Alert severity="warning" variant="filled">
          {preview && <strong>[MODO PREVISUALIZACIÓN] </strong>}
          Aviso administrativo: El servicio de dominio web anual se encuentra próximo a su fecha de vencimiento. Para asegurar la continuidad operativa de la plataforma sin interrupciones, por favor comuníquese a la brevedad con el administrador técnico del sistema para coordinar la renovación.
        </Alert>
      </Box>
    );
  }

  return null;
}
