import React, { useState, useEffect } from 'react';
import { Flavor } from '../../types';
import { Modal } from '../ui/Modal';
import { IceCream } from 'lucide-react';

interface FlavorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, active: boolean) => Promise<{ error: Error | null }>;
  flavor?: Flavor | null;
  isLoading?: boolean;
}

export const FlavorModal: React.FC<FlavorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  flavor,
  isLoading,
}) => {
  const [name, setName] = useState('');
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (flavor) {
      setName(flavor.name);
      setActive(flavor.active);
    } else {
      setName('');
      setActive(true);
    }
    setError(null);
  }, [flavor, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre del sabor es requerido.');
      return;
    }

    const { error } = await onSave(name.trim(), active);
    if (!error) {
      onClose();
    } else {
      setError(error.message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={flavor ? 'Editar Sabor' : 'Nuevo Sabor de Helado'}
      description={flavor ? 'Modifica el nombre o estado del sabor en el catálogo.' : 'Agrega un nuevo sabor disponible para los cierres diarios.'}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            Nombre del Sabor *
          </label>
          <div className="relative">
            <IceCream className="w-4 h-4 text-amber-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="Ej: Pistacho, Nutella, Maracuyá..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700">
          <input
            type="checkbox"
            id="flavor-active"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
          />
          <label htmlFor="flavor-active" className="text-xs text-stone-700 dark:text-stone-300 cursor-pointer">
            <span className="font-semibold block">Sabor Activo en Catálogo</span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400">
              Si está inactivo, no aparecerá en los nuevos cierres pero se preservará en el histórico.
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Guardando...' : flavor ? 'Actualizar Sabor' : 'Crear Sabor'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
