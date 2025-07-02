import OpenAI from "openai";
import { groqClient as groq } from "@amurex/web/lib";

export const generateCompletion = async (
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  modelName: string,
): Promise<any> => {
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
    return {
      choices: [
        {
          message: {
            content: data.message.content,
          },
        },
      ],
    };
  } else {
    return await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messages,
    });
  }
};
