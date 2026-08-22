export interface SafeUser {
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
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthResponse {
  user: SafeUser;
  access_token: string;
  refresh_token: string;
}
