import React from 'react';
import { HistoryFilterParams } from '../../types';
import { Search, Filter, RotateCcw, Calendar, ArrowUpDown } from 'lucide-react';

interface HistoryFiltersProps {
  filters: HistoryFilterParams;
  onFilterChange: (filters: HistoryFilterParams) => void;
  onReset: () => void;
}

export const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const months = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-4 shadow-xs space-y-3">
      {/* Search and Sort row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por fecha (YYYY-MM-DD), responsable o notas..."
            value={filters.searchTerm || ''}
            onChange={(e) => onFilterChange({ ...filters, searchTerm: e.target.value })}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Sort by */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="w-4 h-4 text-stone-400" />
          <select
            value={filters.sortBy || 'recent'}
            onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value as any })}
            className="px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="recent">Más reciente primero</option>
            <option value="oldest">Más antiguo primero</option>
            <option value="highest_sales">Mayor venta ($)</option>
            <option value="highest_expenses">Mayor gasto ($)</option>
            <option value="highest_cups">Mayor cantidad de vasos</option>
          </select>
        </div>
      </div>

      {/* Date filters and quick selectors */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 pt-2 border-t border-stone-100 dark:border-stone-800">
        <div>
          <label className="block text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase mb-1">
            Presentación
          </label>
          <select
            value={filters.presentationType || ''}
            onChange={(e) => onFilterChange({ ...filters, presentationType: e.target.value as any || undefined })}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Todas</option>
            <option value="cups">🍦 Vasos ($200)</option>
            <option value="tubs_4_5l">🪣 Tinas 4.5L ($4,000)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase mb-1">
            Desde
          </label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase mb-1">
            Hasta
          </label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase mb-1">
            Mes
          </label>
          <select
            value={filters.month || ''}
            onChange={(e) => onFilterChange({ ...filters, month: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Todos los meses</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase mb-1">
            Año
          </label>
          <select
            value={filters.year || ''}
            onChange={(e) => onFilterChange({ ...filters, year: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Todos los años</option>
            {years.map((y) => (
              <option key={y} value={y.toString()}>{y}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2 sm:col-span-1 flex items-end">
          <button
            type="button"
            onClick={onReset}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar Filtros
          </button>
        </div>
      </div>
    </div>
  );
};
