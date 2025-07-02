// Environment Variables type validation

declare global {
  declare namespace NodeJS {
    export interface ProcessEnv {
      // Supabase
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      SUPABASE_SERVICE_ROLE_KEY: string;
      SUPABASE_ANON_KEY: string;
      SUPABASE_URL: string;

      // OpenAI
      OPENAI_API_KEY: string;

      // Base URL
      NEXT_PUBLIC_BASE_URL: string;
      NEXT_PUBLIC_APP_URL: string;

      // Notion
      NOTION_CLIENT_SECRET: string;
      NOTION_CLIENT_ID: string;
      NOTION_AUTH_URL: string;
      NOTION_REDIRECT_URI: string;

      // Brave Search
      BRAVE_SEARCH_API_KEY: string;

      // Google
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
      GOOGLE_REDIRECT_URI: string;
      GOOGLE_CALENDAR_REDIRECT_URI: string;

      // Embeddings
      MIXEDBREAD_API_KEY: string;
      MISTRAL_API_KEY: string;

      // Resend
      RESEND_API_KEY: string;
    }
  }
}
