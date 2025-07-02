export interface ClientCredentials {
  client_id: string;
  client_secret: string;
}

export interface ClientsMap {
  [userId: string]: ClientCredentials;
}

export interface ValidationResult {
  valid: boolean;
  reason?: "insufficient_permissions" | "error";
  message?: string;
}

export interface User {
  id: string;
  email_tagging_enabled: boolean;
  google_refresh_token: string;
  google_cohort: string | null;
  created_at: string;
}

export interface GoogleClient {
  id: string;
  client_id: string;
  client_secret: string;
}

export interface UserClientConfig {
  client_id: string;
  client_secret: string;
  refresh_token: string;
}

export type ProcessResult = {
  userId: string;
  success: boolean;
  processed?: number;
  total_stored?: number;
  message?: string;
  error?: string;
  reason?: string;
};
