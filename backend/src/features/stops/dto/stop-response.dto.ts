export interface DestinationSummary {
  id: string;
  name: string;
  country: string;
  country_code: string;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface StopResponse {
  id: string;
  trip_id: string;
  destination_id: string;
  stop_order: number;
  arrival_date: string;
  departure_date: string;
  notes: string | null;
  destination: DestinationSummary;
  created_at: Date;
  updated_at: Date;
}
