export interface EmailCategoryPreferences {
  to_respond: boolean;
  fyi: boolean;
  comment: boolean;
  notification: boolean;
  meeting_update: boolean;
  awaiting_reply: boolean;
  actioned: boolean;
}

export interface EmailPreferences {
  categories: EmailCategoryPreferences;
  custom_properties: Record<string, boolean>;
}

export interface PostRequestBody {
  userId: string;
  categories: EmailPreferences;
}

export interface UserRow {
  email_categories: EmailPreferences | null;
}
