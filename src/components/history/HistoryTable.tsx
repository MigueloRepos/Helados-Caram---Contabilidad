import React, { useState } from 'react';
import { DailyClosing } from '../../types';
import { formatCurrency, formatNumber } from '../../lib/utils';
import {
  getClosingPresentation,
  getPresentationConfig,
  formatUnitCount,
  PresentationBadge,
} from '../../lib/presentation';
import { exportService } from '../../services/export.service';
import { Eye, Edit, Trash2, Calendar, User, ArrowRight, FileText, Download } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/FeedbackStates';

interface HistoryTableProps {
  closings: DailyClosing[];
  onViewDetail: (closing: DailyClosing) => void;
  onEdit: (closing: DailyClosing) => void;
  onDelete: (closing: DailyClosing) => void;
  canEdit: boolean;
  canDelete: boolean;
  onNewClosing: () => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  closings,
  onViewDetail,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  onNewClosing,
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleQuickPDF = (closing: DailyClosing, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingId(closing.id);
    try {
      exportService.generateClosingPDF(closing);
    } catch (err) {
      console.error('Error generando PDF:', err);
    } finally {
      setTimeout(() => setDownloadingId(null), 1000);
    }
  };

  if (closings.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No se encontraron cierres contables"
        description="No hay registros que coincidan con los filtros seleccionados o aún no se ha registrado el primer cierre del negocio."
        actionText="Registrar Cierre Diario"
        onAction={onNewClosing}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-800/50 text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4">Fecha</th>
              <th className="py-3.5 px-4">Tipo</th>
              <th className="py-3.5 px-4">Responsable</th>
              <th className="py-3.5 px-4 text-right">Cantidad</th>
              <th className="py-3.5 px-4 text-right">Ventas ($)</th>
              <th className="py-3.5 px-4 text-right">Gastos ($)</th>
              <th className="py-3.5 px-4 text-right">Entregado Frank</th>
              <th className="py-3.5 px-4 text-right">Balance</th>
              <th className="py-3.5 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80 text-stone-700 dark:text-stone-200">
            {closings.map((closing) => {
              const isBalancePositive = closing.balance >= 0;
              const isDownloadingThis = downloadingId === closing.id;
              const presentationType = getClosingPresentation(closing);
              const presentationConfig = getPresentationConfig(presentationType);

              return (
                <tr
                  key={closing.id}
                  className="hover:bg-amber-50/30 dark:hover:bg-stone-800/40 transition-colors group cursor-pointer"
                  onClick={() => onViewDetail(closing)}
                >
                  {/* Fecha */}
                  <td className="py-3.5 px-4 font-semibold text-stone-900 dark:text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {closing.closing_date}
                    </div>
                  </td>

                  {/* Tipo */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <PresentationBadge type={presentationType} size="sm" />
                  </td>

                  {/* Responsable */}
                  <td className="py-3.5 px-4 text-stone-600 dark:text-stone-300">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-stone-400" />
                      <span className="truncate max-w-[120px]">
                        {closing.profile?.full_name || 'Usuario'}
                      </span>
                    </div>
                  </td>

                  {/* Cantidad */}
                  <td className="py-3.5 px-4 text-right font-bold text-stone-900 dark:text-white">
                    <span>{formatNumber(closing.total_cups)}</span>{' '}
                    <span className="text-[10px] font-normal text-stone-500">{presentationConfig.unitPlural}</span>
                  </td>

                  {/* Ventas */}
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(closing.total_sales)}
                  </td>

                  {/* Gastos */}
                  <td className="py-3.5 px-4 text-right font-semibold text-rose-600 dark:text-rose-400">
                    {formatCurrency(closing.total_expenses)}
                  </td>

                  {/* Entregado Frank */}
                  <td className="py-3.5 px-4 text-right font-semibold text-blue-600 dark:text-blue-400">
                    {formatCurrency(closing.delivered_to_frank)}
                  </td>

                  {/* Balance */}
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={cn(
                        'font-bold px-2 py-0.5 rounded-md text-[11px]',
                        isBalancePositive
                          ? 'text-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'text-rose-800 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300'
                      )}
                    >
                      {formatCurrency(closing.balance)}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td
                    className="py-3.5 px-4 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onViewDetail(closing)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        title="Ver detalle del cierre"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => handleQuickPDF(closing, e)}
                        disabled={isDownloadingThis}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                        title="Descargar Reporte PDF Detallado"
                      >
                        <FileText className={cn("w-4 h-4", isDownloadingThis && "animate-bounce text-amber-600")} />
                      </button>

                      {canEdit && (
                        <button
                          onClick={() => onEdit(closing)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                          title="Editar cierre"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => onDelete(closing)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Eliminar cierre"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer Count */}
      <div className="px-4 py-3 bg-stone-50 dark:bg-stone-800/40 border-t border-stone-200 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400 flex items-center justify-between">
        <span>Mostrando {closings.length} registro(s)</span>
        <span className="text-[11px]">Haz clic en cualquier fila para ver el comprobante completo o en el ícono de documento para PDF</span>
      </div>
    </div>
  );
};

