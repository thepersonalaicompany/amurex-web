interface NotionOAuthSuccess {
  access_token: string;
  workspace_id: string;
  bot_id: string;
  owner?: {
    user: {
      id: string;
    };
  };
}

interface NotionOAuthError {
  error: string;
  error_description?: string;
}

export type NotionOAuthResponse = NotionOAuthSuccess | NotionOAuthError;
