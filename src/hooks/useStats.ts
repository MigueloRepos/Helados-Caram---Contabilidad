import { useQuery } from '@tanstack/react-query';
import { statisticsService } from '../services/statistics.service';
import { closingService } from '../services/closing.service';
import { HistoryFilterParams } from '../types';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: () => statisticsService.getDashboardStats(),
  });
}

export function useExpensesChart(filters?: HistoryFilterParams) {
  return useQuery({
    queryKey: ['expenses_chart', filters],
    queryFn: async () => {
      const closings = await closingService.getDailyClosings(filters);
      return statisticsService.getExpensesBreakdown(closings);
    },
  });
}

export function useFlavorStats(filters?: HistoryFilterParams) {
  return useQuery({
    queryKey: ['flavor_stats', filters],
    queryFn: async () => {
      const closings = await closingService.getDailyClosings(filters);
      return statisticsService.getFlavorSalesStats(closings);
    },
  });
}

export function useStats() {
  const dashboardQuery = useDashboardStats();

  return {
    dashboardStats: dashboardQuery.data,
    isLoading: dashboardQuery.isLoading,
    refetch: dashboardQuery.refetch,
  };
}

export function useSalesChart(grouping: 'day' | 'month' | 'year' = 'day') {
  return useQuery({
    queryKey: ['sales_chart', grouping],
    queryFn: () => statisticsService.getSalesChartData(grouping),
  });
}

export function useDetailedStats(filters?: HistoryFilterParams) {
  const closingsQuery = useQuery({
    queryKey: ['stats_closings', filters],
    queryFn: () => closingService.getDailyClosings(filters),
  });

  const closings = closingsQuery.data || [];

  const expensesBreakdown = useQuery({
    queryKey: ['expenses_breakdown', closings],
    queryFn: () => statisticsService.getExpensesBreakdown(closings),
    enabled: !closingsQuery.isLoading,
  });

  const flavorStats = useQuery({
    queryKey: ['flavor_stats', closings],
    queryFn: () => statisticsService.getFlavorSalesStats(closings),
    enabled: !closingsQuery.isLoading,
  });

  const totalCups = closings.reduce((sum, c) => sum + Number(c.total_cups || 0), 0);
  const totalSales = closings.reduce((sum, c) => sum + Number(c.total_sales || 0), 0);
  const totalExpenses = closings.reduce((sum, c) => sum + Number(c.total_expenses || 0), 0);
  const totalWorkers = closings.reduce((sum, c) => sum + Number(c.workers_salary || 0), 0);
  const totalDelivery = closings.reduce((sum, c) => sum + Number(c.delivery_salary || 0), 0);
  const totalOther = closings.reduce((sum, c) => sum + Number(c.other_expenses || 0), 0);
  const totalDeliveredToFrank = closings.reduce((sum, c) => sum + Number(c.delivered_to_frank || 0), 0);
  const totalBalance = totalSales - totalExpenses;
  const totalRemaining = totalBalance - totalDeliveredToFrank;

  return {
    closings,
    isLoading: closingsQuery.isLoading,
    summary: {
      totalCups,
      totalSales,
      totalExpenses,
      totalWorkers,
      totalDelivery,
      totalOther,
      totalDeliveredToFrank,
      totalBalance,
      totalRemaining,
      averageDailySales: closings.length > 0 ? totalSales / closings.length : 0,
      averageCupsPerDay: closings.length > 0 ? Math.round(totalCups / closings.length) : 0,
    },
    expensesBreakdown: expensesBreakdown.data || [],
    flavorStats: flavorStats.data || [],
    refetch: closingsQuery.refetch,
  };
}
