import React from 'react';
import { Flavor } from '../../types';
import { Trash2 } from 'lucide-react';

interface FlavorRowItemProps {
  index: number;
  flavorId: string;
  quantity: number;
  availableFlavors: Flavor[];
  onFlavorChange: (index: number, flavorId: string) => void;
  onQuantityChange: (index: number, quantity: number) => void;
  onRemove: (index: number) => void;
  isRemovable: boolean;
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
}) => {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/60">
      <div className="flex-1 min-w-[140px]">
        <select
          value={flavorId}
          onChange={(e) => onFlavorChange(index, e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
        >
          <option value="">-- Selecciona un sabor --</option>
          {availableFlavors.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} {!f.active ? '(Inactivo)' : ''}
            </option>
          ))}
        </select>
      </div>

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
        className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
        title="Quitar sabor"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
