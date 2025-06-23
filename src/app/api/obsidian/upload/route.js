import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import crypto from "crypto";

// Create admin Supabase client with service role key
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Groq client using OpenAI SDK
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export const maxDuration = 300;

class TextSplitter {
  constructor({ chunkSize = 200, chunkOverlap = 50 } = {}) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  async createDocuments(texts) {
    const textArray = Array.isArray(texts) ? texts : [texts];

    return textArray.flatMap((text) => {
      const cleanText = text.trim().replace(/\s+/g, " ");

      if (cleanText.length <= this.chunkSize) {
        return [{ pageContent: cleanText }];
      }

      const chunks = [];
      let startIndex = 0;

      while (startIndex < cleanText.length) {
        chunks.push({
          pageContent: cleanText
            .slice(startIndex, startIndex + this.chunkSize)
            .trim(),
        });
        startIndex += this.chunkSize - this.chunkOverlap;
      }

      return chunks;
    });
  }
}

async function generateTags(text) {
  if (process.env.CLIENT_MODE === 'local' && process.env.MODEL_NAME) {
    try {
      // Use local Ollama model
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.MODEL_NAME,
          prompt: `Generate 3 relevant tags for the following text, separated by commas:\n\n${text.substring(0, 1000)}`,
          system: "You are a helpful assistant that generates relevant tags for a given text. Provide the tags as a comma-separated list without numbers or bullet points.",
        }),
      });
      
      const result = await response.json();
      return result.response
        .split(',')
        .map((tag) => tag.trim());
    } catch (error) {
      console.error("Error with local model, falling back to Groq:", error);
      // Fall through to Groq if local model fails
    }
  }
  
  // Default to Groq API
  const tagsResponse = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that generates relevant tags for a given text. Provide the tags as a comma-separated list without numbers or bullet points.",
      },
      {
        role: "user",
        content: `Generate 3 relevant tags for the following text, separated by commas:\n\n${text.substring(
          0,
          1000
        )}`,
      },
    ],
  });
  return tagsResponse.choices[0].message.content
    .split(",")
    .map((tag) => tag.trim());
}

export async function POST(req) {
  try {
    const { fileName, content, userId } = await req.json();
    let userEmail = req.headers.get("x-user-email");

    if (!userEmail) {
      const { data: userData, error: userError } = await adminSupabase
        .from("users")
        .select("email")
        .eq("id", userId)
        .single();

      if (userError || !userData?.email) {
        throw new Error("User email not found");
      }

      userEmail = userData.email;
    }

    const textSplitter = new TextSplitter({
      chunkSize: 200,
      chunkOverlap: 50,
    });

    const tags = await generateTags(content);
    const checksum = crypto.createHash("sha256").update(content).digest("hex");

    // Check for existing document
    const { data: existingDoc } = await adminSupabase
      .from("documents")
      .select("id")
      .eq("checksum", checksum)
      .eq("user_id", userId)
      .single();

    if (existingDoc) {
      return NextResponse.json({
        success: true,
        status: "existing",
        id: existingDoc.id,
        title: fileName,
      });
    }

    // Create new document
    const { data: newDoc, error: docError } = await adminSupabase
      .from("documents")
      .insert({
        title: fileName,
        text: content,
        tags: tags,
        user_id: userId,
        type: "obsidian",
        checksum,
        created_at: new Date().toISOString(),
        meta: {
          fileName,
          type: "obsidian",
          created_at: new Date().toISOString(),
          tags,
        },
      })
      .select()
      .single();

    if (docError) {
      console.error("Error creating document:", docError);
      throw docError;
    }

    // Process embeddings
    try {
      const sections = await textSplitter.createDocuments([content]);
      const chunkTexts = sections.map((section) => section.pageContent);

      const embeddingResponse = await fetch(
        "https://api.mistral.ai/v1/embeddings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
          },
          body: JSON.stringify({
            input: chunkTexts,
            model: "mistral-embed",
            encoding_format: "float",
          }),
        }
      );

      const embedData = await embeddingResponse.json();
      const embeddings = embedData.data.map(
        (item) => `[${item.embedding.join(",")}]`
      );
      const centroid = `[${calculateCentroid(
        embedData.data.map((item) => item.embedding)
      ).join(",")}]`;

      const { error: updateError } = await adminSupabase
        .from("documents")
        .update({
          chunks: chunkTexts,
          embeddings: embeddings,
          centroid: centroid,
        })
        .eq("id", newDoc.id);

      if (updateError) {
        console.error("Error updating embeddings:", updateError);
      }
    } catch (embeddingError) {
      console.error("Error processing embeddings:", embeddingError);
    }

    // Send email notification
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userEmail: userEmail,
        importResults: [{ id: newDoc.id, status: "created", title: fileName }],
        platform: "obsidian",
      }),
    });

    return NextResponse.json({
      success: true,
      message: "Import complete. Check your email for details.",
      documents: [
        {
          id: newDoc.id,
          title: fileName,
          status: "created",
        },
      ],
    });
  } catch (error) {
    console.error("Error processing markdown file:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function calculateCentroid(embeddings) {
  if (!embeddings || embeddings.length === 0) {
    throw new Error("No embeddings provided to calculate centroid");
  }

  const dimensions = embeddings[0].length;
  const centroid = new Array(dimensions).fill(0);

  for (const embedding of embeddings) {
    for (let i = 0; i < dimensions; i++) {
      centroid[i] += embedding[i];
    }
  }

  for (let i = 0; i < dimensions; i++) {
    centroid[i] /= embeddings.length;
  }

  return centroid;
}

