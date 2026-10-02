import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import { get, put, formatApiError } from '@core/api/client';
import type { Settings } from '@core/types/settings';
import { DEFAULT_SETTINGS } from '@core/types/settings';

export default function DomainManager() {
  const qc = useQueryClient();
  const [renewalYears, setRenewalYears] = useState<number>(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Para permitir edición manual si se requiere
  const [manualDate, setManualDate] = useState<string | null>(null);

  const { data: settings, isLoading, isError } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await get<Settings | {}>('/settings');
      if (Object.keys(res).length === 0) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...res } as Settings;
    },
    initialData: DEFAULT_SETTINGS,
  });

  const mutation = useMutation({
    mutationFn: (newSettings: Settings) => put('/settings', newSettings),
    onSuccess: () => {
      setSuccessMsg('Renovación registrada exitosamente.');
      setConfirmOpen(false);
      setManualDate(null);
      setTimeout(() => setSuccessMsg(''), 3000);
      void qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  if (isLoading) return <CircularProgress />;
  if (isError) return <Alert severity="error">Error al cargar la configuración de dominio.</Alert>;

  const currentSettings = settings || DEFAULT_SETTINGS;
  const currentExpirationStr = currentSettings.domainExpirationDate || DEFAULT_SETTINGS.domainExpirationDate!;
  
  // Use manual date if edited, otherwise current
  const baseExpiration = manualDate !== null ? manualDate : currentExpirationStr;
  
  const today = new Date();
  const expDateObj = new Date(baseExpiration);
  
  const diffTime = expDateObj.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const options = { year: 'numeric', month: 'long', day: '2-digit' } as const;
  const formattedCurrentDate = expDateObj.toLocaleDateString('es-ES', options);
  
  const newExpDateObj = new Date(baseExpiration);
  newExpDateObj.setFullYear(newExpDateObj.getFullYear() + renewalYears);
  const formattedNewDate = newExpDateObj.toLocaleDateString('es-ES', options);

  const handleConfirm = () => {
    mutation.mutate({
      ...currentSettings,
      domainExpirationDate: newExpDateObj.toISOString().split('T')[0] + 'T00:00:00Z'
    });
  };

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Gestión de Dominio
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Panel exclusivo para el Owner. Administre la renovación anual del dominio y visualice el tiempo restante.
      </Typography>

      {successMsg && <Alert severity="success" sx={{ mb: 3 }}>{successMsg}</Alert>}
      {mutation.isError && <Alert severity="error" sx={{ mb: 3 }}>{formatApiError(mutation.error, 'Error al procesar la renovación.')}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: diffDays <= 15 ? 'warning.main' : 'divider' }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">Estado Actual</Typography>
              <Typography variant="h5" fontWeight={500} gutterBottom>
                {formattedCurrentDate}
              </Typography>
              <Typography variant="body1" color={diffDays <= 15 ? 'error.main' : 'success.main'} fontWeight={600}>
                Tiempo restante para el corte anual: {diffDays} días
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle1" fontWeight={700} mt={2} mb={2}>
            Formulario de Renovación
          </Typography>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Fecha de Expiración Base"
                type="date"
                value={baseExpiration.split('T')[0]}
                onChange={(e) => {
                  const d = e.target.value;
                  if (d) setManualDate(d + 'T00:00:00Z');
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Periodo a Renovar"
                value={renewalYears}
                onChange={(e) => setRenewalYears(Number(e.target.value))}
              >
                <MenuItem value={1}>+1 Año</MenuItem>
                <MenuItem value={2}>+2 Años</MenuItem>
                <MenuItem value={3}>+3 Años</MenuItem>
                <MenuItem value={5}>+5 Años</MenuItem>
              </TextField>
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large"
                  onClick={() => setConfirmOpen(true)}
                >
                  Registrar Renovación
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Dialog open={confirmOpen} onClose={() => { if (!mutation.isPending) setConfirmOpen(false); }}>
        <DialogTitle>Confirmar Renovación de Dominio</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" gutterBottom>
            <strong>Fecha actual registrada:</strong> {formattedCurrentDate}
          </Typography>
          <Typography variant="body1" color="primary" fontWeight={600}>
            <strong>Nueva fecha tras renovación:</strong> {formattedNewDate}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            La alerta del sistema se actualizará automáticamente según la nueva fecha.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="inherit" disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            variant="contained" 
            color="primary"
            disabled={mutation.isPending}
            startIcon={mutation.isPending ? <CircularProgress size={20} color="inherit" /> : null}
          >
            Confirmar Renovación
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
