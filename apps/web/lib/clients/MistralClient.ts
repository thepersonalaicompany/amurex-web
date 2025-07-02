import OpenAI from "openai";

if (!process.env.MISTRAL_API_KEY) throw new Error("Missing MISTRAL_API_KEY");

// Initialize Mistral Client using OpenAI SDK
export const mistralClient = new OpenAI({
  apiKey: process.env.MISTRAL_API_KEY!,
  baseURL: "https://api.mistral.ai/v1",
});
