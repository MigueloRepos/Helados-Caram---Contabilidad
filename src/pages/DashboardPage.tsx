import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardStats, useExpensesChart, useFlavorStats } from '../hooks/useStats';
import { useClosings } from '../hooks/useClosings';
import { DashboardStatCards } from '../components/dashboard/StatCards';
import { SalesChart } from '../components/charts/SalesChart';
import { ExpensesChart } from '../components/charts/ExpensesChart';
import { FlavorsChart } from '../components/charts/FlavorsChart';
import { HistoryTable } from '../components/history/HistoryTable';
import { Plus, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { DailyClosing } from '../types';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
  onViewClosingDetail: (closing: DailyClosing) => void;
  onEditClosing: (closing: DailyClosing) => void;
  onDeleteClosing: (closing: DailyClosing) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onViewClosingDetail,
  onEditClosing,
  onDeleteClosing,
}) => {
  const { profile, isAdmin } = useAuth();
  const { data: stats, isLoading: isLoadingStats, refetch: refetchStats } = useDashboardStats();
  const { data: expensesData, isLoading: isLoadingExpenses } = useExpensesChart();
  const { data: flavorsData, isLoading: isLoadingFlavors } = useFlavorStats();
  const { closings, isLoading: isLoadingClosings } = useClosings();

  const recentClosings = closings.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-amber-600 via-amber-700 to-stone-900 text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold backdrop-blur-xs">
            <Sparkles className="w-3 h-3 text-amber-300" />
            Panel Ejecutivo 2026
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight">
            ¡Hola, {profile?.full_name?.split(' ')[0] || 'Administrador'}! 🍦
          </h1>
          <p className="text-xs text-amber-100/90 max-w-xl">
            Bienvenido al sistema contable de Helados Caram. Aquí tienes el resumen en tiempo real de ventas, vasos despachados, gastos operativos y balances de caja.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => refetchStats()}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Sincronizar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('/cierre-diario')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-stone-900 hover:bg-amber-50 text-xs font-bold shadow-md transition-all active:scale-98"
          >
            <Plus className="w-4 h-4 text-amber-600" />
            Registrar Cierre
          </button>
        </div>
      </div>

      {/* Main Metric Cards */}
      <DashboardStatCards stats={stats} isLoading={isLoadingStats} />

      {/* Sales Chart Section */}
      <SalesChart />

      {/* Grid: Expenses Breakdown & Top Flavors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpensesChart data={expensesData || []} isLoading={isLoadingExpenses} />
        <FlavorsChart data={flavorsData || []} isLoading={isLoadingFlavors} />
      </div>

      {/* Recent Closings Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-display text-stone-900 dark:text-white">
              Últimos Cierres Contables
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Registros recientes de caja diaria
            </p>
          </div>

          <button
            onClick={() => onNavigate('/historial')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-800 transition-colors"
          >
            <span>Ver todo el historial</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <HistoryTable
          closings={recentClosings}
          onViewDetail={onViewClosingDetail}
          onEdit={onEditClosing}
          onDelete={onDeleteClosing}
          canEdit={true}
          canDelete={isAdmin}
          onNewClosing={() => onNavigate('/cierre-diario')}
        />
      </div>
    </div>
  );
};
