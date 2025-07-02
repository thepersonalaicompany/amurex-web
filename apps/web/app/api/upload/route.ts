import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdminClient } from "@amurex/supabase";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { groqClient as groq } from "@amurex/web/lib";

export async function POST(req: Request) {
  const { url, title, text, session } = await req.json();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Generate tags using Groq
    const tagsResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that generates relevant tags for a given text.",
        },
        {
          role: "user",
          content: `Generate 20 relevant tags for the following text:\n\n${text.substring(0, 1000)}`,
        },
      ],
    });

    const tags = tagsResponse.choices[0]?.message.content
      ?.split(",")
      .map((tag) => tag.trim());

    // Generate checksum for deduplication
    const checksum = crypto.createHash("sha256").update(text).digest("hex");

    // initialize supabase admin client with service role key
    const supabase = supabaseAdminClient(
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    );

    // Check if document exists
    const { data: existingDoc } = await supabase
      .from("documents")
      .select("id")
      .eq("checksum", checksum)
      .single();

    if (existingDoc) {
      return NextResponse.json({
        success: true,
        message: "Document already exists",
        documentId: existingDoc.id,
      });
    }

    // Create new document
    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        url,
        title,
        text,
        tags,
        checksum,
        created_at: new Date().toISOString(),
        meta: {
          type: "manual",
          created_at: new Date().toISOString(),
        },
        user_id: session.user.id,
      })
      .select()
      .single();

    if (docError) throw docError;

    // Split text into sections
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const sections = await textSplitter.createDocuments([text]);

    // Process each section
    for (const section of sections) {
      const embeddingResponse = await groq.embeddings.create({
        model: "text-embedding-ada-002",
        input: section.pageContent,
      });

      await supabase.from("page_sections").insert({
        document_id: document.id,
        context: section.pageContent,
        token_count: section.pageContent.split(/\s+/).length,
        embedding: embeddingResponse.data[0]?.embedding ?? [], // TODO?: had to add `??` to safely hadle the case where data[0] might be undefined
      });

      return NextResponse.json({ success: true, documentId: document.id });
    }
  } catch (error: any) {
    console.error("Error processing document", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
