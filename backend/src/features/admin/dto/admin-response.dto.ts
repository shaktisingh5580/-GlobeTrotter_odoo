import { Role, TripStatus, PostVisibility } from '@prisma/client';

export interface AdminStatsResponse {
  total_users: number;
  total_trips: number;
  total_destinations: number;
  total_activities: number;
  total_expenses_amount: number;
  active_shares_count: number;
  total_community_posts: number;
  total_audit_logs: number;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
  trips_count: number;
  posts_count: number;
  email_verified: boolean;
  created_at: Date;
}

export interface AdminTripListItem {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  budget_limit: number | null;
  currency: string;
  status: TripStatus;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  stops_count: number;
  created_at: Date;
}

export interface PopularDestinationItem {
  id: string;
  name: string;
  country: string;
  trip_stops_count: number;
  image_url: string | null;
}

export interface PopularActivityItem {
  id: string;
  name: string;
  category: string | null;
  destination_name: string;
  scheduled_count: number;
}

export interface AnalyticsTrendSummary {
  total_events: number;
  events_by_type: Array<{ event_type: string; count: number }>;
  recent_activity: Array<{
    id: string;
    event_type: string;
    entity_type: string | null;
    user_id: string | null;
    created_at: Date;
  }>;
}

export interface AuditLogItem {
  id: string;
  actor_user_id: string | null;
  actor_email?: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  ip_address: string | null;
  request_id: string | null;
  old_values: any;
  new_values: any;
  created_at: Date;
}
