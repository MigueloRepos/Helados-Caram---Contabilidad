import { closingService } from './closing.service';
import { DashboardStats, SalesChartDataPoint, ExpensesChartDataPoint, FlavorSalesDataPoint } from '../types';

export const statisticsService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentMonthPrefix = todayStr.substring(0, 7); // 'YYYY-MM'

    const allClosings = await closingService.getDailyClosings();

    const todayClosing = allClosings.find(c => c.closing_date === todayStr);
    const monthClosings = allClosings.filter(c => c.closing_date.startsWith(currentMonthPrefix));

    const month_cups = monthClosings.reduce((sum, c) => sum + Number(c.total_cups || 0), 0);
    const month_sales = monthClosings.reduce((sum, c) => sum + Number(c.total_sales || 0), 0);
    const month_expenses = monthClosings.reduce((sum, c) => sum + Number(c.total_expenses || 0), 0);
    const month_delivered_to_frank = monthClosings.reduce((sum, c) => sum + Number(c.delivered_to_frank || 0), 0);
    const month_balance = month_sales - month_expenses;

    return {
      today_cups: todayClosing ? Number(todayClosing.total_cups) : 0,
      today_sales: todayClosing ? Number(todayClosing.total_sales) : 0,
      today_expenses: todayClosing ? Number(todayClosing.total_expenses) : 0,
      today_delivered_to_frank: todayClosing ? Number(todayClosing.delivered_to_frank) : 0,
      today_balance: todayClosing ? Number(todayClosing.balance) : 0,
      month_cups,
      month_sales,
      month_expenses,
      month_balance,
      month_delivered_to_frank,
    };
  },

  async getSalesChartData(grouping: 'day' | 'month' | 'year' = 'day'): Promise<SalesChartDataPoint[]> {
    const allClosings = await closingService.getDailyClosings({ sortBy: 'oldest' });

    if (grouping === 'day') {
      // Last 14-30 days
      const slice = allClosings.slice(-14);
      return slice.map(c => {
        const [y, m, d] = c.closing_date.split('-');
        return {
          label: `${d}/${m}`,
          date: c.closing_date,
          ventas: Number(c.total_sales),
          gastos: Number(c.total_expenses),
          balance: Number(c.balance),
          vasos: Number(c.total_cups),
        };
      });
    }

    if (grouping === 'month') {
      // Group by YYYY-MM
      const monthlyMap = new Map<string, { ventas: number; gastos: number; balance: number; vasos: number }>();
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

      allClosings.forEach(c => {
        const monthKey = c.closing_date.substring(0, 7);
        const current = monthlyMap.get(monthKey) || { ventas: 0, gastos: 0, balance: 0, vasos: 0 };
        monthlyMap.set(monthKey, {
          ventas: current.ventas + Number(c.total_sales),
          gastos: current.gastos + Number(c.total_expenses),
          balance: current.balance + Number(c.balance),
          vasos: current.vasos + Number(c.total_cups),
        });
      });

      return Array.from(monthlyMap.entries()).map(([key, data]) => {
        const [, m] = key.split('-');
        const monthLabel = monthNames[parseInt(m) - 1] || key;
        return {
          label: monthLabel,
          date: key,
          ...data,
        };
      });
    }

    if (grouping === 'year') {
      // Group by YYYY
      const yearlyMap = new Map<string, { ventas: number; gastos: number; balance: number; vasos: number }>();
      allClosings.forEach(c => {
        const yearKey = c.closing_date.substring(0, 4);
        const current = yearlyMap.get(yearKey) || { ventas: 0, gastos: 0, balance: 0, vasos: 0 };
        yearlyMap.set(yearKey, {
          ventas: current.ventas + Number(c.total_sales),
          gastos: current.gastos + Number(c.total_expenses),
          balance: current.balance + Number(c.balance),
          vasos: current.vasos + Number(c.total_cups),
        });
      });

      return Array.from(yearlyMap.entries()).map(([year, data]) => ({
        label: year,
        date: year,
        ...data,
      }));
    }

    return [];
  },

  async getExpensesBreakdown(closingsList?: typeof closingService.getDailyClosings extends () => Promise<infer T> ? T : never): Promise<ExpensesChartDataPoint[]> {
    const closings = closingsList || await closingService.getDailyClosings();

    const workersTotal = closings.reduce((sum, c) => sum + Number(c.workers_salary || 0), 0);
    const deliveryTotal = closings.reduce((sum, c) => sum + Number(c.delivery_salary || 0), 0);
    const otherTotal = closings.reduce((sum, c) => sum + Number(c.other_expenses || 0), 0);

    return [
      { name: 'Salarios Trabajadores', value: workersTotal, color: '#f59e0b' },
      { name: 'Salario Mensajero', value: deliveryTotal, color: '#3b82f6' },
      { name: 'Otros Gastos', value: otherTotal, color: '#ec4899' },
    ];
  },

  async getFlavorSalesStats(closingsList?: typeof closingService.getDailyClosings extends () => Promise<infer T> ? T : never): Promise<FlavorSalesDataPoint[]> {
    const closings = closingsList || await closingService.getDailyClosings();

    const flavorCounts = new Map<string, number>();
    let totalCups = 0;

    closings.forEach(c => {
      if (c.flavors) {
        c.flavors.forEach(f => {
          const name = f.flavor?.name || f.flavor_name || 'Sabor no especificado';
          const qty = Number(f.quantity || 0);
          flavorCounts.set(name, (flavorCounts.get(name) || 0) + qty);
          totalCups += qty;
        });
      }
    });

    if (totalCups === 0) {
      return [];
    }

    const result: FlavorSalesDataPoint[] = Array.from(flavorCounts.entries())
      .map(([name, cups]) => ({
        name,
        cups,
        percentage: totalCups > 0 ? Number(((cups / totalCups) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.cups - a.cups);

    return result;
  },
};
