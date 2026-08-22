export interface UserProfileResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
  language: string;
  role: string;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserStatsResponse {
  total_trips: number;
  completed_trips: number;
  planned_trips: number;
  ongoing_trips: number;
  destinations_visited: number;
  total_expenses: number;
  saved_destinations: number;
  community_posts: number;
}
