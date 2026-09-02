import React, { useState } from 'react';
import { Flavor } from '../../types';
import { useFlavors } from '../../hooks/useFlavors';
import { FlavorModal } from './FlavorModal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Badge } from '../ui/Badge';
import { LoadingState, EmptyState } from '../ui/FeedbackStates';
import {
  IceCream,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export const FlavorList: React.FC = () => {
  const {
    flavors,
    isLoading,
    createFlavor,
    updateFlavor,
    toggleFlavorActive,
    deleteFlavor,
    isCreating,
    isUpdating,
    isDeleting,
  } = useFlavors(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedFlavor, setSelectedFlavor] = useState<Flavor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [flavorToDelete, setFlavorToDelete] = useState<Flavor | null>(null);

  const filteredFlavors = flavors.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterActive === 'all' ||
      (filterActive === 'active' && f.active) ||
      (filterActive === 'inactive' && !f.active);
    return matchesSearch && matchesFilter;
  });

  const handleOpenCreate = () => {
    setSelectedFlavor(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (flavor: Flavor) => {
    setSelectedFlavor(flavor);
    setIsModalOpen(true);
  };

  const handleSave = async (name: string, active: boolean) => {
    if (selectedFlavor) {
      return await updateFlavor({ id: selectedFlavor.id, name, active });
    } else {
      return await createFlavor({ name, active });
    }
  };

  const handleConfirmDelete = async () => {
    if (flavorToDelete) {
      await deleteFlavor(flavorToDelete.id);
      setFlavorToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-stone-900 dark:text-white">
            Catálogo de Sabores de Helados
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Administra los sabores ofrecidos en Helados Caram para los cierres diarios
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs shadow-amber-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nuevo Sabor
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar sabor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setFilterActive('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filterActive === 'all'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-300'
            }`}
          >
            Todos ({flavors.length})
          </button>
          <button
            onClick={() => setFilterActive('active')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filterActive === 'active'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-300'
            }`}
          >
            Activos ({flavors.filter((f) => f.active).length})
          </button>
          <button
            onClick={() => setFilterActive('inactive')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filterActive === 'inactive'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-300'
            }`}
          >
            Inactivos ({flavors.filter((f) => !f.active).length})
          </button>
        </div>
      </div>

      {/* Flavors Grid / List */}
      {isLoading ? (
        <LoadingState message="Cargando catálogo de sabores..." />
      ) : filteredFlavors.length === 0 ? (
        <EmptyState
          icon={IceCream}
          title="No se encontraron sabores"
          description={
            searchTerm
              ? `No hay coincidencias para "${searchTerm}".`
              : 'Aún no has registrado sabores en el catálogo.'
          }
          actionText="Crear Primer Sabor"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFlavors.map((flavor) => (
            <div
              key={flavor.id}
              className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-4 shadow-xs hover:border-amber-300 dark:hover:border-stone-700 transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                    🍦
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                      {flavor.name}
                    </h4>
                    <span className="text-[10px] text-stone-400">
                      ID: {flavor.id.slice(0, 8)}...
                    </span>
                  </div>
                </div>

                <Badge variant={flavor.active ? 'emerald' : 'stone'}>
                  {flavor.active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
                <button
                  onClick={() => toggleFlavorActive(flavor.id, flavor.active)}
                  className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 text-[11px]"
                  title={flavor.active ? 'Desactivar sabor' : 'Activar sabor'}
                >
                  {flavor.active ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-emerald-600" />
                      <span>Desactivar</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-stone-400" />
                      <span>Activar</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(flavor)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-stone-800 transition-colors"
                    title="Editar nombre"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setFlavorToDelete(flavor)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-stone-800 transition-colors"
                    title="Eliminar sabor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Flavor Modal */}
      <FlavorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        flavor={selectedFlavor}
        isLoading={isCreating || isUpdating}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!flavorToDelete}
        onClose={() => setFlavorToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar Sabor?"
        message={`¿Estás seguro de que deseas eliminar permanentemente el sabor "${flavorToDelete?.name}"? Esta acción no se puede deshacer. (Si el sabor ya tiene cierres asociados, te sugerimos solo desactivarlo).`}
        confirmText="Eliminar Sabor"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
};
