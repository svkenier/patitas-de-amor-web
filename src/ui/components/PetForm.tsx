import { useState, useCallback, type ChangeEvent } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import CloseIcon     from '@mui/icons-material/Close';
import AddPhotoIcon  from '@mui/icons-material/AddPhotoAlternate';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post, put, formatApiError } from '@core/api/client';
import { optimizeImage } from '@core/media/imageOptimizer';
import { ITEM_IMAGE_FALLBACK } from '@core/coreConfig';
import type { BaseRecord } from '@core/types/record';

interface PetFormProps {
  open:    boolean;
  onClose: () => void;
  initial?: BaseRecord | null;
  collectionName?: string;
  onSuccess?: (isEdit: boolean) => void;
}

const EMPTY = {
  title: '', especie: '', raza: '', sexo: '',
  tamano: '', edad_aproximada: '', peso_kg: '',
  description: '', status: 'disponible',
  destacado: false, vacunado: false, esterilizado: false, desparasitado: false,
};

const validationSchema = Yup.object({
  title: Yup.string().required('El título/nombre es obligatorio'),
  especie: Yup.string(),
  sexo: Yup.string(),
  raza: Yup.string(),
  tamano: Yup.string(),
  edad_aproximada: Yup.string(),
  peso_kg: Yup.number().typeError('Debe ser un número').min(0, 'No puede ser negativo').nullable().transform((v, o) => o === '' ? null : v),
  description: Yup.string(),
  status: Yup.string().required('El estado es obligatorio'),
  destacado: Yup.boolean(),
  vacunado: Yup.boolean(),
  esterilizado: Yup.boolean(),
  desparasitado: Yup.boolean(),
});

interface ImagePickerProps {
  label:   string;
  preview: string;
  onFile:  (file: File) => void;
  onClear?: () => void;
  size?:   'small' | 'large';
}

