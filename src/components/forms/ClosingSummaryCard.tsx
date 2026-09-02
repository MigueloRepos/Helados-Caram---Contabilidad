import React from 'react';
import { formatCurrency } from '../../lib/utils';
import { Calculator, DollarSign, Wallet, Scale, ArrowDownRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ClosingSummaryCardProps {
  totalSales: number;
  totalExpenses: number;
  deliveredToFrank: number;
}

export const ClosingSummaryCard: React.FC<ClosingSummaryCardProps> = ({
  totalSales,
  totalExpenses,
  deliveredToFrank,
}) => {
  const balance = Number(totalSales || 0) - Number(totalExpenses || 0);
  const remainingBalance = balance - Number(deliveredToFrank || 0);

  const isBalancePositive = balance >= 0;
  const isRemainingPositive = remainingBalance >= 0;

  return (
    <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 text-white rounded-2xl p-6 shadow-xl border border-stone-800 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-white">
              Resumen Financiero del Cierre
            </h3>
            <p className="text-xs text-stone-400">
              Cálculo contable automatizado en tiempo real
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Fórmulas Activas
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {/* Ventas */}
        <div className="p-3.5 rounded-xl bg-stone-800/60 border border-stone-700/60 space-y-1">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
            Ventas
          </span>
          <div className="text-lg lg:text-xl font-bold font-display text-emerald-400">
            {formatCurrency(totalSales)}
          </div>
          <span className="text-[10px] text-stone-400">Total ingresos</span>
        </div>

        {/* Gastos */}
        <div className="p-3.5 rounded-xl bg-stone-800/60 border border-stone-700/60 space-y-1">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
            Gastos
          </span>
          <div className="text-lg lg:text-xl font-bold font-display text-rose-400">
            {formatCurrency(totalExpenses)}
          </div>
          <span className="text-[10px] text-stone-400">Salarios + Envíos + Otros</span>
        </div>

        {/* Balance */}
        <div className="p-3.5 rounded-xl bg-stone-800/90 border border-amber-500/30 space-y-1">
          <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider block">
            Balance
          </span>
          <div
            className={cn(
              'text-lg lg:text-xl font-bold font-display',
              isBalancePositive ? 'text-amber-400' : 'text-rose-400'
            )}
          >
            {formatCurrency(balance)}
          </div>
          <span className="text-[10px] text-stone-400">Ventas − Gastos</span>
        </div>

        {/* Entregado a Frank */}
        <div className="p-3.5 rounded-xl bg-stone-800/60 border border-stone-700/60 space-y-1">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
            Entregado Frank
          </span>
          <div className="text-lg lg:text-xl font-bold font-display text-blue-400">
            {formatCurrency(deliveredToFrank)}
          </div>
          <span className="text-[10px] text-stone-400">Retiro de caja</span>
        </div>

        {/* Restante */}
        <div
          className={cn(
            'p-3.5 rounded-xl border col-span-2 sm:col-span-1 space-y-1',
            isRemainingPositive
              ? 'bg-emerald-950/40 border-emerald-500/40'
              : 'bg-rose-950/40 border-rose-500/40'
          )}
        >
          <span className="text-[11px] font-semibold text-stone-300 uppercase tracking-wider block">
            Restante en Caja
          </span>
          <div
            className={cn(
              'text-lg lg:text-xl font-bold font-display',
              isRemainingPositive ? 'text-emerald-300' : 'text-rose-300'
            )}
          >
            {formatCurrency(remainingBalance)}
          </div>
          <span className="text-[10px] text-stone-400">Balance − Frank</span>
        </div>
      </div>
    </div>
  );
};
