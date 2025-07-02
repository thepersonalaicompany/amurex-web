import { google } from "googleapis";
import crypto from "crypto";
import { supabaseAdminClient } from "@amurex/supabase";
import { getOauth2Client } from "@amurex/web/lib";
import { generateTags } from "./generateTags";

interface GoogleTokens {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | string | null;
}

export const processGoogleDocs = async (
  session: { id: string },
  providedTokens: GoogleTokens | null = null,
): Promise<any[]> => {
  try {
    // If tokens are provided directly, use them
    let tokens: GoogleTokens;
    if (providedTokens && providedTokens.access_token) {
      tokens = providedTokens;
    } else {
      // initialize supabase admin client with service role key
      const adminSupabase = supabaseAdminClient(
        process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      );

      // Otherwise get user's Google tokens from database
      const { data: user, error: userError } = await adminSupabase
        .from("users")
        .select(
          "google_access_token, google_refresh_token, google_token_expiry, created_at",
        )
        .eq("id", session.id)
        .single();

      if (userError || !user?.google_access_token) {
        console.error("Google credentials not found:", userError);
        throw new Error("Google Docs not connected");
      }

      tokens = {
        access_token: user.google_access_token,
        refresh_token: user.google_refresh_token,
        expiry_date: new Date(user.google_token_expiry as string).getTime(),
      };
    }

    const oauth2Client = getOauth2Client({});

    // Set credentials including expiry
    oauth2Client.setCredentials({
      access_token: tokens.access_token as string,
      refresh_token: tokens.refresh_token as string,
      expiry_date: new Date(tokens.expiry_date as number).getTime(),
    });

    // Force token refresh if it's expired or about to expire
    if (
      !tokens.expiry_date ||
      new Date(tokens.expiry_date as number) <= new Date()
    ) {
      console.log("Token expired or missing expiry, refreshing...");
      const { credentials } = await oauth2Client.refreshAccessToken();

      // initialize supabase admin client with service role key
      const adminSupabase = supabaseAdminClient(
        process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      );

      // Update tokens in database
      const { error: updateError } = await adminSupabase
        .from("users")
        .update({
          google_access_token: credentials.access_token,
          google_refresh_token:
            credentials.refresh_token || tokens.refresh_token,
          google_token_expiry: new Date(
            credentials.expiry_date as number,
          ).toISOString(),
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
      JSON.stringify(response.data.files, null, 2),
    );

    // Commented out text splitter initialization
    /*
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 200,
      chunkOverlap: 50,
    });
    */

    const results: any[] = [];
    for (const file of response.data.files || []) {
      try {
        const doc = await docs.documents.get({ documentId: file.id as string });

        // Add null checks for document content
        if (!doc.data?.body?.content) {
          console.warn(
            `Empty or invalid document content for ${file.name} (${file.id})`,
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
          .filter((item: any) => item?.paragraph?.elements)
          .map((item: any) =>
            item.paragraph.elements
              .filter((e: any) => e?.textRun?.content)
              .map((e: any) => e.textRun.content)
              .join(""),
          )
          .filter(Boolean)
          .join("\n");

        // Log content for debugging
        console.log(
          `Document ${file.name} (${file.id}) content length: ${content.length}`,
        );
        console.log(
          `Document content preview: ${content.substring(0, 500)}...`,
        );

        // Log the raw document structure to see what we're working with
        console.log(
          `Raw document structure:`,
          JSON.stringify(doc.data.body.content.slice(0, 2), null, 2),
        );

        if (!content) {
          console.warn(
            `No text content found in document ${file.name} (${file.id})`,
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

        // initialize supabase admin client with service role key
        const adminSupabase = supabaseAdminClient(
          process.env.SUPABASE_SERVICE_ROLE_KEY as string,
        );

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

        // Using empty arrays for chunks and embeddings
        const chunkTexts: string[] = [];
        const embeddings: string[] = [];
        const centroid: null | string = null;

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

        if (newDocError) throw newDocError;

        // TODO?: added optional chaining
        results.push({
          id: newDoc?.id,
          status: "created",
          title: file.name,
        });
      } catch (docError: any) {
        console.error(
          `Error processing document ${file.name} (${file.id}):`,
          docError,
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
  } catch (error: any) {
    console.error("Error in processGoogleDocs:", error);
    throw error;
  }
};
