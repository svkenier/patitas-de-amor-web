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
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import Switch from '@mui/material/Switch';
import DomainAlert from '@ui/components/DomainAlert';
import { get, put, formatApiError } from '@core/api/client';
import type { Settings } from '@core/types/settings';
import { DEFAULT_SETTINGS } from '@core/types/settings';

export default function DomainManager() {
  const qc = useQueryClient();
  const [renewalMode, setRenewalMode] = useState<'auto' | 'manual'>('auto');
  const [renewalYears, setRenewalYears] = useState<number>(1);
  const [manualDate, setManualDate] = useState<string>('');
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [previewAlert, setPreviewAlert] = useState(false);

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
      setTimeout(() => setSuccessMsg(''), 3000);
      void qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  if (isLoading) return <CircularProgress />;
  if (isError) return <Alert severity="error">Error al cargar la configuración de dominio.</Alert>;

  const currentSettings = settings || DEFAULT_SETTINGS;
  const rawBaseDate = currentSettings.domainExpirationDate || DEFAULT_SETTINGS.domainExpirationDate!;
  
  // Try to parse the base date, fallback to today if invalid
  let baseDateObj = new Date(rawBaseDate);
  if (isNaN(baseDateObj.getTime())) {
    baseDateObj = new Date();
  }

  // Calculate new auto date by strictly adding years to the base date
  const autoNewDateObj = new Date(baseDateObj.getTime());
  autoNewDateObj.setFullYear(autoNewDateObj.getFullYear() + renewalYears);

  // Manual date object
  let manualDateObj = new Date(manualDate);
  if (isNaN(manualDateObj.getTime())) {
    manualDateObj = new Date(baseDateObj.getTime());
  }

  const finalNewDateObj = renewalMode === 'auto' ? autoNewDateObj : manualDateObj;

  const today = new Date();
  const diffTime = baseDateObj.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const todayStr = today.toISOString().split('T')[0];
  const isManualDateInPast = renewalMode === 'manual' && (!manualDate || new Date(manualDate).getTime() < new Date().setHours(0,0,0,0));

  const options = { year: 'numeric', month: 'long', day: '2-digit' } as const;
  const formattedCurrentDate = baseDateObj.toLocaleDateString('es-ES', options);
  const formattedNewDate = finalNewDateObj.toLocaleDateString('es-ES', options);

  const handleConfirm = () => {
    mutation.mutate({
      ...currentSettings,
      domainExpirationDate: finalNewDateObj.toISOString().split('T')[0] + 'T00:00:00Z'
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

      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={<Switch checked={previewAlert} onChange={(e) => setPreviewAlert(e.target.checked)} color="secondary" />}
          label="Previsualizar diseño del banner de alerta"
        />
      </Box>
      
      {/* Muestra local de DomainAlert con prop "preview" inyectado */}
      {previewAlert && (
        <Box sx={{ mt: 2, mb: 4 }}>
          <DomainAlert preview={true} />
        </Box>
      )}

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
            Modo de Renovación
          </Typography>
          
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={renewalMode}
              onChange={(e) => setRenewalMode(e.target.value as 'auto' | 'manual')}
            >
              <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: renewalMode === 'auto' ? 'primary.main' : 'divider', borderRadius: 1 }}>
                <FormControlLabel value="auto" control={<Radio />} label="Renovación automática por años (+1, +2, +3, +5)" />
                {renewalMode === 'auto' && (
                  <Box sx={{ mt: 2, ml: 4 }}>
                    <TextField
                      select
                      fullWidth
                      label="Periodo a Renovar"
                      value={renewalYears}
                      onChange={(e) => setRenewalYears(Number(e.target.value))}
                      sx={{ mb: 2 }}
                    >
                      <MenuItem value={1}>+1 Año</MenuItem>
                      <MenuItem value={2}>+2 Años</MenuItem>
                      <MenuItem value={3}>+3 Años</MenuItem>
                      <MenuItem value={5}>+5 Años</MenuItem>
                    </TextField>
                    <Typography variant="body2" color="text.secondary">
                      Fecha de corte actual: <strong>{formattedCurrentDate}</strong> &rarr; Nueva fecha calculada: <strong>{formattedNewDate}</strong>
                    </Typography>
                  </Box>
                )}
              </Box>

              <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: renewalMode === 'manual' ? 'primary.main' : 'divider', borderRadius: 1 }}>
                <FormControlLabel value="manual" control={<Radio />} label="Ingresar fecha exacta del registrador (Manual)" />
                {renewalMode === 'manual' && (
                  <Box sx={{ mt: 2, ml: 4 }}>
                    <TextField
                      fullWidth
                      label="Fecha de Expiración Exacta"
                      type="date"
                      value={manualDate ? manualDate.split('T')[0] : ''}
                      onChange={(e) => {
                        const d = e.target.value;
                        setManualDate(d ? d + 'T00:00:00Z' : '');
                      }}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: todayStr }}
                      error={isManualDateInPast}
                      helperText={isManualDateInPast ? 'La fecha de renovación debe ser posterior al día de hoy' : ''}
                    />
                  </Box>
                )}
              </Box>
            </RadioGroup>
          </FormControl>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={() => {
                if (isManualDateInPast) {
                  return; // prevent if invalid
                }
                setConfirmOpen(true);
              }}
              disabled={isManualDateInPast}
            >
              Registrar Renovación
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Dialog open={confirmOpen} onClose={() => { if (!mutation.isPending) setConfirmOpen(false); }}>
        <DialogTitle>Confirmar Renovación de Dominio</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" gutterBottom>
            <strong>Fecha actual registrada:</strong> {formattedCurrentDate}
          </Typography>
          <Typography variant="body1" color="primary" fontWeight={600}>
            <strong>Nueva fecha que se guardará:</strong> {formattedNewDate}
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
