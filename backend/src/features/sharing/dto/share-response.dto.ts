import { ShareVisibility, TripStatus, SectionType } from '@prisma/client';

export interface ShareTokenResponse {
  share_token: string;
  share_url: string;
  visibility: ShareVisibility;
  expires_at: Date | null;
  created_at: Date;
}

export interface SharedTripPublicResponse {
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: TripStatus;
  stops: Array<{
    destination: {
      name: string;
      country: string;
      image_url: string | null;
    };
    arrival_date: string;
    departure_date: string;
    notes: string | null;
    sections?: Array<{
      title: string;
      section_type: SectionType;
      start_date: string;
      end_date: string;
    }>;
  }>;
}

export interface CopyTripResponse {
  trip_id: string;
  message: string;
  copied_from: string;
}
