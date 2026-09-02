import React, { useState } from 'react';
import { useDashboardStats, useExpensesChart, useFlavorStats } from '../hooks/useStats';
import { useClosings } from '../hooks/useClosings';
import { SalesChart } from '../components/charts/SalesChart';
import { ExpensesChart } from '../components/charts/ExpensesChart';
import { FlavorsChart } from '../components/charts/FlavorsChart';
import { formatCurrency, formatNumber } from '../lib/utils';
import {
  BarChart3,
  TrendingUp,
  Percent,
  Wallet,
  Coffee,
  DollarSign,
  PieChart,
  Calendar,
} from 'lucide-react';

export const StatisticsPage: React.FC = () => {
  const { data: stats, isLoading: isLoadingStats } = useDashboardStats();
  const { data: expensesData, isLoading: isLoadingExpenses } = useExpensesChart();
  const { data: flavorsData, isLoading: isLoadingFlavors } = useFlavorStats();
  const { closings } = useClosings();

  // Advanced KPIs calculation
  const totalDaysWithSales = closings.length;
  const totalSalesAll = closings.reduce((sum, c) => sum + Number(c.total_sales || 0), 0);
  const totalExpensesAll = closings.reduce((sum, c) => sum + Number(c.total_expenses || 0), 0);
  const totalCupsAll = closings.reduce((sum, c) => sum + Number(c.total_cups || 0), 0);
  const totalFrankAll = closings.reduce((sum, c) => sum + Number(c.delivered_to_frank || 0), 0);

  const avgSalesPerDay = totalDaysWithSales > 0 ? totalSalesAll / totalDaysWithSales : 0;
  const avgCupsPerDay = totalDaysWithSales > 0 ? Math.round(totalCupsAll / totalDaysWithSales) : 0;
  const expenseRatio = totalSalesAll > 0 ? ((totalExpensesAll / totalSalesAll) * 100).toFixed(1) : '0';
  const profitMargin = totalSalesAll > 0 ? (((totalSalesAll - totalExpensesAll) / totalSalesAll) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <h2 className="text-xl font-bold font-display text-stone-900 dark:text-white">
            Estadísticas & Análisis Financiero
          </h2>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Métricas clave de rentabilidad, promedios diarios y rendimiento por sabores
        </p>
      </div>

      {/* Advanced KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Promedio Ventas/Día */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Promedio Ventas / Día
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-display text-stone-900 dark:text-white">
            {formatCurrency(avgSalesPerDay)}
          </div>
          <p className="text-[11px] text-stone-400">
            Calculado sobre {totalDaysWithSales} días registrados
          </p>
        </div>

        {/* Promedio Vasos/Día */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Promedio Vasos / Día
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Coffee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-display text-stone-900 dark:text-white">
            {formatNumber(avgCupsPerDay)} vasos
          </div>
          <p className="text-[11px] text-stone-400">
            Ritmo de despacho diario
          </p>
        </div>

        {/* Ratio de Gastos */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Ratio de Gastos / Ventas
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-display text-rose-600 dark:text-rose-400">
            {expenseRatio}%
          </div>
          <p className="text-[11px] text-stone-400">
            Porcentaje de ingresos destinado a gastos
          </p>
        </div>

        {/* Margen Operativo Neto */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Margen de Ganancia
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-display text-purple-700 dark:text-purple-300">
            {profitMargin}%
          </div>
          <p className="text-[11px] text-stone-400">
            Margen neto promedio histórico
          </p>
        </div>
      </div>

      {/* Main Trends Visualizations */}
      <SalesChart />

      {/* Grid: Expenses vs Flavors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpensesChart data={expensesData || []} isLoading={isLoadingExpenses} />
        <FlavorsChart data={flavorsData || []} isLoading={isLoadingFlavors} />
      </div>
    </div>
  );
};
