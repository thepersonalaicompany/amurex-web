import { Auth } from "googleapis";

// Define interfaces for database entities
export interface GoogleClient {
  id: number;
  client_id: string;
  client_secret: string;
  type: "gmail_only" | "full";
}

export interface OAuthClientResult {
  oauth2Client: Auth.OAuth2Client;
  clientInfo: GoogleClient;
}

export interface PostRequestBody {
  userId: string;
  source?: string;
  upgradeToFull?: boolean;
}
