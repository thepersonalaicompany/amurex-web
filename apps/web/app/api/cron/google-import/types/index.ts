// Interface for client credentials stored in the map
export interface ClientCredentials {
  client_id: string;
  client_secret: string;
}

// Type for the validation result
export interface ValidationResult {
  valid: boolean;
  reason?: "insufficient_permissions" | "error";
  message?: string;
}

// Type for the clients map
export interface ClientsMap {
  [userId: string]: ClientCredentials | undefined;
}

export interface GoogleClient {
  id: string;
  client_id: string;
  client_secret: string;
}

export interface UserClientData {
  client_id: string;
  client_secret: string;
  refresh_token: string;
}

export interface ProcessResult {
  userId: string;
  success: boolean;
  error?: string;
  reason?: "insufficient_permissions" | "error";
  skipped?: boolean;
  documentsCount?: number;
}
