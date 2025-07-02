import { NextResponse } from "next/server";
import { supabaseAdminClient } from "@amurex/supabase";
import { groqClient as groq } from "@amurex/web/lib";
import crypto from "crypto";
import type {
  RequestBody,
  User,
  DocumentRow,
  EmbeddingResponse,
} from "./types";
import { calculateCentroid } from "./lib";
import { TextSplitter } from "@amurex/web/lib";

export const maxDuration = 300;

async function generateTags(text: string): Promise<string[]> {
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
          1000,
        )}`,
      },
    ],
  });
  return (tagsResponse.choices[0]?.message?.content ?? "")
    .split(",")
    .map((tag: string) => tag.trim());
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const { fileName, content, userId } = (await req.json()) as RequestBody;
    let userEmail = req.headers.get("x-user-email");

    if (!userEmail) {
      // initialize supabase admin client with service role key
      const adminSupabase = supabaseAdminClient(
        process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      );

      const { data: userData, error: userError } = await adminSupabase
        .from("users")
        .select("email")
        .eq("id", userId)
        .single();

      if (userError || !userData?.email) {
        throw new Error("User email not found");
      }

      userEmail = (userData as User).email;
    }

    const textSplitter = new TextSplitter({
      chunkSize: 200,
      chunkOverlap: 50,
    });

    const tags = await generateTags(content);
    const checksum = crypto.createHash("sha256").update(content).digest("hex");

    // initialize supabase admin client with service role key
    const adminSupabase = supabaseAdminClient(
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    );

    // Check for existing document
    const { data: existingDoc } = await adminSupabase
      .from("documents")
      .select("id")
      .eq("checksum", checksum)
      .eq("user_id", userId)
      .single<DocumentRow>();

    if (existingDoc?.id) {
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
      .insert<DocumentRow>({
        title: fileName,
        text: content,
        tags: tags,
        user_id: userId,
        type: "obsidian",
        checksum: checksum,
        created_at: new Date().toISOString(),
        meta: {
          fileName,
          type: "obsidian",
          created_at: new Date().toISOString(),
          tags,
        },
      })
      .select()
      .single<DocumentRow>();

    if (docError || !newDoc) {
      console.error("Error creating document:", docError);
      throw docError || new Error("Failed to create document");
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
            Authorization: `Bearer ${process.env.MISTRAL_API_KEY!}`,
          },
          body: JSON.stringify({
            input: chunkTexts,
            model: "mistral-embed",
            encoding_format: "float",
          }),
        },
      );

      const embedData = (await embeddingResponse.json()) as EmbeddingResponse;
      const embeddings = embedData.data.map(
        (item) => `[${item.embedding.join(",")}]`,
      );
      const centroid = `[${calculateCentroid(
        embedData.data.map((item) => item.embedding),
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
  } catch (error: unknown) {
    console.error("Error processing markdown file:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
