// ============================================================================
// HELADOS CARAM — TIPOS TYPESCRIPT
// ============================================================================

export type UserRole = 'admin' | 'frank';

export type ClosingPresentationType = 'cups' | 'tubs_4_5l';

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
  email?: string;
}

export interface Flavor {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyClosingFlavor {
  id?: string;
  closing_id?: string;
  flavor_id: string;
  quantity: number;
  created_at?: string;
  flavor?: Flavor;
  // helper for local UI state
  flavor_name?: string;
}

export interface DailyClosing {
  id: string;
  user_id: string;
  closing_date: string; // YYYY-MM-DD
  total_cups: number;
  total_sales: number;
  workers_salary: number;
  delivery_salary: number;
  other_expenses: number;
  total_expenses: number;
  delivered_to_frank: number;
  balance: number;
  remaining_balance: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  presentation_type?: ClosingPresentationType;
  unit_price?: number;
  profile?: UserProfile;
  flavors?: DailyClosingFlavor[];
}

export interface DailyClosingFormData {
  closing_date: string;
  presentation_type?: ClosingPresentationType;
  unit_price?: number;
  responsable_name?: string;
  notes?: string;
  total_cups: number;
  total_sales: number;
  workers_salary: number;
  delivery_salary: number;
  other_expenses: number;
  delivered_to_frank: number;
  flavors: {
    flavor_id: string;
    quantity: number;
  }[];
}

export interface DashboardStats {
  today_cups: number;
  today_sales: number;
  today_expenses: number;
  today_delivered_to_frank: number;
  today_balance: number;
  month_cups: number;
  month_sales: number;
  month_expenses: number;
  month_balance: number;
  month_delivered_to_frank: number;
}

export interface SalesChartDataPoint {
  label: string;
  date: string;
  ventas: number;
  gastos: number;
  balance: number;
  vasos: number;
}

export interface ExpensesChartDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface FlavorSalesDataPoint {
  name: string;
  cups: number;
  percentage: number;
}

export interface HistoryFilterParams {
  startDate?: string;
  endDate?: string;
  day?: string;
  month?: string;
  year?: string;
  responsable?: string;
  searchTerm?: string;
  presentationType?: ClosingPresentationType | 'all';
  sortBy?: 'recent' | 'oldest' | 'highest_sales' | 'highest_expenses' | 'highest_cups';
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN';
  table_name: string;
  record_id?: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  created_at: string;
  user_email?: string;
}
