import { useQuery } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { get } from '@core/api/client';
import { useAuth } from '@ui/context/AuthContext';
import type { Settings } from '@core/types/settings';

export default function DomainAlert() {
  const { user } = useAuth();
  
  const { data: settings } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await get<Settings | {}>('/settings');
      return res as Settings;
    },
    enabled: user?.role === 'owner' || user?.role === 'superadmin',
  });

  if (!settings || !settings.domainAlertEnabled || !settings.domainExpirationDate) return null;

  const today = new Date();
  const expiration = new Date(settings.domainExpirationDate);
  const diffTime = expiration.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 15 && diffDays > 0) {
    return (
      <Box sx={{ mb: 3 }}>
        <Alert severity="warning" variant="filled">
          ¡Aviso! El dominio expirará en {diffDays} días ({expiration.toLocaleDateString()}). Por favor renuévelo desde la configuración para evitar interrupciones.
        </Alert>
      </Box>
    );
  }

  return null;
}
