import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { Client } from "@notionhq/client";
import OpenAI from "openai";
import crypto from "crypto";

const openai = new OpenAI(process.env.OPENAI_API_KEY);

export const maxDuration = 300;

class TextSplitter {
  constructor({ chunkSize = 200, chunkOverlap = 50 } = {}) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  async createDocuments(texts) {
    // Handle array of texts or single text
    const textArray = Array.isArray(texts) ? texts : [texts];

    return textArray.flatMap((text) => {
      // Clean and normalize text
      const cleanText = text.trim().replace(/\s+/g, " ");

      // If text is shorter than chunk size, return as single chunk
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

export async function POST(req) {
  try {
    const { session } = await req.json();
    let userEmail = req.headers.get("x-user-email");

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user email if not in headers
    if (!userEmail) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("email")
        .eq("id", session.user.id)
        .single();

      if (userError || !userData?.email) {
        throw new Error("User email not found");
      }

      userEmail = userData.email;
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("notion_access_token")
      .eq("id", session.user.id)
      .single();

    if (userError || !user.notion_access_token) {
      console.log("User Error:", userError);
      return NextResponse.json(
        { success: false, error: "Notion not connected" },
        { status: 400 }
      );
    }

    const notion = new Client({ auth: user.notion_access_token });
    const response = await notion.search({
      filter: { property: "object", value: "page" },
    });

    console.log("Response:", response.results.length);

    const textSplitter = new TextSplitter({
      chunkSize: 200,
      chunkOverlap: 50,
    });

    console.log("Response:", response.results.length);

    const results = [];
    for (const page of response.results) {
      try {
        console.log("Processing page:", page);
        const pageContent = await fetchNotionPageContent(notion, page.id);
        const tags = await generateTags(pageContent);
        const checksum = crypto
          .createHash("sha256")
          .update(pageContent)
          .digest("hex");

        // Check for existing page
        const { data: existingPage } = await supabase
          .from("documents")
          .select("id")
          .eq("checksum", checksum)
          .eq("user_id", session.user.id)
          .single();

        if (existingPage) {
          results.push({ id: existingPage.id, status: "existing" });
          continue;
        }

        console.log(
          "Creating new page:",
          page.properties?.name?.title?.[0]?.plain_text ||
            page.properties?.title?.title?.[0]?.plain_text ||
            "Untitled"
        );

        // Create new page
        const { data: newPage, error: pageError } = await supabase
          .from("documents")
          .insert({
            url: page.url,
            title:
              page.properties?.name?.title?.[0]?.plain_text ||
              page.properties?.title?.title?.[0]?.plain_text ||
              "Untitled",
            text: pageContent,
            tags: tags,
            user_id: session.user.id,
            type: "notion",
            checksum,
            created_at: new Date().toISOString(),
            meta: {
              title:
                page.properties?.name?.title?.[0]?.plain_text ||
                page.properties?.title?.title?.[0]?.plain_text ||
                "Untitled",
              type: "notion",
              created_at: new Date().toISOString(),
              tags: tags,
            },
          })
          .select()
          .single();

        if (pageError) {
          console.error("Error creating page:", pageError, page);
          continue; // Skip this page and move to the next one
        }

        // Process embeddings
        try {
          const sections = await textSplitter.createDocuments([pageContent]);
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

          const { error: updateError } = await supabase
            .from("documents")
            .update({
              chunks: chunkTexts,
              embeddings: embeddings,
              centroid: centroid,
            })
            .eq("id", newPage.id)
            .select()
            .single();

          if (updateError) {
            console.error("Error updating embeddings:", updateError);
            // Don't throw error, just log it and continue
          }
        } catch (embeddingError) {
          console.error("Error processing embeddings:", embeddingError);
          // Continue with next page even if embeddings fail
        }

        results.push({
          id: newPage.id,
          status: "created",
          title: newPage.title,
        });
      } catch (pageError) {
        console.error("Error processing page:", pageError, page);
        continue; // Skip this page and move to the next one
      }
    }

    // Send email notification
    if (results.length > 0) {
      await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userEmail: userEmail,
            importResults: results,
            platform: "notion",
          }),
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Import complete. Check your email for details.",
      documents: results.map((result) => ({
        id: result.id,
        title: result.title || `Document ${result.id}`,
        status: result.status,
      })),
    });
  } catch (error) {
    console.error("Error importing from Notion:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function fetchNotionPageContent(notion, pageId) {
  const response = await notion.blocks.children.list({ block_id: pageId });
  return response.results
    .filter(
      (block) =>
        block.type === "paragraph" && block.paragraph.rich_text.length > 0
    )
    .map((block) => block.paragraph.rich_text[0].plain_text)
    .join("\n");
}

async function generateTags(text) {
  const tagsResponse = await openai.chat.completions.create({
    model: "gpt-4o",
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

async function generateEmbeddings(text) {
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text.substring(0, 8000),
  });
  return embeddingResponse.data[0].embedding;
}

// Add centroid calculation function
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
