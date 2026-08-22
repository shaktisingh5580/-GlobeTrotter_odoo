import { ActivityCategory } from '@prisma/client';

export interface ActivityResponse {
  id: string;
  destination_id: string;
  name: string;
  description: string | null;
  category: ActivityCategory | null;
  estimated_cost: number | null;
  currency: string;
  duration_minutes: number | null;
  image_url: string | null;
  rating: number | null;
  created_at: Date;
}

export interface DestinationSummaryResponse {
  id: string;
  name: string;
  country: string;
  country_code: string | null;
  region: string | null;
  description: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  cost_index: number | null;
  popularity_score: number;
  activities_count: number;
  is_saved?: boolean;
  created_at: Date;
}

export interface DestinationDetailResponse extends DestinationSummaryResponse {
  activities: ActivityResponse[];
  updated_at: Date;
}

export interface SavedDestinationResponse {
  id: string;
  user_id: string;
  destination_id: string;
  notes: string | null;
  saved_at: Date;
  destination: DestinationSummaryResponse;
}
