/**
 * UserManagement — Panel de gestión de usuarios del refugio.
 * Refactorizado para usar componentes modulares.
 */
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

import { useAuth } from '@ui/context/AuthContext';
import { ROLE_LEVEL } from '@core/types/user';

import { useUserManagement } from './admin/users/useUserManagement';
import { UserTable } from './admin/users/UserTable';
import { UserFormModal } from './admin/users/UserFormModal';
import { PasswordResetModal } from './admin/users/PasswordResetModal';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  
  const {
    users,
    isLoading,
    isError,
    createOpen, setCreateOpen,
    resetTarget, setResetTarget,
    deleteTarget, setDeleteTarget,
    deleteError, setDeleteError,
    forceLogoutTarget, setForceLogoutTarget,
    forceLogoutError, setForceLogoutError,
    deleteMutation,
    forceLogoutMutation,
    onUserCreated,
  } = useUserManagement();

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" fontWeight={700}>Usuarios del sistema</Typography>
        {currentUser && ROLE_LEVEL[currentUser.role] >= ROLE_LEVEL['encargado'] && (
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ borderRadius: 0 }}
          >
            Nuevo usuario
          </Button>
        )}
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          No se pudo cargar la lista de usuarios.
        </Alert>
      )}

      <UserTable
        users={users}
        isLoading={isLoading}
        currentUser={currentUser}
        setResetTarget={setResetTarget}
        setDeleteTarget={setDeleteTarget}
        setForceLogoutTarget={setForceLogoutTarget}
        setDeleteError={setDeleteError}
        setForceLogoutError={setForceLogoutError}
      />

      <UserFormModal
        open={createOpen}
        actorRole={currentUser?.role ?? 'voluntario'}
        onClose={() => setCreateOpen(false)}
        onCreated={onUserCreated}
      />

      <PasswordResetModal
        target={resetTarget}
        onClose={() => setResetTarget(null)}
      />

      {/* Confirmación de eliminación */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle fontWeight={700} color="error">Eliminar usuario</DialogTitle>
        <DialogContent>
          {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
          <Typography>
            ¿Estás seguro de que deseas eliminar a <strong>{deleteTarget?.username}</strong>?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
            onClick={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.username); }}
            startIcon={deleteMutation.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
      {/* Confirmación de Forzar Cierre de Sesión */}
      <Dialog open={Boolean(forceLogoutTarget)} onClose={() => setForceLogoutTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle fontWeight={700}>Forzar cierre de sesión</DialogTitle>
        <DialogContent>
          {forceLogoutError && <Alert severity="error" sx={{ mb: 2 }}>{forceLogoutError}</Alert>}
          {forceLogoutMutation.isSuccess && !forceLogoutError ? (
            <Alert severity="success" sx={{ mb: 2 }}>Sesiones invalidadas con éxito.</Alert>
          ) : (
            <Typography>
              ¿Estás seguro de que deseas forzar el cierre de todas las sesiones activas de <strong>{forceLogoutTarget?.username}</strong>?
              Deberá iniciar sesión nuevamente.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setForceLogoutTarget(null); forceLogoutMutation.reset(); }} color="inherit">
            {forceLogoutMutation.isSuccess && !forceLogoutError ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!forceLogoutMutation.isSuccess && (
            <Button
              variant="contained"
              color="info"
              disabled={forceLogoutMutation.isPending}
              onClick={() => { if (forceLogoutTarget) forceLogoutMutation.mutate(forceLogoutTarget.username); }}
              startIcon={forceLogoutMutation.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              Forzar Cierre
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
