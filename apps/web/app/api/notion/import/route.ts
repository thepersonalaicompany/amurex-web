import { NextResponse } from "next/server";
import { calculateCentroid, fetchNotionPageContent, generateTags } from "./lib";
import crypto from "crypto";
import { supabaseAdminClient } from "@amurex/supabase";
import { Client } from "@notionhq/client";
import { TextSplitter } from "@amurex/web/lib";

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const { session } = await req.json();
    let userEmail = req.headers.get("x-user-email");

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // initialize supabase admin client with service role key
    const adminSupabase = supabaseAdminClient(
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    );

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
        { status: 400 },
      );
    }

    const notion = new Client({ auth: user.notion_access_token });
    const response = await notion.search({
      filter: { property: "object", value: "page" },
    });

    console.log("Response:", response.results.length);

    const textSplitter = new TextSplitter({ chunkSize: 200, chunkOverlap: 50 });

    // console.log("Response:", response.results.length)    // TODO?: not needed i think

    const results = [];

    for (const page of response.results) {
      try {
        console.log("Processing page:", page.id);
        const pageContent = await fetchNotionPageContent(notion, page.id);

        // Debug content length
        console.log(`page content length: ${pageContent.length} characters`);
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
          .eq("url", (page as any).url)
          .eq("user_id", session.user.id)
          .single();

        if (existingPage) {
          results.push({ id: existingPage.id, status: "existing" });
          continue;
        }

        console.log(
          "Creating new page:",
          (page as any).properties?.name?.title?.[0]?.plain_text ||
            (page as any).properties?.title?.title?.[0]?.plain_text ||
            "Untitled",
        );

        // Create new page
        try {
          console.log(
            `Attempting to insert document with ${pageContent.length} characters`,
          );

          let newPage;
          let pageError;

          // First attempt with full content
          const fullContentResult = await adminSupabase
            .from("documents")
            .insert({
              url: (page as any).url,
              title:
                (page as any).properties?.name?.title?.[0]?.plain_text ||
                (page as any).properties?.title?.title?.[0]?.plain_text ||
                "Untitled",
              text: pageContent, // Try with full content
              tags: tags,
              user_id: session.user.id,
              type: "notion",
              checksum,
              created_at: new Date().toISOString(),
              meta: {
                title:
                  (page as any).properties?.name?.title?.[0]?.plain_text ||
                  (page as any).properties?.title?.title?.[0]?.plain_text ||
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
            const truncatedContent =
              pageContent.substring(0, 10000) +
              "\n[Content truncated due to size limitations]";

            const truncatedResult = await adminSupabase
              .from("documents")
              .insert({
                url: (page as any).url,
                title:
                  (page as any).properties?.name?.title?.[0]?.plain_text ||
                  (page as any).properties?.title?.title?.[0]?.plain_text ||
                  "Untitled",
                text: truncatedContent,
                tags: tags,
                user_id: session.user.id,
                type: "notion",
                checksum,
                created_at: new Date().toISOString(),
                meta: {
                  title:
                    (page as any).properties?.name?.title?.[0]?.plain_text ||
                    (page as any).properties?.title?.title?.[0]?.plain_text ||
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
              console.error(
                "Error even with truncated content:",
                truncatedResult.error,
              );
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
              },
            );

            const embedData = await embeddingResponse.json();
            const embeddings = embedData.data.map(
              (item: any) => `[${item.embedding.join(",")}]`,
            );
            const centroid = `[${calculateCentroid(
              embedData.data.map((item: any) => item.embedding),
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
      } catch (pageError: any) {
        console.error("Error processing page:", pageError, page);
        continue; // Skip this page and move to next one
      }
    }
  } catch (error: any) {
    console.error("Error importing from Notion:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
