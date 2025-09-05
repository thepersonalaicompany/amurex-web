import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { Client } from "@notionhq/client";
import { google } from "googleapis";
import crypto from "crypto";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Groq client using OpenAI SDK
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ["https://www.googleapis.com/auth/documents.readonly"],
});

export async function POST(req) {
  const { url, title, text, session } = await req.json();

  if (!session || !session.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
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
    const tags = tagsResponse.choices[0].message.content
      .split(",")
      .map((tag) => tag.trim());

    // Generate checksum for deduplication
    const checksum = crypto.createHash("sha256").update(text).digest("hex");

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
        embedding: embeddingResponse.data[0].embedding,
      });
    }

    return NextResponse.json({ success: true, documentId: document.id });
  } catch (error) {
    console.error("Error processing document:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function fetchDocumentText(url) {
  if (url.includes("notion.so")) {
    return await fetchNotionText(url);
  } else if (url.includes("docs.google.com")) {
    return await fetchGoogleDocsText(url);
  } else {
    throw new Error("Unsupported document type");
  }
}

async function fetchNotionText(url) {
  const pageId = url.split("-").pop();
  const response = await notion.blocks.children.list({ block_id: pageId });
  return response.results
    .filter(
      (block) =>
        block.type === "paragraph" && block.paragraph.rich_text.length > 0
    )
    .map((block) => block.paragraph.rich_text[0].plain_text)
    .join("\n");
}

async function fetchGoogleDocsText(url) {
  const docs = google.docs({ version: "v1", auth });
  const docId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)[1];
  const response = await docs.documents.get({ documentId: docId });
  return response.data.body.content
    .filter((element) => element.paragraph)
    .map((element) =>
      element.paragraph.elements.map((e) => e.textRun.content).join("")
    )
    .join("\n");
}
