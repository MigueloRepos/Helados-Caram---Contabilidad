import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { FlavorSalesDataPoint } from '../../types';
import { formatNumber } from '../../lib/utils';
import { IceCream, Trophy } from 'lucide-react';

interface FlavorsChartProps {
  data: FlavorSalesDataPoint[];
  isLoading?: boolean;
}

const FLAVOR_COLORS = [
  '#d97706', // amber-600
  '#b45309', // amber-700
  '#f59e0b', // amber-500
  '#fbbf24', // amber-400
  '#fde68a', // amber-200
  '#a855f7', // purple-500
  '#ec4899', // pink-500
  '#3b82f6', // blue-500
];

export const FlavorsChart: React.FC<FlavorsChartProps> = ({ data, isLoading }) => {
  const topFlavors = data.slice(0, 7);

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IceCream className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-base font-bold font-display text-stone-900 dark:text-white">
              Ventas por Sabor
            </h3>
          </div>
          <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900">
            Top Sabores
          </span>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Sabores con mayor volumen de vasos vendidos
        </p>
      </div>

      {isLoading ? (
        <div className="h-56 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
        </div>
      ) : topFlavors.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-stone-400 text-xs text-center">
          No hay registros de sabores vendidos en este periodo.
        </div>
      ) : (
        <div className="my-4 space-y-3">
          {topFlavors.map((flavor, index) => (
            <div key={flavor.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center font-bold text-[10px]">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    {flavor.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900 dark:text-white">
                    {formatNumber(flavor.cups)} <span className="text-[10px] font-normal text-stone-400">vasos</span>
                  </span>
                  <span className="text-amber-700 dark:text-amber-400 text-[11px] font-mono w-10 text-right font-medium">
                    {flavor.percentage}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                  style={{ width: `${flavor.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-[11px] text-stone-400 text-right pt-2 border-t border-stone-100 dark:border-stone-800">
        Total de sabores en catálogo con rotación activa
      </div>
    </div>
  );
};
