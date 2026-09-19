import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, del, post, formatApiError } from '@core/api/client';
import type { PublicUser } from '@core/types/user';

export function useUserManagement() {
  const qc = useQueryClient();

  const [createOpen,    setCreateOpen]    = useState(false);
  const [resetTarget,   setResetTarget]   = useState<PublicUser | null>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<PublicUser | null>(null);
  const [deleteError,   setDeleteError]   = useState('');
  const [forceLogoutTarget, setForceLogoutTarget] = useState<PublicUser | null>(null);
  const [forceLogoutError,  setForceLogoutError]  = useState('');

  const { data, isLoading, isError } = useQuery<{ users: PublicUser[] }>({
    queryKey: ['users-list'],
    queryFn:  () => get('/users/list'),
  });

  const deleteMutation = useMutation({
    mutationFn: (username: string) => del('/users/delete', { data: { target_username: username } }),
    onSuccess:  () => {
      void qc.invalidateQueries({ queryKey: ['users-list'] });
      setDeleteTarget(null);
    },
    onError: (e: unknown) => setDeleteError(formatApiError(e, 'Error al eliminar usuario')),
  });

  const forceLogoutMutation = useMutation({
    mutationFn: (username: string) => post('/users/force-logout', { target_username: username }),
    onSuccess:  () => {
      setForceLogoutTarget(null);
    },
    onError: (e: unknown) => setForceLogoutError(formatApiError(e, 'Error al forzar el cierre de sesión')),
  });

  return {
    users: data?.users ?? [],
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
    onUserCreated: () => void qc.invalidateQueries({ queryKey: ['users-list'] }),
  };
}
