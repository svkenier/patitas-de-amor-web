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
import Divider from '@mui/material/Divider';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import Switch from '@mui/material/Switch';
import Chip from '@mui/material/Chip';
import { get, put, formatApiError } from '@core/api/client';
import type { Settings } from '@core/types/settings';
import { DEFAULT_SETTINGS } from '@core/types/settings';
import { useTestBannerVisible } from '@core/hooks/useDomainBanner';

const parseLocalDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return new Date();
  return new Date(year, month - 1, day);
};

const serializeLocalDate = (dateObj: Date) => {
  return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
};

export default function DomainManager() {
  const qc = useQueryClient();
  const [previewAlert, setPreviewAlert] = useTestBannerVisible();
  const [renewalMode, setRenewalMode] = useState<'auto' | 'manual'>('auto');
  const [renewalYears, setRenewalYears] = useState<number>(1);
  const [manualDate, setManualDate] = useState<string>('');
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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
      setSuccessMsg('Configuración guardada exitosamente.');
      setConfirmOpen(false);
      setSuspendModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 3000);
      void qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  if (isLoading) return <CircularProgress />;
  if (isError) return <Alert severity="error">Error al cargar la configuración de dominio.</Alert>;

  const currentSettings = settings || DEFAULT_SETTINGS;
  const rawBaseDate = currentSettings.expirationDate || currentSettings.domainExpirationDate || DEFAULT_SETTINGS.expirationDate!;
  const monitoringActive = currentSettings.monitoringActive ?? currentSettings.domainAlertEnabled ?? true;
  
  const baseDateObj = parseLocalDate(rawBaseDate);

  const autoNewDateObj = new Date(baseDateObj.getFullYear() + renewalYears, baseDateObj.getMonth(), baseDateObj.getDate());
  const manualDateObj = manualDate ? parseLocalDate(manualDate) : new Date(baseDateObj.getTime());
  const finalNewDateObj = renewalMode === 'auto' ? autoNewDateObj : manualDateObj;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = baseDateObj.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const todayStr = serializeLocalDate(today);
  
  let isManualDateInvalid = false;
  if (manualDate) {
    const manualDateOnly = parseLocalDate(manualDate);
    manualDateOnly.setHours(0, 0, 0, 0);
    isManualDateInvalid = manualDateOnly.getTime() <= today.getTime();
  }
  
  const showManualError = renewalMode === 'manual' && manualDate !== '' && isManualDateInvalid;
  const isSubmitDisabled = mutation.isPending || (renewalMode === 'manual' && (manualDate === '' || isManualDateInvalid));

  const options = { year: 'numeric', month: 'long', day: '2-digit' } as const;
  const formattedCurrentDate = baseDateObj.toLocaleDateString('es-ES', options);
  const formattedNewDate = finalNewDateObj.toLocaleDateString('es-ES', options);

  const handleConfirm = () => {
    mutation.mutate({
      ...currentSettings,
      expirationDate: serializeLocalDate(finalNewDateObj),
      domainExpirationDate: serializeLocalDate(finalNewDateObj)
    });
  };

  const toggleMonitoring = () => {
    if (monitoringActive) {
      setSuspendModalOpen(true);
    } else {
      mutation.mutate({
        ...currentSettings,
        monitoringActive: true,
        domainAlertEnabled: true
      });
    }
  };

  const confirmSuspend = () => {
    mutation.mutate({
      ...currentSettings,
      monitoringActive: false,
      domainAlertEnabled: false
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
          <Card variant="outlined" sx={{ bgcolor: 'background.paper', borderColor: (diffDays <= 30 && monitoringActive) ? 'error.main' : 'divider' }}>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="overline" color="text.secondary">ESTADO DEL SERVICIO</Typography>
                <FormControlLabel
                  control={<Switch checked={monitoringActive} onChange={toggleMonitoring} color="primary" disabled={mutation.isPending} />}
                  label={
                    <Typography fontWeight={700} color="text.primary">
                      Monitoreo Activo
                    </Typography>
                  }
                  labelPlacement="end"
                  sx={{ m: 0 }}
                />
              </Box>
              
              <Divider />
              
              <Box sx={{ px: 3, py: 3 }}>
                <Typography variant="h4" fontWeight={600} gutterBottom>
                  {formattedCurrentDate}
                </Typography>
                
                <Box sx={{ mt: 1 }}>
                  {monitoringActive ? (
                    diffDays <= 30 ? (
                      <Chip label={`QUEDAN ${diffDays} DÍAS`} color="error" size="small" sx={{ fontWeight: 700 }} />
                    ) : (
                      <Typography variant="body2" color="success.main" fontWeight={600}>
                        Tiempo restante para el corte anual: {diffDays} días
                      </Typography>
                    )
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      ○ Monitoreo pausado (Sin alertas globales)
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card variant="outlined" sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                Extender Vigencia del Dominio
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

                  <Box sx={{ p: 2, border: '1px solid', borderColor: renewalMode === 'manual' ? 'primary.main' : 'divider', borderRadius: 1 }}>
                    <FormControlLabel value="manual" control={<Radio />} label="Ingresar fecha exacta del registrador (Manual)" />
                    {renewalMode === 'manual' && (
                      <Box sx={{ mt: 2, ml: 4 }}>
                        <TextField
                          fullWidth
                          label="Fecha de Expiración Exacta"
                          type="date"
                          value={manualDate}
                          onChange={(e) => setManualDate(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ min: todayStr }}
                          error={showManualError}
                          helperText={
                            showManualError
                              ? 'La fecha de renovación debe ser posterior al día de hoy'
                              : manualDate
                              ? `📅 Fecha seleccionada: ${manualDateObj.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: '2-digit' })}`
                              : ''
                          }
                        />
                      </Box>
                    )}
                  </Box>
                </RadioGroup>
              </FormControl>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button 
                  variant="contained" 
                  size="large"
                  sx={{ 
                    bgcolor: '#0f172a', 
                    color: '#fff', 
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 4,
                    '&:hover': { bgcolor: '#1e293b' },
                    '&.Mui-disabled': { bgcolor: 'rgba(0, 0, 0, 0.12)', color: 'rgba(0, 0, 0, 0.26)' }
                  }}
                  onClick={() => {
                    if (isSubmitDisabled) return;
                    setConfirmOpen(true);
                  }}
                  disabled={isSubmitDisabled}
                >
                  Registrar Renovación
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card variant="outlined" sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Herramientas de Previsualización
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Permite simular el despliegue del banner de advertencia para verificar contrastes y legibilidad antes de que ocurra una alerta real.
              </Typography>
              <FormControlLabel
                control={<Switch checked={previewAlert} onChange={(e) => setPreviewAlert(e.target.checked)} color="secondary" />}
                label="Mostrar banner de prueba"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Modal Confirmación de Renovación */}
      <Dialog open={confirmOpen} onClose={() => { if (!mutation.isPending) setConfirmOpen(false); }} PaperProps={{ sx: { borderRadius: 2 } }}>
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

      {/* Modal Suspender Monitoreo */}
      <Dialog 
        open={suspendModalOpen} 
        onClose={() => { if (!mutation.isPending) setSuspendModalOpen(false); }} 
        PaperProps={{ 
          sx: { 
            borderRadius: 3, 
            boxShadow: '0px 10px 40px rgba(0,0,0,0.1)' 
          } 
        }}
        slotProps={{
          backdrop: { sx: { backdropFilter: 'blur(3px)' } }
        }}
      >
        <DialogTitle fontWeight={700}>¿Suspender monitoreo de dominio?</DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary">
            Si desactiva el monitoreo maestro, el panel administrativo no emitirá alertas preventivas sobre la expiración del dominio. Podría perder el dominio si no gestiona la renovación manualmente a tiempo.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setSuspendModalOpen(false)} color="inherit" disabled={mutation.isPending} sx={{ borderRadius: 2 }}>
            Cancelar
          </Button>
          <Button 
            onClick={confirmSuspend} 
            variant="contained" 
            disabled={mutation.isPending}
            sx={{ 
              borderRadius: 2,
              bgcolor: '#e57373', 
              color: '#fff', 
              '&:hover': { bgcolor: '#ef5350' } 
            }}
            startIcon={mutation.isPending ? <CircularProgress size={20} color="inherit" /> : null}
          >
            Suspender Monitoreo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
