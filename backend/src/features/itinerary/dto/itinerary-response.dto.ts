import { ActivityCategory, SectionType } from '@prisma/client';

export interface ItineraryItemResponse {
  id: string;
  trip_stop_id: string;
  trip_section_id: string | null;
  activity_id: string | null;
  item_date: string;
  start_time: string | null;
  end_time: string | null;
  item_order: number;
  custom_title: string | null;
  custom_description: string | null;
  notes: string | null;
  activity?: {
    id: string;
    name: string;
    description: string | null;
    category: ActivityCategory | null;
    estimated_cost: number | null;
    currency: string;
    duration_minutes: number | null;
    rating: number | null;
  } | null;
  section?: {
    id: string;
    title: string;
    section_type: SectionType;
  } | null;
  expenses?: Array<{
    id: string;
    title: string;
    amount: number;
    currency: string;
    category: string;
  }>;
  created_at: Date;
  updated_at: Date;
}

export interface ItineraryDayResponse {
  date: string;
  stop: {
    id: string;
    destination_id: string;
    destination_name: string;
    country: string;
  } | null;
  items: ItineraryItemResponse[];
}

export interface TripItineraryResponse {
  trip_id: string;
  days: ItineraryDayResponse[];
}

export interface CalendarDaySummary {
  date: string;
  stop: string | null;
  items_count: number;
  total_expense: number;
}

export interface ItineraryCalendarResponse {
  trip_id: string;
  start_date: string;
  end_date: string;
  calendar: CalendarDaySummary[];
}

export interface TimelineEntry {
  id: string;
  item_date: string;
  start_time: string | null;
  end_time: string | null;
  title: string;
  description: string | null;
  category: string | null;
  duration_minutes: number | null;
  stop_name: string | null;
  section_title: string | null;
  estimated_cost: number | null;
  currency: string | null;
}

export interface ItineraryTimelineResponse {
  trip_id: string;
  timeline: TimelineEntry[];
}
