import { SectionType } from '@prisma/client';

export interface LinkedStopSummary {
  id: string;
  destination_name: string;
  arrival_date: string;
  departure_date: string;
}

export interface SectionResponse {
  id: string;
  trip_id: string;
  trip_stop_id: string | null;
  title: string;
  description: string | null;
  section_type: SectionType;
  start_date: string;
  end_date: string;
  planned_budget: number | null;
  actual_spent: number;
  currency: string;
  section_order: number;
  linked_stop: LinkedStopSummary | null;
  created_at: Date;
  updated_at: Date;
}
