// 1. Import Dependencies
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { BraveSearch } from "@langchain/community/tools/brave_search";
import OpenAI from "openai";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";
// 2. Initialize admin Supabase client with service role key
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Use OpenAI client for Groq
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// 3. Send payload to Supabase table
async function sendPayload(content, user_id) {
  await adminSupabase
    .from("message_history")
    .insert([
      {
        payload: content,
        user_id: user_id,
      },
    ])
    .select("id");
}

// Function to check which model to use and make the appropriate API call
async function generateCompletion(messages, modelName) {
  // Check if we should use Ollama
  if (modelName === "llama3.3") {
    // Use Ollama API
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

    const data = await response.json();
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
    // Use Groq
    return await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messages,
    });
  }
}

// Add this new function near the other helper functions
async function generatePrompts(documents) {
  const modelName = process.env.MODEL_NAME;
  const messages = [
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
    // Use Ollama API
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

    const data = await response.json();
    return JSON.parse(data.message.content);
  } else {
    // Use Groq
    const gptResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messages,
      response_format: { type: "json_object" },
    });
    return JSON.parse(gptResponse.choices[0].message.content);
  }
}

export async function POST(req) {
  const startTime = performance.now();
  console.log("POST request started at:", new Date().toISOString());

  const body = await req.json();
  console.log(`[${performance.now() - startTime}ms] Request parsed`);

  // Handle prompts generation
  if (body.type === "prompts") {
    try {
      const promptsStartTime = performance.now();
      const prompts = await generatePrompts(body.documents);
      console.log(
        `[${performance.now() - promptsStartTime}ms] Prompts generated`
      );
      // hardcoded prompts
      // return Response.json({ prompts: [
      //   { type: 'prompt', text: 'What is the most important thing I need to do today?' },
      //   { type: 'prompt', text: 'What was my last purchase?' },
      //   { type: 'email', text: 'Draft an email to person X about...' }
      // ] });
      return Response.json({ apiPrompts: prompts });
    } catch (error) {
      console.error("Error generating prompts:", error);
      return Response.json(
        { error: "Failed to generate prompts" },
        { status: 500 }
      );
    }
  }

  // Original chat functionality continues here...
  const { message, context, user_id } = body;

  if (!user_id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Make the API request to search_new
    const searchStartTime = performance.now();
    console.log("Starting search at:", new Date().toISOString());

    // Call search_new endpoint directly
    const response = await fetch("https://brain.amurex.ai/search_unified", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.BRAIN_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: user_id,
        query: [...context, { role: "user", content: message }], // messages, without sources, without system prompt
        ai_enabled: false,
        max_results_per_source: 3,
      }),
    });

    if (!response.ok) {
      throw new Error(`Search failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[${performance.now() - searchStartTime}ms] Search completed`);

    // Get the results directly from the API response
    const sources = data.results || [];
    console.log("sources", sources);

    // Create streaming response
    const streamSetupStartTime = performance.now();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();
    console.log(
      `[${performance.now() - streamSetupStartTime}ms] Stream setup completed`
    );

    // Process the stream
    (async () => {
      try {
        let fullResponse = ""; // Track complete response

        // Send sources first
        const sourcesWriteStartTime = performance.now();
        const sourcesPayload = JSON.stringify({
          success: true,
          sources: sources,
          chunk: "",
        });
        await writer.write(encoder.encode(sourcesPayload + "\n"));
        console.log(
          `[${performance.now() - sourcesWriteStartTime}ms] Sources written to stream`
        );

        // Clean up sources to remove excessive newlines
        const cleanedSources = sources.map((source) => {
          if (source.content) {
            return {
              source: source.source,
              title: source.title,
              content: source.content
                .replace(/[\r\n\x0B\x0C\u2028\u2029]{3,}/g, "\n\n") // Replace 3+ consecutive newlines with double newline
                .replace(/[\r\n\x0B\x0C\u2028\u2029]{2}/g, "\n\n") // Normalize double newlines
                .replace(/[\r\n\x0B\x0C\u2028\u2029]/g, "\n") // Normalize single newlines
                .replace(/\s+\n/g, "\n") // Remove spaces before newlines
                .replace(/\n\s+/g, "\n") // Remove spaces after newlines
                .trim(), // Remove leading/trailing whitespace
              url: source.url,
              type: source.type,
            };
          }
          return {
            source: source.source,
            title: source.title,
            content: source.content,
            url: source.url,
            type: source.type,
          };
        });

        // Check if we have an AI response from the API
        const aiResponse = data.ai_response;

        if (
          aiResponse &&
          typeof aiResponse === "string" &&
          aiResponse.trim().length > 0
        ) {
          // Use the AI response from the API
          console.log("Using AI response from API");
          fullResponse = aiResponse;

          // Stream the AI response to the client
          const payload = JSON.stringify({
            success: true,
            chunk: aiResponse,
          });
          await writer.write(encoder.encode(payload + "\n"));
        } else {
          // Use Groq for streaming if no AI response
          console.log("No AI response from API, using Groq");

          const groqStartTime = performance.now();
          const groqStream = await groq.chat.completions.create({
            messages: [
              {
                role: "system",
                content: `You are Amurex, a helpful AI productivity assistant. Use the provided document chunks to answer the user's query. If the chunks don't contain relevant information, generate a confident and plausible answer anyway — do not say "I'm not sure" or "I couldnt find anything" Be helpful, contextual, and confident.

                    Behavior Guidelines:

                    1. When Documents Are Found:
                    - Use the documents to answer the user's query.
                    - Start answering the user's query with the documents straight away.
                    - Example: "When is my next meeting with Mike?" - "Your next meeting with Mike is on Tuesday at 10am."

                    2. When No Documents Are Found:
                    - Confidently make up a helpful (but very short!) answer if needed.
                    - You can mention you're improvising if appropriate, but do so smoothly.

                    3. When Asked "Who are you?" or "What can you do?":
                    - Don't say that you were not able to find anything in the documents. Just introduce yourself as Amurex and describe your core features:
                      - AI meeting assistant (live insights, summaries, transcripts)
                      - Smart search across tools like Notion, Google Drive, and more
                      - Inbox organizer and email prioritizer
                    - Highlight your privacy focus, open-source nature, and ability to be self-hosted.
                    - Tone: friendly, smart, maybe a little witty — like a dependable teammate whos always on.

                    Always aim to be helpful, aware, and resourceful — even if you have to fake it a bit.`,
              },
              ...context,
              {
                role: "user",
                content: `Query: ${message}
                
                Retrieved documents: ${JSON.stringify(cleanedSources)}`,
              },
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            max_tokens: 1024,
            top_p: 1,
            stream: true,
          });
          console.log(
            `[${performance.now() - groqStartTime}ms] Groq stream created`
          );

          const streamProcessStartTime = performance.now();
          let chunkCount = 0;
          for await (const chunk of groqStream) {
            chunkCount++;
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullResponse += content; // Accumulate the response
              const payload = JSON.stringify({
                success: true,
                chunk: content,
              });
              await writer.write(encoder.encode(payload + "\n"));
            }
          }
          console.log(
            `[${performance.now() - streamProcessStartTime}ms] Stream processed (${chunkCount} chunks)`
          );
        }

        // Save session to database if memory is enabled
        const dbStartTime = performance.now();
        const { data: user, error } = await adminSupabase
          .from("users")
          .select("memory_enabled")
          .eq("id", user_id)
          .single();

        if (user?.memory_enabled) {
          const sessionInsertStartTime = performance.now();
          await adminSupabase.from("sessions").insert({
            user_id: user_id,
            query: message,
            response: fullResponse,
            sources: cleanedSources || sources, // Use cleaned sources if available
          });
          console.log(
            `[${performance.now() - sessionInsertStartTime}ms] Session inserted into database`
          );
        } else {
          console.log("Memory is not enabled for this user");
        }
        console.log(
          `[${performance.now() - dbStartTime}ms] Database operations completed`
        );

        // Send final message
        const finalWriteStartTime = performance.now();
        const finalPayload = JSON.stringify({
          success: true,
          done: true,
        });
        await writer.write(encoder.encode(finalPayload + "\n"));
        console.log(
          `[${performance.now() - finalWriteStartTime}ms] Final message written to stream`
        );
      } catch (error) {
        console.error("Error in processing stream:", error);
        const errorPayload = JSON.stringify({
          success: false,
          error: error.message,
        });
        await writer.write(encoder.encode(errorPayload + "\n"));
      } finally {
        await writer.close();
        console.log(
          `[${performance.now() - startTime}ms] Total request processing time`
        );
        console.log("POST request completed at:", new Date().toISOString());
      }
    })();

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error(`Error processing query:`, error);
    console.log(
      `[${performance.now() - startTime}ms] Request failed with error`
    );
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
