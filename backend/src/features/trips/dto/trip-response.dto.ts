import { TripStatus } from '@prisma/client';

export interface TripSummaryResponse {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  budget_limit: number | null;
  currency: string;
  cover_url: string | null;
  status: TripStatus;
  stops_count: number;
  total_expenses: number;
  created_at: Date;
}

export interface TripDetailResponse extends TripSummaryResponse {
  stops: any[];
  updated_at: Date;
}

export interface TripFullResponse {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  budget_limit: number | null;
  currency: string;
  cover_url: string | null;
  status: TripStatus;
  stops: any[];
  sections: any[];
  budget_summary: {
    total_budget: number;
    total_spent: number;
    remaining: number;
  };
  created_at: Date;
  updated_at: Date;
}
