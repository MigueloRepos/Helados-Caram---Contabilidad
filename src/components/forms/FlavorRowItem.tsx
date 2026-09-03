import React, { useState } from 'react';
import { Flavor } from '../../types';
import { Trash2, Plus, IceCream, Check, X } from 'lucide-react';

interface FlavorRowItemProps {
  index: number;
  flavorId: string;
  quantity: number;
  availableFlavors: Flavor[];
  onFlavorChange: (index: number, flavorId: string) => void;
  onQuantityChange: (index: number, quantity: number) => void;
  onRemove: (index: number) => void;
  isRemovable: boolean;
  onQuickCreateFlavor?: (name: string, rowIndex: number) => Promise<void>;
}

export const FlavorRowItem: React.FC<FlavorRowItemProps> = ({
  index,
  flavorId,
  quantity,
  availableFlavors,
  onFlavorChange,
  onQuantityChange,
  onRemove,
  isRemovable,
  onQuickCreateFlavor,
}) => {
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newFlavorName, setNewFlavorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlavorName.trim() || !onQuickCreateFlavor) return;
    try {
      setIsSubmitting(true);
      await onQuickCreateFlavor(newFlavorName.trim(), index);
      setNewFlavorName('');
      setIsCreatingInline(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/60 transition-all">
      {/* Flavor selection or inline creator */}
      <div className="flex-1 min-w-[140px]">
        {isCreatingInline ? (
          <form onSubmit={handleInlineSubmit} className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <IceCream className="w-3.5 h-3.5 text-amber-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Nombre del nuevo sabor..."
                value={newFlavorName}
                onChange={(e) => setNewFlavorName(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-xs rounded-xl border border-amber-400 dark:border-amber-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!newFlavorName.trim() || isSubmitting}
              className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40 transition-colors"
              title="Guardar sabor"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreatingInline(false);
                setNewFlavorName('');
              }}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              title="Cancelar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-1.5">
            <select
              value={flavorId}
              onChange={(e) => {
                if (e.target.value === '__CREATE_NEW__') {
                  setIsCreatingInline(true);
                } else {
                  onFlavorChange(index, e.target.value);
                }
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="">-- Selecciona un sabor --</option>
              {availableFlavors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} {!f.active ? '(Inactivo)' : ''}
                </option>
              ))}
              <option value="__CREATE_NEW__" className="font-bold text-amber-600">
                ➕ + Crear nuevo sabor manualmente...
              </option>
            </select>

            {onQuickCreateFlavor && (
              <button
                type="button"
                onClick={() => setIsCreatingInline(true)}
                className="p-2 rounded-xl border border-dashed border-amber-300 dark:border-amber-700/60 bg-amber-50/60 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors shrink-0"
                title="Escribir y crear un sabor manualmente"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quantity & Delete Action */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <div className="w-28 sm:w-36 shrink-0 flex items-center gap-1.5">
          <input
            type="number"
            min="0"
            placeholder="Vasos"
            value={quantity === 0 ? '' : quantity}
            onChange={(e) => onQuantityChange(index, Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-semibold text-right focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
          <span className="text-[11px] text-stone-400">u.</span>
        </div>

        <button
          type="button"
          onClick={() => onRemove(index)}
          disabled={!isRemovable}
          className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors disabled:opacity-30 disabled:hover:bg-transparent shrink-0"
          title="Quitar sabor"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

