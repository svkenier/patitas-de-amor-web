import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Stack from '@mui/material/Stack';
import LockResetIcon  from '@mui/icons-material/LockReset';
import DeleteIcon     from '@mui/icons-material/Delete';
import LogoutIcon     from '@mui/icons-material/Logout';
import { canManage } from '@core/types/user';
import type { PublicUser, UserRole } from '@core/types/user';
import AdminEmptyState from '@ui/components/AdminEmptyState';


const ROLE_COLORS: Record<UserRole, 'error' | 'warning' | 'default'> = {
  superadmin: 'error',
  encargado:  'warning',
  voluntario: 'default',
};

interface UserTableProps {
  users: PublicUser[];
  isLoading: boolean;
  currentUser: PublicUser | null;
  setResetTarget: (user: PublicUser | null) => void;
  setDeleteTarget: (user: PublicUser | null) => void;
  setForceLogoutTarget: (user: PublicUser | null) => void;
  setDeleteError: (msg: string) => void;
  setForceLogoutError: (msg: string) => void;
}

export function UserTable({
  users,
  isLoading,
  currentUser,
  setResetTarget,
  setDeleteTarget,
  setForceLogoutTarget,
  setDeleteError,
  setForceLogoutError,
}: UserTableProps) {
  const canActOn = (target: PublicUser) => {
    if (!currentUser) return { canReset: false, canDelete: false, canForceLogout: false, disabledReason: '' };
    
    const isMainOwner = Boolean(currentUser.isProtected);
    const isTargetMainOwner = Boolean(target.isProtected);
    
    if (isTargetMainOwner) {
      if (!isMainOwner) {
        return { 
          canReset: true, 
          canDelete: true, 
          canForceLogout: false,
          disabled: true, 
          disabledReason: 'El superusuario principal no puede ser modificado ni eliminado' 
        };
      } else {
        return { 
          canReset: false,
          canDelete: false,
          canForceLogout: false,
          disabled: false, 
          disabledReason: '' 
        };
      }
    }
    
    if (target.username === currentUser.username) {
      return { canReset: false, canDelete: false, canForceLogout: false, disabledReason: '' };
    }
    
    if (isMainOwner) {
      return { canReset: true, canDelete: true, canForceLogout: true, disabled: false, disabledReason: '' };
    }
    
    const hasPermission = canManage(currentUser.role, target.role);
    return { 
      canReset: hasPermission, 
      canDelete: hasPermission, 
      canForceLogout: false,
      disabled: false, 
      disabledReason: '' 
    };
  };

  return (
    <>
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} variant="outlined" sx={{ borderRadius: 0 }}>
              <CardContent><Skeleton variant="rectangular" height={100} /></CardContent>
            </Card>
          ))
        ) : users.map((u) => (
          <Card key={u.username} variant="outlined" sx={{ borderRadius: 0 }}>
            <CardContent sx={{ pb: 1 }}>
              <Typography variant="h6" fontWeight={700} lineHeight={1.2} mb={0.5}>
                {u.username}
                {u.username === currentUser?.username && (
                  <Typography component="span" variant="caption" color="text.disabled" ml={1}>(tú)</Typography>
                )}
              </Typography>
              <Chip
                label={u.role}
                size="small"
                color={ROLE_COLORS[u.role]}
                variant="outlined"
                sx={{ textTransform: 'capitalize', mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary" display="block">
                Creado por: {u.created_by ?? '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary" display="block">
                Último acceso: {u.last_login ? new Date(u.last_login).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
              </Typography>
            </CardContent>
            {(() => {
              const actionStatus = canActOn(u);
              if (!actionStatus.canReset && !actionStatus.canDelete && !actionStatus.canForceLogout) return null;
              return (
                <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                  <Stack direction="row" spacing={1} width="100%">
                    {actionStatus.canReset && (
                      <Tooltip title={actionStatus.disabled ? actionStatus.disabledReason : "Resetear contraseña"}>
                        <span style={{ width: '100%' }}>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            color="warning" 
                            fullWidth
                            disabled={actionStatus.disabled}
                            onClick={() => setResetTarget(u)}
                            startIcon={<LockResetIcon />}
                            aria-label="Restablecer"
                            data-testid={`reset-${u.username}`}
                          >
                            Resetear
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                    {actionStatus.canForceLogout && (
                      <Tooltip title="Forzar cierre de todas las sesiones de este usuario">
                        <span style={{ display: 'inline-flex' }}>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            color="info"
                            disabled={actionStatus.disabled}
                            onClick={() => { setForceLogoutError(''); setForceLogoutTarget(u); }}
                            sx={{ minWidth: 40, px: 0 }}
                            aria-label="Forzar cierre de sesiones"
                            data-testid={`force-logout-${u.username}`}
                          >
                            <LogoutIcon />
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                    {actionStatus.canDelete && (
                      <Tooltip title={actionStatus.disabled ? actionStatus.disabledReason : "Eliminar usuario"}>
                        <span style={{ display: 'inline-flex' }}>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            color="error"
                            disabled={actionStatus.disabled}
                            onClick={() => { setDeleteError(''); setDeleteTarget(u); }}
                            sx={{ minWidth: 40, px: 0 }}
                          >
                            <DeleteIcon />
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                  </Stack>
                </CardActions>
              );
            })()}
          </Card>
        ))}
        {!isLoading && users.length === 0 && (
          <AdminEmptyState 
            iconType="users"
            title="No hay usuarios registrados"
            subtitle="El sistema no tiene usuarios activos en este momento."
          />
        )}
      </Box>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 0, display: { xs: 'none', md: 'block' } }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8F7F4' }}>
              <TableCell sx={{ fontWeight: 700 }}>Usuario</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Rol</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Creado por</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Último acceso</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              : users.map((u) => (
                  <TableRow key={u.username} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{u.username}</Typography>
                      {u.username === currentUser?.username && (
                        <Typography variant="caption" color="text.disabled">(tú)</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={u.role}
                        size="small"
                        color={ROLE_COLORS[u.role]}
                        variant="outlined"
                        sx={{ textTransform: 'capitalize', fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{u.created_by ?? '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {u.last_login
                          ? new Date(u.last_login).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' })
                          : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {(() => {
                        const actionStatus = canActOn(u);
                        return (
                          <>
                            {actionStatus.canReset && (
                              <Tooltip title={actionStatus.disabled ? actionStatus.disabledReason : "Resetear contraseña"}>
                                <span>
                                  <IconButton size="small" color="warning" disabled={actionStatus.disabled} onClick={() => setResetTarget(u)} aria-label="Restablecer" data-testid={`reset-${u.username}`}>
                                    <LockResetIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                            {actionStatus.canForceLogout && (
                              <Tooltip title="Forzar cierre de sesiones">
                                <span>
                                  <IconButton size="small" color="info" disabled={actionStatus.disabled} onClick={() => { setForceLogoutError(''); setForceLogoutTarget(u); }} aria-label="Forzar cierre de sesiones" data-testid={`force-logout-${u.username}`}>
                                    <LogoutIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                            {actionStatus.canDelete && (
                              <Tooltip title={actionStatus.disabled ? actionStatus.disabledReason : "Eliminar usuario"}>
                                <span>
                                  <IconButton aria-label="Acción" size="small" color="error" disabled={actionStatus.disabled} onClick={() => { setDeleteError(''); setDeleteTarget(u); }}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                          </>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                ))}
            {!isLoading && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} sx={{ p: 0, borderBottom: 0 }}>
                  <AdminEmptyState 
                    iconType="users"
                    title="No hay usuarios registrados"
                    subtitle="El sistema no tiene usuarios activos en este momento."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
