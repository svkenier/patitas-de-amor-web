import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import InfoIcon from '@mui/icons-material/Info';
import { get } from '@core/api/client';
import { useAuth } from '@ui/context/AuthContext';
import type { Settings } from '@core/types/settings';
import { useTestBannerVisible } from '@core/hooks/useDomainBanner';

export default function DomainAlert() {
  const { user } = useAuth();
  const [preview] = useTestBannerVisible();
  const [dismissed, setDismissed] = useState(false);
  
  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const { data: settings } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await get<Settings | {}>('/settings');
      return res as Settings;
    },
    enabled: user?.role === 'owner' || user?.role === 'superadmin',
  });

  const expirationDateStr = settings?.expirationDate || settings?.domainExpirationDate;
  const monitoringActive = settings?.monitoringActive ?? settings?.domainAlertEnabled ?? true;

  useEffect(() => {
    if (expirationDateStr) {
      const isDismissed = localStorage.getItem(`domain-alert-dismissed-${expirationDateStr}`);
      if (isDismissed === 'true') {
        setDismissed(true);
      } else {
        setDismissed(false);
      }
    }
  }, [expirationDateStr]);

  if (!settings && !preview) return null;
  if (!expirationDateStr && !preview) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiration = parseLocalDate(expirationDateStr || new Date().toISOString());
  const diffTime = expiration.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const shouldShowRealAlert = monitoringActive && diffDays <= 30 && diffDays > 0 && !dismissed;

  if (shouldShowRealAlert || preview) {
    const displayDays = preview ? 14 : diffDays;
    
    return (
      <Box sx={{ mb: 3 }}>
        <Alert 
          severity="warning" 
          variant="filled" 
          icon={<InfoIcon />}
          onClose={!preview ? () => {
            if (expirationDateStr) {
              localStorage.setItem(`domain-alert-dismissed-${expirationDateStr}`, 'true');
            }
            setDismissed(true);
          } : undefined}
          sx={{ 
            bgcolor: '#FFF8E1', 
            color: '#856100',
            border: '1px solid #FFE082',
            '& .MuiAlert-icon': {
              color: '#F57F17'
            }
          }}
        >
          {preview && <strong>[MODO PREVISUALIZACIÓN] </strong>}
          Aviso importante: El servicio de dominio web anual se encuentra próximo a su fecha de corte (quedan {displayDays} días). Para garantizar la continuidad de la web y evitar interrupciones, por favor gestione la renovación anual con su proveedor de dominio o administrador técnico.
        </Alert>
      </Box>
    );
  }

  return null;
}