function ImagePicker({ label, preview, onFile, onClear, size = 'large' }: ImagePickerProps) {
  const h = size === 'large' ? 180 : 110;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = '';
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        component="label"
        htmlFor={`img-picker-${label}`}
        sx={{
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          height:         h,
          border:         '2px dashed',
          borderColor:    preview ? 'primary.main' : 'divider',
          borderRadius: 0,
          cursor:         'pointer',
          overflow:       'hidden',
          bgcolor:        'background.default',
          transition:     'border-color 200ms',
          '&:hover':      { borderColor: 'primary.main' },
        }}
      >
        {preview ? (
          <Box
            component="img"
            src={preview}
            alt={label ? `Vista previa de ${label}` : 'Vista previa de imagen'}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = ITEM_IMAGE_FALLBACK; }}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box sx={{ textAlign: 'center', p: 1, pointerEvents: 'none' }}>
            <AddPhotoIcon sx={{ fontSize: '2rem', color: 'text.disabled', mb: 0.5 }} />
            <Typography variant="caption" color="text.disabled" display="block">
              {label}
            </Typography>
          </Box>
        )}
      </Box>
      <input
        id={`img-picker-${label}`}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      {preview && onClear && (
        <Tooltip title="Quitar foto">
          <IconButton aria-label="Quitar foto"
            size="small"
            onClick={onClear}
            sx={{
              position: 'absolute', top: 4, right: 4,
              bgcolor: 'rgba(0,0,0,0.55)', color: 'white',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

export default function PetForm({ open, onClose, initial, collectionName = 'pets', onSuccess }: PetFormProps) {
  const isEdit = Boolean(initial?.id);
  const qc     = useQueryClient();

  const formik = useFormik({
    initialValues: initial
      ? {
          title:           initial.title,
          description:     initial.description     ?? '',
          status:          initial.status          ?? 'disponible',
          especie:         (initial.attributes?.['especie'] as string) ?? '',
          raza:            (initial.attributes?.['raza'] as string) ?? '',
          sexo:            (initial.attributes?.['sexo'] as string) ?? '',
          tamano:          (initial.attributes?.['tamano'] as string) ?? '',
          edad_aproximada: (initial.attributes?.['edad_aproximada'] as string) ?? '',
          peso_kg:         initial.attributes?.['peso_kg'] !== undefined ? String(initial.attributes?.['peso_kg']) : '',
          destacado:       (initial.attributes?.['destacado'] as boolean) ?? false,
          vacunado:        (initial.attributes?.['vacunado'] as boolean) ?? false,
          esterilizado:    (initial.attributes?.['esterilizado'] as boolean) ?? false,
          desparasitado:   (initial.attributes?.['desparasitado'] as boolean) ?? false,
        }
      : EMPTY,
    enableReinitialize: true,
    validationSchema,
    onSubmit: () => {
      mutation.mutate();
    },
  });

  const [mainPreview,  setMainPreview]  = useState<string>(initial?.main_image ?? '');
  const [mainBase64,   setMainBase64]   = useState<string>('');
  const [extraFiles,   setExtraFiles]   = useState<{ preview: string; base64: string }[]>([]);
  const [imgLoading,   setImgLoading]   = useState(false);
  const [error,        setError]        = useState('');

  const handleMainFile = useCallback(async (file: File) => {
    setImgLoading(true);
    try {
      const result = await optimizeImage(file);
      const b64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve((reader.result as string).split(',')[1] ?? '');
        reader.onerror = reject;
        reader.readAsDataURL(result.blob);
      });
      setMainPreview(result.previewUrl);
      setMainBase64(b64);
    } finally {
      setImgLoading(false);
    }
  }, []);

  const handleExtraFile = useCallback(async (file: File) => {
    if (extraFiles.length >= 5) return;
    setImgLoading(true);
    try {
      const result = await optimizeImage(file);
      const b64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve((reader.result as string).split(',')[1] ?? '');
        reader.onerror = reject;
        reader.readAsDataURL(result.blob);
      });
      setExtraFiles((p) => [...p, { preview: result.previewUrl, base64: b64 }]);
    } finally {
      setImgLoading(false);
    }
  }, [extraFiles.length]);

  const removeExtra = (idx: number) =>
    setExtraFiles((p) => p.filter((_, i) => i !== idx));

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...(isEdit && initial?.id ? { id: initial.id } : {}),
        title: formik.values.title,
        description: formik.values.description,
        status: formik.values.status,
        attributes: {
          especie: formik.values.especie,
          raza: formik.values.raza,
          sexo: formik.values.sexo,
          tamano: formik.values.tamano,
          edad_aproximada: formik.values.edad_aproximada,
          peso_kg: formik.values.peso_kg ? parseFloat(formik.values.peso_kg as string) : undefined,
          destacado: formik.values.destacado,
          vacunado: formik.values.vacunado,
          esterilizado: formik.values.esterilizado,
          desparasitado: formik.values.desparasitado,
        },
        ...(mainBase64 ? { 
          main_image_base64: mainBase64,
        } : {}),
        ...(extraFiles.length > 0
          ? { gallery_base64: extraFiles.map((f) => f.base64) }
          : {}),
        ...(isEdit
          ? { gallery_existing: initial?.gallery ?? [] }
          : {}),
      };
      if (isEdit) {
        return put(`/collections/${collectionName}`, payload);
      }
      return post(`/collections/${collectionName}`, payload);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [`${collectionName}-index`] });
      if (onSuccess) {
        onSuccess(isEdit);
      } else {
        onClose();
      }
    },
    onError: (err: unknown) => {
      const msg = formatApiError(err, isEdit ? 'Error al actualizar el registro' : 'Error al crear el registro');
      setError(msg);
    },
  });

  const handleSubmit = () => {
    setError('');
    formik.handleSubmit();
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{ sx: { borderRadius: 0 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={700}>
          {isEdit ? 'Editar Ficha de Mascota' : 'Registrar Nueva Mascota'}
        </Typography>
        <IconButton aria-label="Cerrar formulario" onClick={onClose} size="small" disabled={mutation.isPending}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="subtitle2" color="text.secondary" fontWeight={700} mb={1.5}>
          Datos básicos
        </Typography>
        <Grid container spacing={2} mb={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Nombre/Título *"
              name="title"
              value={formik.values.title}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.title && Boolean(formik.errors.title)}
              helperText={formik.touched.title && (formik.errors.title as string)}
              fullWidth size="small"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <FormControl fullWidth size="small" error={formik.touched.especie && Boolean(formik.errors.especie)}>
              <InputLabel id="label-especie">Especie</InputLabel>
              <Select labelId="label-especie" name="especie" value={formik.values.especie} label="Especie" onChange={formik.handleChange} onBlur={formik.handleBlur}>
                <MenuItem value="">—</MenuItem>
                <MenuItem value="perro">Perro</MenuItem>
                <MenuItem value="gato">Gato</MenuItem>
                <MenuItem value="otro">Otro</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <FormControl fullWidth size="small" error={formik.touched.sexo && Boolean(formik.errors.sexo)}>
              <InputLabel id="label-sexo">Sexo</InputLabel>
              <Select labelId="label-sexo" name="sexo" value={formik.values.sexo} label="Sexo" onChange={formik.handleChange} onBlur={formik.handleBlur}>
                <MenuItem value="">—</MenuItem>
                <MenuItem value="macho">Macho</MenuItem>
                <MenuItem value="hembra">Hembra</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              label="Raza/Categoría"
              name="raza"
              value={formik.values.raza}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              fullWidth size="small"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="label-tamano">Tamaño</InputLabel>
              <Select labelId="label-tamano" name="tamano" value={formik.values.tamano} label="Tamaño" onChange={formik.handleChange} onBlur={formik.handleBlur}>
                <MenuItem value="">—</MenuItem>
                <MenuItem value="pequeno">Pequeño</MenuItem>
                <MenuItem value="mediano">Mediano</MenuItem>
                <MenuItem value="grande">Grande</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              label="Edad aproximada"
              placeholder="ej: 2 años"
              name="edad_aproximada"
              value={formik.values.edad_aproximada}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              fullWidth size="small"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              label="Peso (kg)"
              type="number"
              name="peso_kg"
              value={formik.values.peso_kg}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.peso_kg && Boolean(formik.errors.peso_kg)}
              helperText={formik.touched.peso_kg && (formik.errors.peso_kg as string)}
              fullWidth size="small"
              inputProps={{ min: 0, step: 0.1 }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ mb: 2 }} />

        <Typography variant="subtitle2" color="text.secondary" fontWeight={700} mb={1.5}>
          Estado y descripción
        </Typography>
        <Grid container spacing={2} mb={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small" error={formik.touched.status && Boolean(formik.errors.status)}>
              <InputLabel>Estado</InputLabel>
              <Select name="status" value={formik.values.status} label="Estado" onChange={formik.handleChange} onBlur={formik.handleBlur}>
                <MenuItem value="disponible">Disponible</MenuItem>
                <MenuItem value="en_proceso">En proceso</MenuItem>
                <MenuItem value="adoptado">Adoptado</MenuItem>
                <MenuItem value="active">Activo</MenuItem>
                <MenuItem value="inactive">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={<Switch name="destacado" checked={formik.values.destacado} onChange={formik.handleChange} color="warning" />}
                label="Destacado ⭐"
              />
              <FormControlLabel
                control={<Switch name="vacunado" checked={formik.values.vacunado} onChange={formik.handleChange} color="success" />}
                label="Vacunado"
              />
              <FormControlLabel
                control={<Switch name="esterilizado" checked={formik.values.esterilizado} onChange={formik.handleChange} color="success" />}
                label="Esterilizado"
              />
              <FormControlLabel
                control={<Switch name="desparasitado" checked={formik.values.desparasitado} onChange={formik.handleChange} color="success" />}
                label="Desparasitado"
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Descripción"
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              fullWidth
              multiline
              rows={3}
              size="small"
            />
          </Grid>
        </Grid>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
            Fotos
          </Typography>
          {imgLoading && <CircularProgress size={16} />}
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              Foto Principal (Opcional, pero recomendado)
            </Typography>
            <ImagePicker
              label="Foto Principal"
              preview={mainPreview}
              onFile={handleMainFile}
              onClear={() => { setMainPreview(''); setMainBase64(''); }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 8 }}>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              Fotos adicionales (máx. 5)
            </Typography>
            <Grid container spacing={1}>
              {extraFiles.map((ef, idx) => (
                <Grid key={idx} size={{ xs: 4 }}>
                  <ImagePicker
                    label={`Foto ${idx + 2}`}
                    preview={ef.preview}
                    onFile={() => {}}
                    onClear={() => removeExtra(idx)}
                    size="small"
                  />
                </Grid>
              ))}
              {extraFiles.length < 5 && (
                <Grid size={{ xs: 4 }}>
                  <ImagePicker
                    label="Agregar foto"
                    preview=""
                    onFile={handleExtraFile}
                    size="small"
                  />
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={mutation.isPending} color="inherit">
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={mutation.isPending || imgLoading || formik.isSubmitting}
          startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ borderRadius: 0, px: 3 }}
        >
          {mutation.isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear registro'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
