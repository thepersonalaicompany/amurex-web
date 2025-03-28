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
    const { userId, accessToken, documents } = await req.json();
    let userEmail = req.headers.get("x-user-email");

    // Create new Supabase client with the access token
    const supabase = createClient(
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

    // Get user email from Supabase if not in headers
    if (!userEmail) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("email")
        .eq("id", userId)
        .single();

      if (userError || !userData?.email) {
        throw new Error("User email not found");
      }

      userEmail = userData.email;
    }

    // Process only the selected documents
    const docsResults = await processSelectedGoogleDocs({ id: userId }, supabase, documents);

    // Process Gmail emails by calling the existing Gmail process-labels endpoint
    let gmailResults = { success: false, error: "Gmail processing not attempted" };
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
        error: gmailError.message || "Failed to process Gmail" 
      };
    }

    // Send email notification
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

    return NextResponse.json({
      success: true,
      message: "Import complete. Check your email for details.",
      documents: docsResults.map((result) => ({
        id: result.id,
        title: result.title || `Document ${result.id}`,
        status: result.status,
      })),
      gmail: gmailResults
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
    const userId = url.searchParams.get('userId');
    
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

    // Process the documents
    const docsResults = await processGoogleDocs({ id: userId }, adminSupabase);

    // Process Gmail emails by calling the existing Gmail process-labels endpoint
    let gmailResults = { success: false, error: "Gmail processing not attempted" };
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
        error: gmailError.message || "Failed to process Gmail" 
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
      gmail: gmailResults
    });
  } catch (error) {
    console.error("Error fetching Google data:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function processGoogleDocs(session, supabase) {
  try {
    // Create admin Supabase client
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Get user's Google tokens
    const { data: user, error: userError } = await adminSupabase
      .from("users")
      .select("google_access_token, google_refresh_token, google_token_expiry, created_at")
      .eq("id", session.id)
      .single();

    if (userError || !user.google_access_token) {
      console.error("Google credentials not found:", userError);
      throw new Error("Google Docs not connected");
    }

    // Determine which OAuth credentials to use based on user signup date
    const cutoffDate = new Date('2025-03-28T08:33:14.69671Z');
    const userSignupDate = new Date(user.created_at);
    
    let clientId, clientSecret, redirectUri;
    
    // Use old credentials for users who signed up before the cutoff date
    if (userSignupDate < cutoffDate) {
      clientId = process.env.GOOGLE_CLIENT_ID_OLD;
      clientSecret = process.env.GOOGLE_CLIENT_SECRET_OLD;
      redirectUri = process.env.GOOGLE_REDIRECT_URI_OLD;
    } else {
      // Use new credentials for users who signed up after the cutoff date
      clientId = process.env.GOOGLE_CLIENT_ID_NEW;
      clientSecret = process.env.GOOGLE_CLIENT_SECRET_NEW;
      redirectUri = process.env.GOOGLE_REDIRECT_URI_NEW;
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // Set credentials including expiry
    oauth2Client.setCredentials({
      access_token: user.google_access_token,
      refresh_token: user.google_refresh_token,
      expiry_date: new Date(user.google_token_expiry).getTime(),
    });

    // Force token refresh if it's expired or about to expire
    if (
      !user.google_token_expiry ||
      new Date(user.google_token_expiry) <= new Date()
    ) {
      console.log("Token expired or missing expiry, refreshing...");
      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update tokens in database
      const { error: updateError } = await adminSupabase
        .from("users")
        .update({
          google_access_token: credentials.access_token,
          google_refresh_token:
            credentials.refresh_token || user.google_refresh_token,
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
    console.log("Fetched Google Docs:", JSON.stringify(response.data.files, null, 2));
    
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 200,
      chunkOverlap: 50,
    });

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
        console.log(`Document ${file.name} (${file.id}) content length: ${content.length}`);
        console.log(`Document content preview: ${content.substring(0, 500)}...`);

        // Log the raw document structure to see what we're working with
        console.log(`Raw document structure:`, JSON.stringify(doc.data.body.content.slice(0, 2), null, 2));

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
          .eq("checksum", checksum)
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

        // Generate tags and chunks
        const tags = await generateTags(content);
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
        const embeddingResponse = await fetch(
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

        // Insert document with properly formatted vectors
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

// New function to process only selected documents
async function processSelectedGoogleDocs(session, supabase, selectedDocs) {
  try {
    // Create admin Supabase client
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Get user's Google tokens
    const { data: user, error: userError } = await adminSupabase
      .from("users")
      .select("google_access_token, google_refresh_token, google_token_expiry, created_at")
      .eq("id", session.id)
      .single();

    if (userError || !user.google_access_token) {
      console.error("Google credentials not found:", userError);
      throw new Error("Google Docs not connected");
    }

    // Determine which OAuth credentials to use based on user signup date
    const cutoffDate = new Date('2025-03-28T08:33:14.69671Z');
    const userSignupDate = new Date(user.created_at);
    
    let clientId, clientSecret, redirectUri;
    
    // Use old credentials for users who signed up before the cutoff date
    if (userSignupDate < cutoffDate) {
      clientId = process.env.GOOGLE_CLIENT_ID_OLD;
      clientSecret = process.env.GOOGLE_CLIENT_SECRET_OLD;
      redirectUri = process.env.GOOGLE_REDIRECT_URI_OLD;
    } else {
      // Use new credentials for users who signed up after the cutoff date
      clientId = process.env.GOOGLE_CLIENT_ID_NEW;
      clientSecret = process.env.GOOGLE_CLIENT_SECRET_NEW;
      redirectUri = process.env.GOOGLE_REDIRECT_URI_NEW;
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // Set credentials including expiry
    oauth2Client.setCredentials({
      access_token: user.google_access_token,
      refresh_token: user.google_refresh_token,
      expiry_date: new Date(user.google_token_expiry).getTime(),
    });

    // Force token refresh if it's expired or about to expire
    if (
      !user.google_token_expiry ||
      new Date(user.google_token_expiry) <= new Date()
    ) {
      console.log("Token expired or missing expiry, refreshing...");
      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update tokens in database
      const { error: updateError } = await adminSupabase
        .from("users")
        .update({
          google_access_token: credentials.access_token,
          google_refresh_token:
            credentials.refresh_token || user.google_refresh_token,
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

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 200,
      chunkOverlap: 50,
    });

    const results = [];
    
    // Process each selected document
    for (const file of selectedDocs) {
      try {
        console.log(`Processing document:`, file);
        
        // Extract the file ID and other metadata
        const fileId = file.id;
        const fileName = file.name;
        const mimeType = file.mimeType;
        
        if (!fileId) {
          throw new Error("Invalid file object: missing ID");
        }
        
        console.log(`Processing file ID: ${fileId}, name: ${fileName}, type: ${mimeType}`);
        
        // For Google Docs, use the URL from the picker to extract content
        if (mimeType === 'application/vnd.google-apps.document') {
          try {
            // Instead of trying to access the file directly, use the URL from the picker
            // and ask the user to provide the content
            
            // For now, let's try to use the embedUrl which might be accessible
            const embedUrl = file.embedUrl;
            
            if (!embedUrl) {
              throw new Error("No embed URL available for this document");
            }
            
            // Create a placeholder document with minimal information
            // The actual content can be fetched later or provided by the user
            const content = `This is a placeholder for the document "${fileName}" (ID: ${fileId}).\nPlease access the document at: ${file.url}`;
            
            // Generate a checksum for this placeholder
            const checksum = crypto
              .createHash("sha256")
              .update(content)
              .digest("hex");
            
            // Insert document with minimal information
            const { data: newDoc, error: newDocError } = await adminSupabase
              .from("documents")
              .insert({
                title: fileName,
                text: content,
                url: file.url || `https://docs.google.com/document/d/${fileId}`,
                type: "google_docs",
                user_id: session.id,
                checksum: checksum,
                tags: ["placeholder", "google_docs"],
                created_at: new Date().toISOString(),
                chunks: [content],
                meta: {
                  lastModified: file.lastEditedUtc ? new Date(parseInt(file.lastEditedUtc)).toISOString() : new Date().toISOString(),
                  mimeType: mimeType,
                  documentId: fileId,
                  isPlaceholder: true,
                  embedUrl: embedUrl
                },
              })
              .select()
              .single();
            
            if (newDocError) {
              throw new Error(`Failed to create document: ${newDocError.message}`);
            }
            
            results.push({
              id: newDoc.id,
              status: "created_placeholder",
              title: fileName,
              message: "Created placeholder. Full content not accessible due to permissions."
            });
            
          } catch (docsError) {
            console.error(`Error handling document ${fileName} (${fileId}):`, docsError);
            throw new Error(`Could not process document: ${docsError.message}`);
          }
        } else {
          // For non-Google Docs, we might need different handling
          throw new Error(`Unsupported file type: ${mimeType}`);
        }
      } catch (error) {
        console.error(`Error processing document:`, file, error);
        results.push({
          id: file.id || "unknown",
          status: "error",
          title: file.name || "Unknown Document",
          error: error.message,
        });
        continue;
      }
    }

    return results;
  } catch (error) {
    console.error("Error in processSelectedGoogleDocs:", error);
    throw error;
  }
}
