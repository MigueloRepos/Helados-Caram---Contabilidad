import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { ExpensesChartDataPoint } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { DollarSign, Wallet } from 'lucide-react';

interface ExpensesChartProps {
  data: ExpensesChartDataPoint[];
  isLoading?: boolean;
}

export const ExpensesChart: React.FC<ExpensesChartProps> = ({ data, isLoading }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h3 className="text-base font-bold font-display text-stone-900 dark:text-white">
            Desglose de Gastos
          </h3>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Distribución de salarios, mensajería y gastos operativos
        </p>
      </div>

      <div className="my-4 h-56 relative flex items-center justify-center">
        {isLoading ? (
          <div className="w-8 h-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
        ) : total === 0 ? (
          <div className="text-stone-400 text-xs text-center">
            No hay gastos registrados en este periodo.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={2} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Monto']}
                contentStyle={{
                  backgroundColor: '#1c1917',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Breakdown list */}
      <div className="space-y-2 pt-3 border-t border-stone-100 dark:border-stone-800">
        {data.map((item) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
          return (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-stone-600 dark:text-stone-300 font-medium">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-900 dark:text-white">
                  {formatCurrency(item.value)}
                </span>
                <span className="text-stone-400 text-[11px] w-10 text-right font-mono">
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
