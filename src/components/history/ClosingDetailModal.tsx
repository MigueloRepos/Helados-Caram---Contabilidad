import React, { useState } from 'react';
import { DailyClosing } from '../../types';
import { Modal } from '../ui/Modal';
import { formatDateFull, formatCurrency, formatNumber } from '../../lib/utils';
import { exportService } from '../../services/export.service';
import {
  Calendar,
  Coffee,
  DollarSign,
  TrendingDown,
  Wallet,
  Scale,
  User,
  FileText,
  Printer,
  Edit,
  Trash2,
  Download,
  FileSpreadsheet,
  Check,
  BookOpen,
  Eye,
  Minimize2,
  Receipt,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface ClosingDetailModalProps {
  closing: DailyClosing | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (closing: DailyClosing) => void;
  onDelete?: (closing: DailyClosing) => void;
  canEdit?: boolean;
}

export const ClosingDetailModal: React.FC<ClosingDetailModalProps> = ({
  closing,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  canEdit = true,
}) => {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isReadMode, setIsReadMode] = useState(false);

  if (!closing) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    setIsExportingPDF(true);
    try {
      exportService.generateClosingPDF(closing);
    } catch (err) {
      console.error('Error generando PDF:', err);
    } finally {
      setTimeout(() => setIsExportingPDF(false), 1000);
    }
  };

  const isBalancePositive = closing.balance >= 0;
  const isRemainingPositive = closing.remaining_balance >= 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReadMode ? `TICKET DE CIERRE (${closing.closing_date})` : `CIERRE DEL ${closing.closing_date}`}
      description={formatDateFull(closing.closing_date)}
      maxWidth={isReadMode ? 'md' : 'lg'}
    >
      <div className={cn("space-y-4 text-xs transition-all", isReadMode && "p-2 font-mono print:p-0")}>
        {/* Header Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 print:hidden">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span className="text-stone-700 dark:text-stone-300">
              Registrado por: <strong>{closing.profile?.full_name || 'Usuario'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
            {/* Toggle Reading Mode / Simplified Print */}
            <button
              id="btn-toggle-read-mode"
              onClick={() => setIsReadMode(!isReadMode)}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors border',
                isReadMode
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50'
              )}
              title={isReadMode ? 'Salir del modo ticket simplificado' : 'Activar vista ticket simplificada para imprimir o lectura rápida'}
            >
              {isReadMode ? (
                <>
                  <Minimize2 className="w-3 h-3" /> Modo Estándar
                </>
              ) : (
                <>
                  <Receipt className="w-3 h-3" /> Impresión Simplificada
                </>
              )}
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
              title="Descargar Comprobante Contable en PDF"
            >
              <Download className="w-3 h-3" />
              {isExportingPDF ? 'PDF...' : 'Reporte PDF'}
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 text-[11px] font-medium"
            >
              <Printer className="w-3 h-3" /> Imprimir
            </button>
          </div>
        </div>

        {/* SIMPLIFIED TICKET / READING MODE VIEW */}
        {isReadMode ? (
          <div className="bg-white dark:bg-stone-900 border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-2xl p-5 shadow-xs space-y-4 max-w-sm mx-auto">
            {/* Ticket Header */}
            <div className="text-center pb-3 border-b border-stone-200 dark:border-stone-700">
              <h3 className="text-base font-extrabold tracking-wider text-stone-900 dark:text-white uppercase font-display">
                HELADOS CARAM
              </h3>
              <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-0.5">
                COMPROBANTE DIARIO DE CUADRE
              </p>
              <div className="text-[11px] font-bold text-stone-800 dark:text-stone-200 mt-2">
                Fecha: {closing.closing_date}
              </div>
              <div className="text-[10px] text-stone-500">
                Atendido por: {closing.profile?.full_name || 'Personal Autorizado'}
              </div>
            </div>

            {/* Sales & Flavors in Ticket format */}
            <div className="space-y-1.5 pb-3 border-b border-dashed border-stone-300 dark:border-stone-700 text-xs">
              <div className="flex justify-between font-bold text-stone-900 dark:text-white">
                <span>TOTAL VASOS:</span>
                <span>{formatNumber(closing.total_cups)} u.</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                <span>VENTAS BRUTAS:</span>
                <span>{formatCurrency(closing.total_sales)}</span>
              </div>

              {closing.flavors && closing.flavors.length > 0 && (
                <div className="pt-2 pl-2 space-y-1 text-[11px] text-stone-600 dark:text-stone-300 border-t border-stone-100 dark:border-stone-800">
                  <span className="font-bold text-[10px] uppercase text-stone-400 block">Desglose:</span>
                  {closing.flavors.map((f, i) => (
                    <div key={i} className="flex justify-between">
                      <span>• {f.flavor?.name || f.flavor_name || 'Sabor'}</span>
                      <span className="font-semibold">{f.quantity} u.</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Itemized Expenses in Ticket format */}
            <div className="space-y-1 pb-3 border-b border-dashed border-stone-300 dark:border-stone-700 text-xs">
              <span className="font-bold text-[10px] uppercase text-stone-400 block">Gastos Operativos:</span>
              <div className="flex justify-between text-stone-600 dark:text-stone-300">
                <span>Salario Trabajadores</span>
                <span>{formatCurrency(closing.workers_salary)}</span>
              </div>
              <div className="flex justify-between text-stone-600 dark:text-stone-300">
                <span>Salario Mensajero</span>
                <span>{formatCurrency(closing.delivery_salary)}</span>
              </div>
              <div className="flex justify-between text-stone-600 dark:text-stone-300">
                <span>Otros Gastos</span>
                <span>{formatCurrency(closing.other_expenses)}</span>
              </div>
              <div className="flex justify-between font-bold text-rose-600 dark:text-rose-400 pt-1 border-t border-stone-100 dark:border-stone-800">
                <span>TOTAL GASTOS:</span>
                <span>{formatCurrency(closing.total_expenses)}</span>
              </div>
            </div>

            {/* Bottom Financial Reconciliation */}
            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex justify-between font-bold text-stone-900 dark:text-white">
                <span>BALANCE NETO:</span>
                <span className={cn(isBalancePositive ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600')}>
                  {formatCurrency(closing.balance)}
                </span>
              </div>
              <div className="flex justify-between text-blue-600 dark:text-blue-400 font-bold">
                <span>ENTREGADO A FRANK:</span>
                <span>{formatCurrency(closing.delivered_to_frank)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm pt-2 border-t-2 border-stone-900 dark:border-white">
                <span>RESTANTE EN CAJA:</span>
                <span className={cn(isRemainingPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600')}>
                  {formatCurrency(closing.remaining_balance)}
                </span>
              </div>
            </div>

            {closing.notes && (
              <div className="pt-2 text-[10px] text-stone-500 italic border-t border-dashed border-stone-300 dark:border-stone-700">
                <strong>Nota:</strong> {closing.notes}
              </div>
            )}

            {/* Stamp / Receipt Footer */}
            <div className="text-center pt-2 text-[9px] text-stone-400">
              *** DOCUMENTO DE CONTROL INTERNO ***
            </div>
          </div>
        ) : (
          /* STANDARD FULL DASHBOARD MODAL VIEW */
          <>
            {/* 1. VENTAS */}
            <div className="p-4 rounded-xl bg-white dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-2">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-700/60 pb-2">
                <span className="font-bold uppercase tracking-wider text-stone-900 dark:text-white flex items-center gap-1.5">
                  <Coffee className="w-4 h-4 text-amber-600" />
                  VENTAS
                </span>
                <div className="text-right">
                  <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 block">
                    {formatCurrency(closing.total_sales)}
                  </span>
                  <span className="text-[11px] text-stone-400">
                    {formatNumber(closing.total_cups)} vasos vendidos
                  </span>
                </div>
              </div>
            </div>

            {/* 2. SABORES DESGLOSE */}
            <div className="p-4 rounded-xl bg-white dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-2.5">
              <span className="font-bold uppercase tracking-wider text-stone-900 dark:text-white block border-b border-stone-100 dark:border-stone-700/60 pb-1.5">
                SABORES
              </span>
              {closing.flavors && closing.flavors.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {closing.flavors.map((f, i) => (
                    <div key={i} className="flex justify-between py-1 px-2 rounded-lg bg-stone-50 dark:bg-stone-800/80">
                      <span className="text-stone-600 dark:text-stone-300 font-medium">
                        {f.flavor?.name || f.flavor_name || 'Sabor'}
                      </span>
                      <span className="font-bold text-stone-900 dark:text-white">
                        {f.quantity} vasos
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-stone-400 italic">No se detallaron sabores en este cierre.</span>
              )}
            </div>

            {/* 3. GASTOS */}
            <div className="p-4 rounded-xl bg-white dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-2">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-700/60 pb-1.5">
                <span className="font-bold uppercase tracking-wider text-stone-900 dark:text-white flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                  GASTOS
                </span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  Total gastos — {formatCurrency(closing.total_expenses)}
                </span>
              </div>

              <div className="space-y-1 pt-1 text-stone-600 dark:text-stone-300">
                <div className="flex justify-between py-0.5">
                  <span>Trabajadores</span>
                  <span className="font-medium text-stone-900 dark:text-white">
                    {formatCurrency(closing.workers_salary)}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Mensajero</span>
                  <span className="font-medium text-stone-900 dark:text-white">
                    {formatCurrency(closing.delivery_salary)}
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Otros</span>
                  <span className="font-medium text-stone-900 dark:text-white">
                    {formatCurrency(closing.other_expenses)}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. ENTREGADO A FRANK & BALANCES */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                <span className="text-[10px] uppercase font-bold text-stone-500 block mb-1">
                  ENTREGADO A FRANK
                </span>
                <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(closing.delivered_to_frank)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                <span className="text-[10px] uppercase font-bold text-stone-500 block mb-1">
                  BALANCE
                </span>
                <span
                  className={cn(
                    'text-base font-bold',
                    isBalancePositive ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600'
                  )}
                >
                  {formatCurrency(closing.balance)}
                </span>
              </div>

              <div
                className={cn(
                  'p-3.5 rounded-xl border',
                  isRemainingPositive
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900'
                    : 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900'
                )}
              >
                <span className="text-[10px] uppercase font-bold text-stone-500 block mb-1">
                  BALANCE RESTANTE
                </span>
                <span
                  className={cn(
                    'text-base font-bold',
                    isRemainingPositive ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600'
                  )}
                >
                  {formatCurrency(closing.remaining_balance)}
                </span>
              </div>
            </div>

            {/* Notes */}
            {closing.notes && (
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300">
                <span className="font-bold block text-stone-900 dark:text-white mb-1">Notas:</span>
                <p className="leading-relaxed">{closing.notes}</p>
              </div>
            )}
          </>
        )}

        {/* Actions bar in footer */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800 print:hidden">
          <div className="flex items-center gap-2">
            {!isReadMode && canEdit && onEdit && (
              <button
                onClick={() => onEdit(closing)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100"
              >
                <Edit className="w-3.5 h-3.5" /> Editar Cierre
              </button>
            )}
            {!isReadMode && canEdit && onDelete && (
              <button
                onClick={() => onDelete(closing)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60"
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </button>
            )}
            {isReadMode && (
              <span className="text-[11px] text-stone-400 italic">
                Modo lectura/impresión activo (controles de edición ocultos)
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl font-semibold"
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </Modal>
  );
};

