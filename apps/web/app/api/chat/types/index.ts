export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface Transcript {
  summary?: string;
  fullTranscript?: string;
}

export interface ChatRequest {
  messages: Message[];
  transcript: Transcript;
}

export interface ErrorResponse {
  success: false;
  error: string;
}
