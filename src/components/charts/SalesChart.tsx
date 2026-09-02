import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { useSalesChart } from '../../hooks/useStats';
import { formatCurrency, formatNumber } from '../../lib/utils';
import { BarChart3, TrendingUp, Filter } from 'lucide-react';
import { cn } from '../../lib/utils';

export const SalesChart: React.FC = () => {
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('day');
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const { data, isLoading } = useSalesChart(period);

  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'Vasos') {
      return [`${formatNumber(value)} u.`, name];
    }
    return [formatCurrency(value), name];
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-xs">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-base font-bold font-display text-stone-900 dark:text-white">
              Gráfico de Ventas y Balance
            </h3>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Comparativa de ingresos brutos, gastos y balance neto
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
            <button
              onClick={() => setPeriod('day')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                period === 'day'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              )}
            >
              Día
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                period === 'month'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              )}
            >
              Mes
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                period === 'year'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              )}
            >
              Año
            </button>
          </div>

          {/* Toggle Type */}
          <button
            onClick={() => setChartType(prev => (prev === 'bar' ? 'area' : 'bar'))}
            className="p-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs flex items-center gap-1"
            title="Cambiar vista"
          >
            <TrendingUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-400 text-xs">
            <span>No hay suficientes datos registrados para este periodo.</span>
          </div>
        ) : chartType === 'bar' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} vertical={false} />
              <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} />
              <YAxis stroke="#888888" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={formatTooltipValue}
                contentStyle={{
                  backgroundColor: '#1c1917',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="ventas" name="Ventas" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
              <Bar dataKey="gastos" name="Gastos" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={40} />
              <Bar dataKey="balance" name="Balance" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} vertical={false} />
              <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} />
              <YAxis stroke="#888888" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={formatTooltipValue}
                contentStyle={{
                  backgroundColor: '#1c1917',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="ventas" name="Ventas" stroke="#10b981" fillOpacity={1} fill="url(#colorVentas)" strokeWidth={2} />
              <Area type="monotone" dataKey="balance" name="Balance" stroke="#f59e0b" fillOpacity={1} fill="url(#colorBalance)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
