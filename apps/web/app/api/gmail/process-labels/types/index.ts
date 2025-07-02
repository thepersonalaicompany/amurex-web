export interface Message {
  id: string;
  threadId: string;
  labelIds?: string[];
}

export interface FullMessage {
  data: {
    id: string;
    threadId: string;
    labelIds: string[];
    snippet: string;
    internalDate: string;
    payload: {
      headers?: Array<{ name: string; value: string }>;
      body?: {
        data?: string;
      };
      parts?: Array<{
        mimeType: string;
        body?: {
          data?: string;
        };
        parts?: Array<{
          mimeType: string;
          body?: {
            data?: string;
          };
        }>;
      }>;
      mimeType?: string;
    };
  };
}

export interface LabelRequestBody {
  name: string;
  labelListVisibility: string;
  messageListVisibility: string;
  color?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

export interface GmailMessagePart {
  mimeType?: string;
  body?: {
    data?: string;
    size?: number;
  };
  parts?: GmailMessagePart[];
  headers?: Array<{
    name: string;
    value: string;
  }>;
}

export interface Email {
  id: string;
  labelIds?: string[];
  payload: {
    body?: {
      data?: string;
    };
    parts?: Array<{
      mimeType: string;
      body?: {
        data?: string;
      };
    }>;
    headers?: Array<{ name: string; value: string }>;
  };
  threadId: string;
}

export type ProcessResult =
  | {
      id: string;
      status: "skipped";
      reason: "already_exists" | "already_labeled";
    }
  | { id: string; status: "success" }
  | { id: string; status: "error"; error: string };

export interface ExistingEmail {
  message_id: string;
}

export interface EmailData {
  message_id: string;
  thread_id: string;
  user_id: string;
  label_id: string;
  label_name: string;
  label_color: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  content: string;
  content_length: number;
  processed_at: string;
}
