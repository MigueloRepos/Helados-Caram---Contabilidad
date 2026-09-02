import React from 'react';
import { DashboardStats } from '../../types';
import { StatCard } from '../ui/StatCard';
import { formatCurrency, formatNumber } from '../../lib/utils';
import {
  DollarSign,
  Coffee,
  TrendingUp,
  Wallet,
  Scale,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

interface DashboardStatCardsProps {
  stats?: DashboardStats;
  isLoading?: boolean;
}

export const DashboardStatCards: React.FC<DashboardStatCardsProps> = ({
  stats,
  isLoading,
}) => {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 animate-pulse p-5"
          />
        ))}
      </div>
    );
  }

  const isTodayPositive = stats.today_balance >= 0;
  const isMonthPositive = stats.month_balance >= 0;

  return (
    <div className="space-y-6">
      {/* Sección Hoy */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
            Rendimiento de Hoy
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Vasos Vendidos Hoy"
            value={`${formatNumber(stats.today_cups)} vasos`}
            subtitle="Producción y despachos"
            icon={Coffee}
            variant="amber"
          />

          <StatCard
            title="Ventas de Hoy"
            value={formatCurrency(stats.today_sales)}
            subtitle="Ingresos brutos diarios"
            icon={DollarSign}
            variant="emerald"
          />

          <StatCard
            title="Gastos de Hoy"
            value={formatCurrency(stats.today_expenses)}
            subtitle="Salarios, envíos y otros"
            icon={TrendingUp}
            variant="rose"
          />

          <StatCard
            title="Balance del Día"
            value={formatCurrency(stats.today_balance)}
            subtitle="Ventas − Gastos"
            icon={Scale}
            variant={isTodayPositive ? 'emerald' : 'rose'}
            trend={{
              value: isTodayPositive ? 'Superávit' : 'Déficit',
              isPositive: isTodayPositive,
            }}
          />
        </div>
      </div>

      {/* Sección Entrega a Frank y Acumulado Mensual */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-xs font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
            Control de Caja y Acumulado del Mes
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Entregado a Frank Hoy"
            value={formatCurrency(stats.today_delivered_to_frank)}
            subtitle="Retiro de caja del día"
            icon={Wallet}
            variant="blue"
          />

          <StatCard
            title="Vasos Este Mes"
            value={`${formatNumber(stats.month_cups)} vasos`}
            subtitle="Acumulado mensual"
            icon={Coffee}
            variant="amber"
          />

          <StatCard
            title="Ventas del Mes"
            value={formatCurrency(stats.month_sales)}
            subtitle="Ingresos totales mes"
            icon={ArrowUpRight}
            variant="emerald"
          />

          <StatCard
            title="Gastos del Mes"
            value={formatCurrency(stats.month_expenses)}
            subtitle="Total egresos del mes"
            icon={TrendingUp}
            variant="purple"
          />
        </div>
      </div>
    </div>
  );
};
