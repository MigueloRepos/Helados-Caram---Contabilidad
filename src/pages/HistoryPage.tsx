import React, { useState } from 'react';
import { useClosings } from '../hooks/useClosings';
import { useAuth } from '../contexts/AuthContext';
import { DailyClosing, HistoryFilterParams } from '../types';
import { HistoryFilters } from '../components/history/HistoryFilters';
import { HistoryTable } from '../components/history/HistoryTable';
import { ClosingDetailModal } from '../components/history/ClosingDetailModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { LoadingState } from '../components/ui/FeedbackStates';
import { formatCurrency, formatNumber } from '../lib/utils';
import { exportService } from '../services/export.service';
import {
  History,
  Plus,
  Download,
  DollarSign,
  Coffee,
  Scale,
  TrendingDown,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from 'lucide-react';

interface HistoryPageProps {
  onNavigate: (path: string) => void;
  onEditClosing: (closing: DailyClosing) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  onNavigate,
  onEditClosing,
}) => {
  const { isAdmin } = useAuth();
  const [filters, setFilters] = useState<HistoryFilterParams>({
    sortBy: 'recent',
  });

  const { closings, isLoading, deleteClosing, isDeleting } = useClosings(filters);

  const [selectedClosing, setSelectedClosing] = useState<DailyClosing | null>(null);
  const [closingToDelete, setClosingToDelete] = useState<DailyClosing | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const handleResetFilters = () => {
    setFilters({ sortBy: 'recent' });
  };

  const handleConfirmDelete = async () => {
    if (closingToDelete) {
      await deleteClosing(closingToDelete.id);
      setClosingToDelete(null);
      if (selectedClosing?.id === closingToDelete.id) {
        setSelectedClosing(null);
      }
    }
  };

  // Aggregated totals of currently filtered results
  const totalSales = closings.reduce((sum, c) => sum + Number(c.total_sales || 0), 0);
  const totalExpenses = closings.reduce((sum, c) => sum + Number(c.total_expenses || 0), 0);
  const totalBalance = closings.reduce((sum, c) => sum + Number(c.balance || 0), 0);
  const totalCups = closings.reduce((sum, c) => sum + Number(c.total_cups || 0), 0);

  const handleExportCSV = () => {
    setIsExportMenuOpen(false);
    exportService.exportToCSV(closings);
  };

  const handleExportExcel = () => {
    setIsExportMenuOpen(false);
    exportService.exportToExcel(closings);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-xl font-bold font-display text-stone-900 dark:text-white">
              Historial de Cierres Contables
            </h2>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Consulta, filtra y audita todos los balances y cierres diarios registrados
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto relative">
          {/* Export Dropdown Group */}
          <div className="relative">
            <button
              id="btn-export-options"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              disabled={closings.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 text-stone-700 dark:text-stone-300 text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Auditoría & Exportar</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {isExportMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsExportMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-stone-200 dark:border-stone-700 py-1.5 z-30 text-xs">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 tracking-wider">
                    Formatos de Auditoría
                  </div>

                  <button
                    onClick={handleExportExcel}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-stone-700 dark:text-stone-200 hover:bg-amber-50 dark:hover:bg-stone-700/60 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <div className="font-semibold">Descargar Excel (.xlsx)</div>
                      <div className="text-[10px] text-stone-400">Libro multi-hoja con desglose</div>
                    </div>
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-stone-700 dark:text-stone-200 hover:bg-amber-50 dark:hover:bg-stone-700/60 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <div>
                      <div className="font-semibold">Descargar CSV (.csv)</div>
                      <div className="text-[10px] text-stone-400">Formato universal con BOM UTF-8</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => onNavigate('/cierre-diario')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-98"
          >
            <Plus className="w-4 h-4" />
            Nuevo Cierre
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <HistoryFilters
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* Quick Summary Pill Bar of Filtered Query */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Coffee className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-stone-400 uppercase font-semibold block">
              Vasos Filtrados
            </span>
            <span className="text-sm font-bold text-stone-900 dark:text-white">
              {formatNumber(totalCups)} u.
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-stone-400 uppercase font-semibold block">
              Total Ventas
            </span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalSales)}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-stone-400 uppercase font-semibold block">
              Total Gastos
            </span>
            <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(totalExpenses)}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-stone-400 uppercase font-semibold block">
              Balance Neto
            </span>
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
              {formatCurrency(totalBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <LoadingState message="Cargando historial de cierres..." />
      ) : (
        <HistoryTable
          closings={closings}
          onViewDetail={(c) => setSelectedClosing(c)}
          onEdit={(c) => onEditClosing(c)}
          onDelete={(c) => setClosingToDelete(c)}
          canEdit={true}
          canDelete={isAdmin}
          onNewClosing={() => onNavigate('/cierre-diario')}
        />
      )}

      {/* Detail Modal */}
      <ClosingDetailModal
        closing={selectedClosing}
        isOpen={!!selectedClosing}
        onClose={() => setSelectedClosing(null)}
        onEdit={(c) => {
          setSelectedClosing(null);
          onEditClosing(c);
        }}
        onDelete={(c) => {
          setSelectedClosing(null);
          setClosingToDelete(c);
        }}
        canEdit={true}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!closingToDelete}
        onClose={() => setClosingToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar Cierre Diario?"
        message={`¿Estás seguro de que deseas eliminar el cierre contable del día ${closingToDelete?.closing_date}? Esta acción eliminará el registro financiero y el desglose de sabores permanentemente.`}
        confirmText="Eliminar Cierre"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
};
