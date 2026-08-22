import { ExpenseCategory, SectionType } from '@prisma/client';

export interface ExpenseResponse {
  id: string;
  trip_id: string;
  trip_stop_id: string | null;
  trip_section_id: string | null;
  itinerary_item_id: string | null;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  expense_date: string;
  notes: string | null;
  stop?: {
    id: string;
    destination_name: string;
  } | null;
  section?: {
    id: string;
    title: string;
    section_type: SectionType;
  } | null;
  itinerary_item?: {
    id: string;
    title: string;
  } | null;
  created_at: Date;
  updated_at: Date;
}

export interface BudgetSummaryResponse {
  trip_id: string;
  total_budget: number | null;
  total_spent: number;
  remaining: number | null;
  currency: string;
  expense_count: number;
  average_per_day: number;
  trip_duration_days: number;
}

export interface CategoryBreakdownItem {
  category: ExpenseCategory;
  total: number;
  percentage: number;
  count: number;
}

export interface BudgetBreakdownResponse {
  trip_id: string;
  total_spent: number;
  currency: string;
  categories: CategoryBreakdownItem[];
}

export interface DailySpendingDay {
  date: string;
  total: number;
  count: number;
  expenses: ExpenseResponse[];
}

export interface DailySpendingResponse {
  trip_id: string;
  days: DailySpendingDay[];
}

export interface SectionBudgetComparison {
  section_id: string;
  title: string;
  section_type: SectionType;
  planned_budget: number | null;
  actual_spent: number;
  remaining: number | null;
  status: 'within_budget' | 'over_budget';
}

export interface SectionBudgetResponse {
  trip_id: string;
  sections: SectionBudgetComparison[];
}
