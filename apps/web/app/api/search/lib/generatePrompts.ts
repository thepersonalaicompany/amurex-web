import { ChatMessage, PromptResult } from "../types";
import { groqClient as groq } from "@amurex/web/lib";
// Add this new function near the other helper functions
export const generatePrompts = async (
  documents: any[],
): Promise<PromptResult> => {
  const modelName = process.env.MODEL_NAME as string;
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are a prompt generator. Keep the prompts super short and concise. Given document titles and content, generate 2 interesting questions and 1 email action. Make the prompts engaging and focused on extracting key insights from the documents. Return a JSON object with a 'prompts' array containing exactly 3 objects. Example format: { 'prompts': [{'type': 'prompt', 'text': 'What are the key findings...?'}, {'type': 'prompt', 'text': 'How does this compare...?'}, {'type': 'email', 'text': 'Draft an email to summarize...'}] }",
    },
    {
      role: "user",
      content: `Generate 3 prompts based on these documents: ${JSON.stringify(documents)}`,
    },
  ];

  if (modelName === "llama3.3") {
    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.3-70b",
        messages: messages,
        stream: false,
      }),
    });

    const data = (await response.json()) as { message: { content: string } };
    return JSON.parse(data.message.content);
  } else {
    const gptResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messages,
      response_format: { type: "json_object" },
    });
    return JSON.parse(gptResponse.choices[0]?.message?.content ?? "{}");
  }
};
