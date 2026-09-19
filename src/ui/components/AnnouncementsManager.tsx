/**
 * AnnouncementsManager — Gestión CRUD de Anuncios y Eventos
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import AddIcon    from '@mui/icons-material/Add';
import EditIcon   from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CampaignIcon from '@mui/icons-material/Campaign';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Stack from '@mui/material/Stack';

import { get, del, formatApiError, clearEtagCache } from '@core/api/client';
import AdminEmptyState from '@ui/components/AdminEmptyState';
import AnnouncementForm from './AnnouncementForm';
import type { BaseRecord } from '@core/types/record';
import { ITEM_IMAGE_FALLBACK } from '@core/coreConfig';

import { TYPE_COLORS, TYPE_LABELS } from '@core/utils/recordHelpers';

export default function AnnouncementsManager() {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BaseRecord | null>(null);
  const [deleting, setDeleting] = useState<BaseRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: announcements, isLoading, isError } = useQuery<BaseRecord[]>({
    queryKey: ['announcements'],
    queryFn: async () => {
      // Use internal api bypassing CDN cache for admin
      const data = await get<any>(`/public/announcements?t=${Date.now()}`);
      return Array.isArray(data) ? data : (data?.records ?? []);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del('/collections/announcements', { data: { id } }),
    onSuccess: () => {
      clearEtagCache('announcements');
      void qc.invalidateQueries({ queryKey: ['announcements'] });
      void qc.invalidateQueries({ queryKey: ['announcements-public'] });
      setDeleting(null);
    },
    onError: (err) => {
      setErrorMsg(formatApiError(err, 'Error al eliminar el anuncio'));
    }
  });

  const handleOpenForm = (a?: BaseRecord) => {
    setEditing(a || null);
    setFormOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CampaignIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>Gestión de Eventos y Anuncios</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
          sx={{ borderRadius: 0 }}
        >
          Nuevo Anuncio
        </Button>
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error al cargar los anuncios. Intenta nuevamente.
        </Alert>
      )}

      {errorMsg && (
        <Alert severity="error" onClose={() => setErrorMsg('')} sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}

      {/* ── VISTA DE TARJETAS (MÓVIL) ── */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} variant="outlined" sx={{ borderRadius: 0 }}>
              <CardContent><Skeleton variant="rectangular" height={100} /></CardContent>
            </Card>
          ))
        ) : announcements?.map((a) => (
          <Card key={a.id} variant="outlined" sx={{ borderRadius: 0 }}>
            <CardContent sx={{ display: 'flex', gap: 2, pb: 1 }}>
              <Box
                component="img"
                src={a.main_image || ITEM_IMAGE_FALLBACK}
                alt={a.title ? `Imagen de ${a.title}` : 'Imagen del anuncio'}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = ITEM_IMAGE_FALLBACK; }}
                sx={{ width: 80, height: 80, objectFit: 'cover' }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" fontWeight={700} lineHeight={1.2} mb={0.5}>
                  {a.title}
                </Typography>
                <Chip label={(TYPE_LABELS[a.type] || 'Otro').toUpperCase()} size="small" variant="outlined" sx={{ mb: 1, backgroundColor: 'transparent', color: TYPE_COLORS[a.type] || '#71717A', borderColor: TYPE_COLORS[a.type] || '#71717A', fontWeight: 600 }} />
                <Typography variant="body2" color="text.secondary" display="block">
                  {a.attributes?.date as string} {a.attributes?.time && `• ${a.attributes.time}`}
                </Typography>
                <Chip
                  label={a.status === 'active' ? 'Activo' : 'Inactivo'}
                  size="small"
                  color={a.status === 'active' ? 'success' : 'default'}
                  sx={{ mt: 1 }}
                />
              </Box>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
              <Stack direction="row" spacing={1} width="100%">
                <Button 
                  size="small" 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  onClick={() => handleOpenForm(a)}
                  startIcon={<EditIcon />}
                >
                  Editar
                </Button>
                <Button 
                  size="small" 
                  variant="outlined" 
                  color="error" 
                  onClick={() => setDeleting(a)}
                  sx={{ minWidth: 40, px: 0 }}
                >
                  <DeleteIcon />
                </Button>
              </Stack>
            </CardActions>
          </Card>
        ))}
        {!isLoading && announcements?.length === 0 && (
          <AdminEmptyState 
            iconType="events"
            title="No hay eventos ni anuncios activos"
            subtitle="Crea tu primera publicación para mantener a la comunidad informada."
            actionButton={
              <Button variant="outlined" onClick={() => handleOpenForm()} startIcon={<AddIcon />}>
                Crear Anuncio
              </Button>
            }
          />
        )}
      </Box>

      {/* ── VISTA DE TABLA (ESCRITORIO) ── */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 0, display: { xs: 'none', md: 'block' } }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8F7F4' }}>
              <TableCell sx={{ width: 60 }}></TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Título</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Fecha / Hora</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}><Skeleton height={40} /></TableCell>
                    ))}
                  </TableRow>
                ))
              : announcements?.map((a) => (
                  <TableRow key={a.id} hover>
                    <TableCell>
                      <Box
                        component="img"
                        src={a.main_image || ITEM_IMAGE_FALLBACK}
                        alt={a.title ? `Imagen miniatura de ${a.title}` : 'Imagen del anuncio'}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = ITEM_IMAGE_FALLBACK; }}
                        sx={{ width: 40, height: 40, borderRadius: 0, objectFit: 'cover' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{a.title}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={(TYPE_LABELS[a.type] || 'Otro').toUpperCase()} size="small" variant="outlined" sx={{ backgroundColor: 'transparent', color: TYPE_COLORS[a.type] || '#71717A', borderColor: TYPE_COLORS[a.type] || '#71717A', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{a.attributes?.date as string}</Typography>
                      {a.attributes?.time && <Typography variant="caption" color="text.secondary">{a.attributes.time as string}</Typography>}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={a.status === 'active' ? 'Activo' : 'Inactivo'}
                        size="small"
                        color={a.status === 'active' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton aria-label="Acción" size="small" color="primary" onClick={() => handleOpenForm(a)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton aria-label="Acción" size="small" color="error" onClick={() => setDeleting(a)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            {!isLoading && announcements?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} sx={{ p: 0, borderBottom: 0 }}>
                  <AdminEmptyState 
                    iconType="events"
                    title="No hay eventos ni anuncios activos"
                    subtitle="Crea tu primera publicación para mantener a la comunidad informada."
                    actionButton={
                      <Button variant="outlined" onClick={() => handleOpenForm()} startIcon={<AddIcon />}>
                        Crear Anuncio
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {formOpen && (
        <AnnouncementForm
          open={formOpen}
          initial={editing}
          onClose={() => setFormOpen(false)}
        />
      )}

      {/* Dialog Eliminar */}
      <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700} color="error">Eliminar Anuncio</DialogTitle>
        <DialogContent>
          <Typography>¿Estás seguro de que deseas eliminar <strong>{deleting?.title}</strong>?</Typography>
          <Typography variant="body2" color="error.main" mt={1}>Esta acción no se puede deshacer.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleting(null)} color="inherit">Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
            onClick={() => deleting && deleteMutation.mutate(deleting.id)}
            startIcon={deleteMutation.isPending ? <CircularProgress size={16} /> : undefined}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
