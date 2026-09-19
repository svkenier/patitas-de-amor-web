import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Collapse from '@mui/material/Collapse';

export default function ConfigErrorBanner() {
  const [errorDetails, setErrorDetails] = useState<{ provider?: string; message?: string } | null>(null);

  useEffect(() => {
    const handleConfigError = (event: CustomEvent) => {
      setErrorDetails(event.detail);
    };

    window.addEventListener('app:config-error', handleConfigError as EventListener);
    return () => {
      window.removeEventListener('app:config-error', handleConfigError as EventListener);
    };
  }, []);

  return (
    <Collapse in={Boolean(errorDetails)}>
      {errorDetails && (
        <Box sx={{ width: '100%', mb: 0 }}>
          <Alert severity="error" variant="filled" square sx={{ alignItems: 'center', justifyContent: 'center' }}>
            <AlertTitle sx={{ m: 0, fontWeight: 'bold' }}>
              Error de Configuración ({errorDetails.provider})
            </AlertTitle>
            El sistema detectó problemas de credenciales o permisos con {errorDetails.provider}.
            Por favor, verifica las variables de entorno.
          </Alert>
        </Box>
      )}
    </Collapse>
  );
}
