import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { google } from "googleapis";
import OpenAI from "openai";
import crypto from "crypto";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createClient } from "@supabase/supabase-js";

// Initialize Groq client using OpenAI SDK
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export const maxDuration = 300;
export const dynamic = "force-dynamic";

async function generateTags(text) {
  const clientMode = process.env.CLIENT_MODE || 'local';
  if (clientMode === 'local') {
    // Use local Ollama model as fallback
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_LOCAL_AI_MODEL_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.MODEL_NAME || 'llama3.1:8b',
          prompt: `Generate 3 relevant tags for the following text, separated by commas:\n\n${text.substring(0, 1000)}`,
          system: "You are a helpful assistant that generates relevant tags for a given text. Provide the tags as a comma-separated list without numbers or bullet points."
        }),
      });
      
      const result = await response.json();
      return result.response
        .split(",")
        .map((tag) => tag.trim());
    } catch (error) {
      console.error("Local model error:", error);
      // Return default tags if local model fails
      return ["document", "content", "text"];
    }
  } else {
    // Use Groq API
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
}

export async function POST(req) {
  try {
    const requestData = await req.json();
    const {
      userId,
      accessToken,
      googleAccessToken,
      googleRefreshToken,
      googleTokenExpiry,
    } = requestData;
    let userEmail = req.headers.get("x-user-email");

    // Create Supabase client - either with the provided access token or with service role
    let supabaseClient;
    if (accessToken) {
      // Client-side request with Supabase access token
      supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        }
      );
    } else {
      // Server-side request (from callback) without Supabase token
      supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
    }

    // Check user's Google token version
    const { data: userData, error: userError } = await supabaseClient
      .from("users")
      .select(
        "email, google_token_version, google_access_token, google_refresh_token, google_token_expiry"
      )
      .eq("id", userId)
      .single();

    if (userError) {
      throw new Error("Failed to fetch user data: " + userError.message);
    }

    // Get user email from Supabase if not in headers
    if (!userEmail && userData?.email) {
      userEmail = userData.email;
    }

    // Use provided Google tokens if available, otherwise use stored tokens
    const googleTokens = {
      access_token: googleAccessToken || userData.google_access_token,
      refresh_token: googleRefreshToken || userData.google_refresh_token,
      expiry_date: googleTokenExpiry || userData.google_token_expiry,
    };

    // Only process Google Docs if token version is "full"
    let docsResults = [];
    if (userData?.google_token_version === "full") {
      // Process the documents using the appropriate tokens
      docsResults = await processGoogleDocs(
        { id: userId },
        supabaseClient,
        googleTokens
      );

      // Send email notification if documents were processed
      if (docsResults.length > 0) {
        await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userEmail: userEmail,
              importResults: docsResults,
              platform: "google_docs",
            }),
          }
        );
      }
    } else {
      console.log("Skipping Google Docs import - token version is not 'full'");
      docsResults = [{ status: "skipped", reason: "Insufficient permissions" }];
    }

    // Process Gmail emails by calling the existing Gmail process-labels endpoint
    let gmailResults = {
      success: false,
      error: "Gmail processing not attempted",
    };
    try {
      const gmailResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/process-labels`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userId,
            maxEmails: 20,
          }),
        }
      );

      gmailResults = await gmailResponse.json();
      console.log("Gmail processing results:", gmailResults);
    } catch (gmailError) {
      console.error("Error processing Gmail:", gmailError);
      gmailResults = {
        success: false,
        error: gmailError.message || "Failed to process Gmail",
      };
    }

    return NextResponse.json({
      success: true,
      message: "Import complete. Check your email for details.",
      documents: docsResults.map((result) => ({
        id: result.id,
        title: result.title || `Document ${result.id}`,
        status: result.status,
      })),
      gmail: gmailResults,
    });
  } catch (error) {
    console.error("Error initiating Google import:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    // Get user ID from the URL query parameters
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check user's Google token version
    const { data: userData, error: userError } = await adminSupabase
      .from("users")
      .select("google_token_version")
      .eq("id", userId)
      .single();

    if (userError) {
      throw new Error("Failed to fetch user data: " + userError.message);
    }

    // Only process Google Docs if token version is "full"
    let docsResults = [];
    if (userData?.google_token_version === "full") {
      // Process the documents
      docsResults = await processGoogleDocs({ id: userId }, adminSupabase);
    } else {
      console.log("Skipping Google Docs import - token version is not 'full'");
      docsResults = [{ status: "skipped", reason: "Insufficient permissions" }];
    }

    // Process Gmail emails by calling the existing Gmail process-labels endpoint
    let gmailResults = {
      success: false,
      error: "Gmail processing not attempted",
    };
    try {
      const gmailResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/process-labels`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userId,
            useStandardColors: false,
          }),
        }
      );

      gmailResults = await gmailResponse.json();
      console.log("Gmail processing results:", gmailResults);
    } catch (gmailError) {
      console.error("Error processing Gmail:", gmailError);
      gmailResults = {
        success: false,
        error: gmailError.message || "Failed to process Gmail",
      };
    }

    return NextResponse.json({
      success: true,
      message: "Import complete",
      documents: docsResults.map((result) => ({
        id: result.id,
        title: result.title || `Document ${result.id}`,
        status: result.status,
      })),
      gmail: gmailResults,
    });
  } catch (error) {
    console.error("Error fetching Google data:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function processGoogleDocs(session, supabase, providedTokens = null) {
  try {
    // Create admin Supabase client
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // If tokens are provided directly, use them
    let tokens;
    if (providedTokens && providedTokens.access_token) {
      tokens = providedTokens;
    } else {
      // Otherwise get user's Google tokens from database
      const { data: user, error: userError } = await adminSupabase
        .from("users")
        .select(
          "google_access_token, google_refresh_token, google_token_expiry, created_at"
        )
        .eq("id", session.id)
        .single();

      if (userError || !user.google_access_token) {
        console.error("Google credentials not found:", userError);
        throw new Error("Google Docs not connected");
      }

      tokens = {
        access_token: user.google_access_token,
        refresh_token: user.google_refresh_token,
        expiry_date: new Date(user.google_token_expiry).getTime(),
      };
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID_NEW,
      process.env.GOOGLE_CLIENT_SECRET_NEW,
      process.env.GOOGLE_REDIRECT_URI_NEW
    );

    // Set credentials including expiry
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: new Date(tokens.expiry_date).getTime(),
    });

    // Force token refresh if it's expired or about to expire
    if (!tokens.expiry_date || new Date(tokens.expiry_date) <= new Date()) {
      console.log("Token expired or missing expiry, refreshing...");
      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update tokens in database
      const { error: updateError } = await adminSupabase
        .from("users")
        .update({
          google_access_token: credentials.access_token,
          google_refresh_token:
            credentials.refresh_token || tokens.refresh_token,
          google_token_expiry: new Date(credentials.expiry_date).toISOString(),
        })
        .eq("id", session.id);

      if (updateError) {
        console.error("Error updating refreshed tokens:", updateError);
        throw new Error("Failed to update Google credentials");
      }
    }

    const docs = google.docs({ version: "v1", auth: oauth2Client });
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // List documents
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.document'",
      fields: "files(id, name, modifiedTime, mimeType)",
      pageSize: 5,
    });

    // Print fetched results
    console.log(
      "Fetched Google Docs:",
      JSON.stringify(response.data.files, null, 2)
    );

    // Commented out text splitter initialization
    /*
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 200,
      chunkOverlap: 50,
    });
    */

    const results = [];
    for (const file of response.data.files) {
      try {
        const doc = await docs.documents.get({ documentId: file.id });

        // Add null checks for document content
        if (!doc.data?.body?.content) {
          console.warn(
            `Empty or invalid document content for ${file.name} (${file.id})`
          );
          results.push({
            id: file.id,
            status: "error",
            title: file.name,
            error: "Empty or invalid document content",
          });
          continue;
        }

        // Extract content from the document
        const content = doc.data.body.content
          .filter((item) => item?.paragraph?.elements)
          .map((item) =>
            item.paragraph.elements
              .filter((e) => e?.textRun?.content)
              .map((e) => e.textRun.content)
              .join("")
          )
          .filter(Boolean)
          .join("\n");

        // Log content for debugging
        console.log(
          `Document ${file.name} (${file.id}) content length: ${content.length}`
        );
        console.log(
          `Document content preview: ${content.substring(0, 500)}...`
        );

        // Log the raw document structure to see what we're working with
        console.log(
          `Raw document structure:`,
          JSON.stringify(doc.data.body.content.slice(0, 2), null, 2)
        );

        if (!content) {
          console.warn(
            `No text content found in document ${file.name} (${file.id})`
          );
          results.push({
            id: file.id,
            status: "error",
            title: file.name,
            error: "No text content found",
          });
          continue;
        }

        const checksum = crypto
          .createHash("sha256")
          .update(content)
          .digest("hex");

        console.log("checksum:", checksum);
        console.log("user id?", session.id);

        // Check for existing document
        const { data: existingDoc } = await adminSupabase
          .from("documents")
          .select("id")
          .eq("user_id", session.id)
          .eq("url", `https://docs.google.com/document/d/${file.id}`)
          .single();

        console.log("existing doc?", existingDoc);
        console.log("existing doc type?", typeof existingDoc);

        if (existingDoc !== null) {
          console.log("existing doc found!");
          results.push({
            id: existingDoc.id,
            status: "existing",
            title: file.name,
          });
          continue;
        }

        // Generate tags
        const tags = await generateTags(content);

        // Commented out chunking and embedding generation
        /*
        const chunks = await textSplitter.createDocuments([content]);
        const chunkTexts = chunks.map((chunk) => chunk.pageContent);

        // Log chunk information for debugging
        console.log(`Document ${file.name} (${file.id}) generated ${chunks.length} chunks`);
        console.log(`Chunk lengths: ${chunkTexts.map(c => c.length).join(', ')}`);

        // Validate chunks before generating embeddings
        if (!chunkTexts || chunkTexts.length === 0) {
          console.warn(`No valid chunks generated for document ${file.name} (${file.id})`);
          results.push({
            id: file.id,
            status: "error",
            title: file.name,
            error: "Failed to generate text chunks",
          });
          continue;
        }

        // Filter out any empty chunks
        const validChunks = chunkTexts.filter(chunk => chunk && chunk.trim().length > 0);

        if (validChunks.length === 0) {
          console.warn(`All chunks were empty for document ${file.name} (${file.id})`);
          results.push({
            id: file.id,
            status: "error",
            title: file.name,
            error: "All text chunks were empty",
          });
          continue;
        }

        // Generate embeddings using Mistral API
        let embeddingResponse;
        if (misttralApiKey?.length == 0) {
          embeddingResponse = await fetch("/api/embed", {
          method: "GET",
          body: JSON.stringify({text: truncatedText}),
          headers: {
            "Content-Type": "application/json",
          },
      });
        } else {
          embeddingResponse = await fetch(
          "https://api.mistral.ai/v1/embeddings",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
            },
            body: JSON.stringify({
              input: validChunks,
              model: "mistral-embed",
              encoding_format: "float",
            }),
          }
        );
        }
       

        const embedData = await embeddingResponse.json();

        // Add error handling for the embedding data
        if (!embedData || !embedData.data || !Array.isArray(embedData.data)) {
          console.error("Invalid embedding data received:", embedData);
          throw new Error("Failed to generate embeddings: Invalid response format");
        }

        // Format embeddings as arrays for Postgres vector type
        const embeddings = embedData.data.map(item => {
          if (!item || !item.embedding || !Array.isArray(item.embedding)) {
            console.error("Invalid embedding item:", item);
            throw new Error("Failed to process embedding: Invalid format");
          }
          return `[${item.embedding.join(",")}]`;
        });

        // Calculate and format centroid as array for Postgres
        const centroid = `[${calculateCentroid(
          embedData.data.map(item => {
            if (!item || !item.embedding || !Array.isArray(item.embedding)) {
              console.error("Invalid embedding item for centroid:", item);
              throw new Error("Failed to calculate centroid: Invalid embedding format");
            }
            return item.embedding;
          })
        ).join(",")}]`;
        */

        // Using empty arrays for chunks and embeddings
        const chunkTexts = [];
        const embeddings = [];
        const centroid = null;

        // Insert document with empty chunks and embeddings
        const { data: newDoc, error: newDocError } = await adminSupabase
          .from("documents")
          .insert({
            title: file.name,
            text: content,
            url: `https://docs.google.com/document/d/${file.id}`,
            type: "google_docs",
            user_id: session.id,
            checksum: checksum,
            tags: tags,
            created_at: new Date().toISOString(),
            chunks: chunkTexts,
            embeddings: embeddings,
            centroid: centroid,
            meta: {
              lastModified: file.modifiedTime,
              mimeType: file.mimeType,
              documentId: file.id,
            },
          })
          .select()
          .single();

        results.push({
          id: newDoc.id,
          status: "created",
          title: file.name,
        });
      } catch (docError) {
        console.error(
          `Error processing document ${file.name} (${file.id}):`,
          docError
        );
        results.push({
          id: file.id,
          status: "error",
          title: file.name,
          error: docError.message,
        });
        continue;
      }
    }

    return results;
  } catch (error) {
    console.error("Error in processGoogleDocs:", error);
    throw error;
  }
}

// Commenting out the centroid calculation function since it's not being used
/*
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
*/
