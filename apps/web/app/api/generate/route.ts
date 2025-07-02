import { OpenAIStream, StreamingTextResponse } from "ai";
import type { NextRequest } from "next/server";
import { ErrorResponse, GenerateRequest } from "./types";
import { openAIClient as openai } from "@amurex/web/lib";

// TODO?: Could not use edge runtime as it was causing issues with googleapis api which requires nodejs runtime
// had webpack errors
// export const runtime = "edge";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    // validate and extract prompt from request body
    const { prompt } = (await req.json()) as GenerateRequest;

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
        } satisfies ErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: [
            "You are an AI writing assistant that continues existing text based on context from prior text.",
            "Give more weight/priority to the later characters than the beginning ones.",
            "Limit your response to no more than 200 characters, but make sure to construct complete sentences.",
            "Do not generate empty responses.",
          ].join(" "),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: true,
      n: 1,
    });

    // handle stream with proper error checking
    const stream = OpenAIStream(response as any, {
      onCompletion: (completion: string) => {
        if (!completion.trim()) {
          throw new Error("Empty response generated");
        }
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    // handle errors with proper type checking
    console.error("Error in generate API:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";

    return new Response(
      JSON.stringify({ error: errorMessage } satisfies ErrorResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
