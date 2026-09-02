import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flavorService } from '../services/flavor.service';
import { Flavor } from '../types';
import { useTheme } from '../contexts/ThemeContext';

export function useFlavors(onlyActive = true) {
  const queryClient = useQueryClient();
  const { addToast } = useTheme();

  const query = useQuery({
    queryKey: ['flavors', { onlyActive }],
    queryFn: () => flavorService.getFlavors(onlyActive),
  });

  const createMutation = useMutation({
    mutationFn: (params: string | { name: string; active?: boolean }) => {
      const name = typeof params === 'string' ? params : params.name;
      return flavorService.createFlavor(name);
    },
    onSuccess: ({ data, error }) => {
      if (error) {
        addToast({ type: 'error', title: 'Error al crear sabor', message: error.message });
      } else if (data) {
        addToast({ type: 'success', title: 'Sabor creado', message: `El sabor "${data.name}" se ha añadido correctamente.` });
        queryClient.invalidateQueries({ queryKey: ['flavors'] });
      }
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      flavorService.toggleFlavorActive(id, active),
    onSuccess: ({ error }) => {
      if (error) {
        addToast({ type: 'error', title: 'Error al cambiar estado', message: error.message });
      } else {
        addToast({ type: 'success', title: 'Estado actualizado', message: 'El estado del sabor se ha actualizado.' });
        queryClient.invalidateQueries({ queryKey: ['flavors'] });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates, name, active }: { id: string; updates?: Partial<Flavor>; name?: string; active?: boolean }) => {
      const payload: Partial<Flavor> = updates || {};
      if (name !== undefined) payload.name = name;
      if (active !== undefined) payload.active = active;
      return flavorService.updateFlavor(id, payload);
    },
    onSuccess: ({ error }) => {
      if (error) {
        addToast({ type: 'error', title: 'Error al actualizar sabor', message: error.message });
      } else {
        addToast({ type: 'success', title: 'Sabor actualizado', message: 'Los cambios se han guardado.' });
        queryClient.invalidateQueries({ queryKey: ['flavors'] });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => flavorService.deleteFlavor(id),
    onSuccess: ({ error }) => {
      if (error) {
        addToast({ type: 'error', title: 'Error al eliminar sabor', message: error.message });
      } else {
        addToast({ type: 'success', title: 'Sabor eliminado', message: 'El sabor se ha eliminado del catálogo.' });
        queryClient.invalidateQueries({ queryKey: ['flavors'] });
      }
    },
  });

  return {
    flavors: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    createFlavor: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    toggleFlavorActive: (id: string, currentActive: boolean) =>
      toggleActiveMutation.mutateAsync({ id, active: !currentActive }),
    toggleActive: toggleActiveMutation.mutateAsync,
    updateFlavor: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteFlavor: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
