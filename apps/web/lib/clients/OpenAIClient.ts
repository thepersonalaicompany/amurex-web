import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");

// Create a typed OpenAI client
export const openAIClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
