import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { closingService } from '../services/closing.service';
import { DailyClosingFormData, HistoryFilterParams } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export function useClosings(filters?: HistoryFilterParams) {
  const queryClient = useQueryClient();
  const { showToast } = useTheme();
  const { profile } = useAuth();

  const query = useQuery({
    queryKey: ['daily_closings', filters],
    queryFn: () => closingService.getDailyClosings(filters),
  });

  const createMutation = useMutation({
    mutationFn: (formData: DailyClosingFormData) => {
      if (!profile?.id) {
        throw new Error('Debes iniciar sesión para registrar un cierre.');
      }
      return closingService.createDailyClosing(formData, profile.id);
    },
    onSuccess: ({ data, error }) => {
      if (error) {
        showToast('error', 'Error al guardar cierre', error.message);
      } else if (data) {
        showToast('success', 'Cierre diario guardado', `Cierre del ${data.closing_date} registrado correctamente.`);
        queryClient.invalidateQueries({ queryKey: ['daily_closings'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
        queryClient.invalidateQueries({ queryKey: ['sales_chart'] });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: Partial<DailyClosingFormData> }) =>
      closingService.updateDailyClosing(id, formData),
    onSuccess: ({ error }) => {
      if (error) {
        showToast('error', 'Error al actualizar cierre', error.message);
      } else {
        showToast('success', 'Cierre actualizado', 'Los datos del cierre han sido actualizados.');
        queryClient.invalidateQueries({ queryKey: ['daily_closings'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
        queryClient.invalidateQueries({ queryKey: ['sales_chart'] });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => closingService.deleteDailyClosing(id),
    onSuccess: ({ error }) => {
      if (error) {
        showToast('error', 'Error al eliminar cierre', error.message);
      } else {
        showToast('success', 'Cierre eliminado', 'El registro de cierre ha sido eliminado.');
        queryClient.invalidateQueries({ queryKey: ['daily_closings'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
        queryClient.invalidateQueries({ queryKey: ['sales_chart'] });
      }
    },
  });

  return {
    closings: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    createClosing: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateClosing: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteClosing: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
