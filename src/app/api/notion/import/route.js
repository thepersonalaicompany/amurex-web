import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { Client } from "@notionhq/client";
import OpenAI from "openai";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Initialize Groq client using OpenAI SDK
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// Create admin Supabase client with service role key
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
      const { data: userData, error: userError } = await adminSupabase
        .from("users")
        .select("email")
        .eq("id", session.user.id)
        .single();

      if (userError || !userData?.email) {
        throw new Error("User email not found");
      }

      userEmail = userData.email;
    }

    const { data: user, error: userError } = await adminSupabase
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
        console.log("Processing page:", page.id);
        const pageContent = await fetchNotionPageContent(notion, page.id);
        
        // Debug content length
        console.log(`Page content length: ${pageContent.length} characters`);
        // Log a preview of the content
        console.log(`Content preview: ${pageContent.substring(0, 200)}...`);
        
        const tags = await generateTags(pageContent);
        const checksum = crypto
          .createHash("sha256")
          .update(pageContent)
          .digest("hex");

        // Check for existing page
        const { data: existingPage } = await adminSupabase
          .from("documents")
          .select("id")
          .eq("url", page.url)
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
        try {
          console.log(`Attempting to insert document with ${pageContent.length} characters`);
          
          let newPage;
          let pageError;
          
          // First attempt with full content
          const fullContentResult = await adminSupabase
            .from("documents")
            .insert({
              url: page.url,
              title:
                page.properties?.name?.title?.[0]?.plain_text ||
                page.properties?.title?.title?.[0]?.plain_text ||
                "Untitled",
              text: pageContent, // Try with full content
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
            
          newPage = fullContentResult.data;
          pageError = fullContentResult.error;

          if (pageError) {
            console.error("Error creating page with full content:", pageError);
            console.log("Trying with truncated content...");
            
            // If full content fails, try with truncated content
            const truncatedContent = pageContent.substring(0, 10000) + 
              "\n[Content truncated due to size limitations]";
            
            const truncatedResult = await adminSupabase
              .from("documents")
              .insert({
                url: page.url,
                title:
                  page.properties?.name?.title?.[0]?.plain_text ||
                  page.properties?.title?.title?.[0]?.plain_text ||
                  "Untitled",
                text: truncatedContent,
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
                  original_length: pageContent.length,
                  truncated: true,
                },
              })
              .select()
              .single();
              
            if (truncatedResult.error) {
              console.error("Error even with truncated content:", truncatedResult.error);
              throw truncatedResult.error;
            }
            
            newPage = truncatedResult.data;
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

            const { error: updateError } = await adminSupabase
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
        } catch (insertError) {
          console.error("Error during document insertion:", insertError);
          continue; // Skip this page and move to the next one
        }
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
  let content = [];
  
  for (const block of response.results) {
    const blockContent = extractBlockContent(block);
    if (blockContent) {
      content.push(blockContent);
    }
    
    // Recursively fetch child blocks if they exist
    if (block.has_children) {
      const childContent = await fetchNotionPageContent(notion, block.id);
      if (childContent) {
        content.push(childContent);
      }
    }
  }
  
  return content.join("\n");
}

function extractBlockContent(block) {
  if (!block || !block.type) return "";
  
  switch (block.type) {
    case "paragraph":
      return block.paragraph.rich_text.map(text => text.plain_text).join("");
    case "heading_1":
      return `# ${block.heading_1.rich_text.map(text => text.plain_text).join("")}`;
    case "heading_2":
      return `## ${block.heading_2.rich_text.map(text => text.plain_text).join("")}`;
    case "heading_3":
      return `### ${block.heading_3.rich_text.map(text => text.plain_text).join("")}`;
    case "bulleted_list_item":
      return `• ${block.bulleted_list_item.rich_text.map(text => text.plain_text).join("")}`;
    case "numbered_list_item":
      return `- ${block.numbered_list_item.rich_text.map(text => text.plain_text).join("")}`;
    case "to_do":
      const checked = block.to_do.checked ? "[x]" : "[ ]";
      return `${checked} ${block.to_do.rich_text.map(text => text.plain_text).join("")}`;
    case "toggle":
      return block.toggle.rich_text.map(text => text.plain_text).join("");
    case "code":
      return `\`\`\`${block.code.language || ""}\n${block.code.rich_text.map(text => text.plain_text).join("")}\n\`\`\``;
    case "quote":
      return `> ${block.quote.rich_text.map(text => text.plain_text).join("")}`;
    case "callout":
      return `> ${block.callout.rich_text.map(text => text.plain_text).join("")}`;
    case "divider":
      return "---";
    case "table":
      return "[Table content]";
    case "table_row":
      return block.table_row.cells.map(cell => 
        cell.map(text => text.plain_text).join("")
      ).join(" | ");
    case "image":
      const imgCaption = block.image.caption?.map(text => text.plain_text).join("") || "";
      const imgUrl = block.image.type === "external" ? block.image.external.url : 
                    (block.image.file ? block.image.file.url : "");
      return `[Image${imgCaption ? `: ${imgCaption}` : ""}](${imgUrl})`;
    case "video":
      const vidCaption = block.video.caption?.map(text => text.plain_text).join("") || "";
      const vidUrl = block.video.type === "external" ? block.video.external.url : 
                    (block.video.file ? block.video.file.url : "");
      return `[Video${vidCaption ? `: ${vidCaption}` : ""}](${vidUrl})`;
    case "file":
      const fileCaption = block.file.caption?.map(text => text.plain_text).join("") || "";
      const fileUrl = block.file.type === "external" ? block.file.external.url : 
                     (block.file.file ? block.file.file.url : "");
      return `[File${fileCaption ? `: ${fileCaption}` : ""}](${fileUrl})`;
    case "pdf":
      const pdfCaption = block.pdf.caption?.map(text => text.plain_text).join("") || "";
      const pdfUrl = block.pdf.type === "external" ? block.pdf.external.url : 
                    (block.pdf.file ? block.pdf.file.url : "");
      return `[PDF${pdfCaption ? `: ${pdfCaption}` : ""}](${pdfUrl})`;
    case "bookmark":
      return `[Bookmark: ${block.bookmark.url}](${block.bookmark.url})`;
    case "link_preview":
      return `[Link Preview: ${block.link_preview.url}](${block.link_preview.url})`;
    case "embed":
      return `[Embedded content: ${block.embed.url}](${block.embed.url})`;
    case "equation":
      return `Equation: ${block.equation.expression}`;
    case "synced_block":
      return "[Synced block content]";
    case "template":
      return block.template.rich_text.map(text => text.plain_text).join("");
    case "link_to_page":
      return "[Link to another page]";
    case "child_page":
      return `[Child page: ${block.child_page.title || "Untitled"}]`;
    case "child_database":
      return `[Child database: ${block.child_database.title || "Untitled"}]`;
    case "column_list":
      return "[Column list]"; // Children will be processed separately
    case "column":
      return "[Column]"; // Children will be processed separately
    case "table_of_contents":
      return "[Table of contents]";
    case "breadcrumb":
      return "[Breadcrumb]";
    case "unsupported":
      return "[Unsupported content]";
    default:
      // Return block type for any unhandled types
      return `[${block.type} block]`;
  }
}

async function generateTags(text) {
  // Check if we should use a local model via Ollama
  if (process.env.CLIENT_MODE === 'local' && process.env.MODEL_NAME) {
    try {
      // Use local Ollama API
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
      
      if (!response.ok) {
        throw new Error('Failed to generate tags with local model');
      }
      
      const data = await response.json();
      return data.response
        .split(",")
        .map((tag) => tag.trim());
    } catch (error) {
      console.error('Error using local model:', error);
      console.log('Falling back to cloud API...');
      // Fall through to cloud API if local fails
    }
  }

  // Default to using Groq if local mode isn't enabled or fails
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