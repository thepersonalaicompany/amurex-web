import OpenAI from "openai";

if (!process.env.GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY");

// Initialize Groq Client using OpenAI SDK
export const groqClient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: "https://api.groq.com/openai/v1",
});
