// Type definitions
export interface Source {
  source: string;
  title: string;
  content: string;
  url?: string;
  type?: string;
}

export interface Prompt {
  type: "prompt" | "email";
  text: string;
}

export interface PromptResult {
  prompts: Prompt[];
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
