import { NextResponse } from "next/server";
import {
  categorizeWithAI,
  GMAIL_COLORS,
  storeEmailInDatabase,
  validateGmailAccess,
} from "./lib";
import { supabaseAdminClient } from "@amurex/supabase";
import { getOauth2Client } from "@amurex/web/lib";
import { google } from "googleapis";
import { GmailMessagePart, LabelRequestBody } from "./types";

export async function POST(req: Request) {
  try {
    const requestData = await req.json();
    const userId = requestData.userId;
    const useStandardColors = requestData.useStandardColors === true;
    const maxEmails = requestData.maxEmails || 20;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 },
      );
    }

    // initialize supabase admin client with service role key
    const adminSupabase = supabaseAdminClient(
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    );

    // Fetch user's Google credentials and email tagging settings using admin Supabase client
    const { data: userData, error: userError } = await adminSupabase
      .from("users")
      .select(
        "google_refresh_token, email_tagging_enabled, email_categories, google_cohort",
      )
      .eq("id", userId)
      .single();

    console.log("Processing emails for user:", userId);

    if (userError || !userData || !userData.google_refresh_token) {
      return NextResponse.json(
        {
          success: false,
          error: "Google credentials not found",
        },
        { status: 400 },
      );
    }

    if (!userData?.email_tagging_enabled) {
      return NextResponse.json(
        {
          success: false,
          error: "Email tagging is not enabled for this user",
        },
        { status: 400 },
      );
    }

    // Parse the email_categories JSON or use default values
    let enabledCategories = {
      to_respond: true,
      fyi: true,
      comment: true,
      notification: true,
      meeting_update: true,
      awaiting_reply: true,
      actioned: true,
    };

    try {
      if (userData.email_categories) {
        const parsedCategories =
          typeof userData.email_categories === "object"
            ? userData.email_categories
            : JSON.parse(userData.email_categories);

        if (parsedCategories.categories) {
          enabledCategories = parsedCategories.categories;
        }
      }
    } catch (parseError: unknown) {
      console.error("Error parsing email_categories:", parseError);
      // Continue with default categories
    }

    if (!userData.google_cohort) {
      return NextResponse.json(
        {
          success: false,
          error: "User has no assigned Google client cohort",
        },
        { status: 400 },
      );
    }

    const { data: clientData, error: clientError } = await adminSupabase
      .from("google_clients")
      .select("client_id, client_secret")
      .eq("id", userData.google_cohort)
      .single();

    if (clientError) {
      console.error("Error fetching client credentials:", clientError);
      return NextResponse.json(
        {
          success: false,
          error: "Error fetching OAuth client credentials",
        },
        { status: 500 },
      );
    }

    // Create the OAuth client with the fetched credentials
    const oauth2Client = getOauth2Client({ userData: clientData });

    oauth2Client.setCredentials({
      refresh_token: userData.google_refresh_token,
    });

    // Validate the OAuth token by making a simple API call
    const validation = await validateGmailAccess(oauth2Client);

    if (!validation.valid) {
      console.log(
        `Token validation failed for user ${userId}: ${validation.reason}`,
      );
      return NextResponse.json(
        {
          success: false,
          error: validation.message || "Token validation failed",
          errorType: validation.reason || "auth_error",
        },
        { status: 403 },
      );
    }

    // Token is valid, proceed with Gmail operations
    console.log(
      `Token validated for user ${userId}, proceeding with email processing`,
    );

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    try {
      const labels = await gmail.users.labels.list({ userId: "me" });
      const existingLabels: Record<string, string> = {};

      labels.data.labels?.forEach((label) => {
        if (label.name && label.id) {
          existingLabels[label.name] = label.id;
        }
      });

      // Create Amurex labels if they don't exist, but only for enabled categories
      const amurexLabels: Record<string, string> = {};

      for (const [labelName, colors] of Object.entries(GMAIL_COLORS)) {
        // Convert label name to the format used in enabledCategories (e.g., "to respond" -> "to_respond")
        const categoryKey = labelName.replace(/\s+/g, "_").toLowerCase();

        // Skip this label if it's not enabled (except for "none" which we always include)
        if (
          categoryKey in enabledCategories &&
          enabledCategories[categoryKey as keyof typeof enabledCategories] ===
            false
        ) {
          continue;
        }

        const fullLabelName = `Amurex/${labelName}`;

        if (existingLabels[fullLabelName]) {
          amurexLabels[labelName] = existingLabels[fullLabelName];
        } else {
          try {
            const requestBody: LabelRequestBody = {
              name: fullLabelName,
              labelListVisibility: "labelShow",
              messageListVisibility: "show",
            };

            // Only add colors if not explicitly disabled
            if (!useStandardColors) {
              requestBody.color = colors;
            }

            const newLabel = await gmail.users.labels.create({
              userId: "me",
              requestBody,
            });

            // TODO: add else block for this
            if (newLabel.data.id) {
              amurexLabels[labelName] = newLabel.data.id;
            }
          } catch (labelError: any) {
            if (
              labelError.status === 403 ||
              (labelError.response && labelError.response.status === 403)
            ) {
              // Permission error
              return NextResponse.json(
                {
                  success: false,
                  error:
                    "Insufficient Gmail permissions. Please disconnect and reconnect your Google account with the necessary permissions.",
                  errorType: "insufficient_permissions",
                },
                { status: 403 },
              );
            } else if (
              labelError.status === 400 ||
              (labelError.response && labelError.response.status === 400)
            ) {
              console.error(
                "Color error for label",
                fullLabelName,
                labelError.message || labelError,
              );

              try {
                const newLabel = await gmail.users.labels.create({
                  userId: "me",
                  requestBody: {
                    name: fullLabelName,
                    labelListVisibility: "labelShow",
                    messageListVisibility: "show",
                    // No color specified this time
                  },
                });

                // TODO: add if block for this
                if (newLabel.data.id) {
                  amurexLabels[labelName] = newLabel.data.id;
                }
              } catch (retryError: any) {
                console.error(
                  "Failed to create label even without color:",
                  retryError,
                );
                // Continue with the loop but don't add this label
              }
            } else {
              console.error("Unexpected error creating label:", labelError);
              // Continue with the loop but don't add this label
            }
          }
        }
      }

      // Fetch recent unread emails - fetch more for storage
      const messages = await gmail.users.messages.list({
        userId: "me",
        q: "-category:promotions -in:sent", // Include both read and unread emails, excluding promotions and sent mail
        maxResults: maxEmails, // Fetch requested amount of emails (or 20) every 15 minutes or when requested
      });

      if (!messages.data.messages || messages.data.messages.length === 0) {
        return NextResponse.json({
          success: true,
          message: "No new emails to process",
          processed: 0,
        });
      }

      // Create a set of already processed message IDs to avoid duplicates
      const { data: processedEmails, error: processedError } =
        await adminSupabase
          .from("emails")
          .select("message_id")
          .eq("user_id", userId)
          .order("received_at", { ascending: false });

      const processedMessageIds = new Set();

      if (!processedError && processedEmails) {
        processedEmails.forEach((email) => {
          processedMessageIds.add(email.message_id);
        });
      }

      console.log(
        `Found ${processedMessageIds.size} already processed emails for user ${userId}`,
      );

      // Process each message to check for Amurex labels before full processing
      const messagesToProcess = [];
      let skippedAlreadyProcessed = 0;
      let skippedAlreadyLabeled = 0;

      // First pass: Check which messages need processing (only skip if both in database AND has Amurex label)
      for (const message of messages.data.messages) {
        let skipThisMessage = false;

        // Check if in database
        const isInDatabase = processedMessageIds.has(message.id);

        // Get the message to check labels (only if it's in the database)
        let hasAmurexLabel = false;

        if (isInDatabase) {
          const fullMessageResponse = await gmail.users.messages.get({
            userId: "me",
            id: message.id as string,
            format: "minimal", // Use minimal format to reduce data transfer
          });

          // Check if it has an Amurex label
          hasAmurexLabel = !!(
            fullMessageResponse.data.labelIds &&
            fullMessageResponse.data.labelIds.some((labelId) => {
              // Get the actual label name for this ID if it exists
              const matchingLabels = labels.data.labels?.filter(
                (label) => label.id === labelId,
              );
              if (matchingLabels && matchingLabels.length > 0) {
                return matchingLabels[0]?.name?.includes("Amurex/");
              }
              return false;
            })
          );

          // Only skip if BOTH conditions are true
          if (isInDatabase && hasAmurexLabel) {
            skipThisMessage = true;
            skippedAlreadyProcessed++;
          }
        }

        // If we should skip this message, continue to the next one
        if (skipThisMessage) {
          continue;
        }

        // If we get here, the message needs processing
        messagesToProcess.push(message);
      }

      // Update lot to be more accurate
      console.log(
        `Found ${messages.data.messages.length} emails, ${messagesToProcess.length} to process, ${skippedAlreadyProcessed} skipped (already in database AND labeled)`,
      );

      if (messagesToProcess.length === 0) {
        return NextResponse.json({
          success: true,
          message: "No new emails to process",
          processed: 0,
          skipped_already_processed: skippedAlreadyProcessed,
          skipped_already_labeled: skippedAlreadyLabeled,
        });
      }

      // Process each email
      const results = [];
      const categorizedCount = Math.min(20, messagesToProcess.length); // Only categorize the first 20
      let totalStoredCount = 0;
      let skippedPromotions = 0;
      let skippedSent = 0;

      for (let i = 0; i < messagesToProcess.length; i++) {
        const message = messagesToProcess[i];
        const shouldCategorize = i < categorizedCount; // Only categorize first 20 emails

        // Get the full message details for processing
        const fullMessage = await gmail.users.messages.get({
          userId: "me",
          id: message?.id as string,
        });

        // Skip promotions and sent emails
        const emailLabels = fullMessage.data.labelIds || [];
        if (emailLabels.includes("CATEGORY_PROMOTIONS")) {
          skippedPromotions++;
          continue;
        }

        if (emailLabels.includes("SENT")) {
          skippedSent++;
          continue;
        }

        const headers: Record<string, string> = {};
        fullMessage.data.payload?.headers?.forEach((header) => {
          if (header.name && header.value) {
            headers[header.name] = header.value;
          }
        });

        const subject = headers.Subject || "(No Subject)";
        const fromEmail = headers.From || "Unknown";
        const threadId = fullMessage.data.threadId || message?.id;
        // TODO: I've added "0" as a fallback in case the internalDate is null, not sure if it will fit the usecase
        const receivedAt = new Date(
          parseInt(fullMessage.data.internalDate || "0"),
        );
        const isRead = !fullMessage.data.labelIds?.includes("UNREAD");
        const snippet = fullMessage.data.snippet || "";

        // Check if the email already has an Amurex category label (only for emails we'll categorize)
        let alreadyLabeled = false;
        let category = "none";

        if (shouldCategorize) {
          // Create a reverse map of label IDs to label names for checking
          const labelIdToName: Record<string, string> = {};
          Object.entries(amurexLabels).forEach(([name, id]) => {
            labelIdToName[id] = name;
          });

          // Check if any of the email's labels are Amurex category labels
          for (const labelId of emailLabels) {
            if (labelIdToName[labelId]) {
              console.log(
                `Email already has Amurex label: ${labelIdToName[labelId]}`,
              );
              category = labelIdToName[labelId];
              alreadyLabeled = true;
              break;
            }
          }
        }

        // Skip categorization if email already has an Amurex label
        if (shouldCategorize && alreadyLabeled) {
          results.push({
            messageId: message?.id,
            subject,
            category: "already_labeled",
            success: true,
          });

          // Still store the email in database but continue to next email for categorization
          try {
            // TODO: I've added optional "" here, but I'm not sure if that's correct
            const wasStored = await storeEmailInDatabase(
              userId,
              message?.id || "",
              threadId || "",
              fromEmail,
              subject,
              "",
              receivedAt,
              isRead,
              snippet,
            );
            if (wasStored) {
              totalStoredCount++;
            }
          } catch (dbError) {
            console.error(
              "Database error while storing already labeled email:",
              dbError,
            );
          }

          continue;
        }

        // Extract email body
        let body = "";

        // Recursive function to extract text content from any part of the email
        function extractTextFromParts(
          part: GmailMessagePart | null | undefined,
        ): string {
          if (!part) return "";

          try {
            // If this part has plain text content, extract it
            if (part.mimeType === "text/plain" && part.body && part.body.data) {
              return Buffer.from(part.body.data, "base64").toString("utf-8");
            }

            // If this part has HTML content and we don't have plain text yet
            if (
              part.mimeType === "text/html" &&
              part.body &&
              part.body.data &&
              body === ""
            ) {
              // Convert HTML to plain text (simple version - strips tags)
              const htmlContent = Buffer.from(
                part.body.data,
                "base64",
              ).toString("utf-8");
              return htmlContent
                .replace(/<[^>]*>/g, " ")
                .replace(/\s+/g, " ")
                .trim();
            }

            // If this part has sub-parts, process them recursively
            if (part.parts && Array.isArray(part.parts)) {
              for (const subPart of part.parts) {
                const textContent = extractTextFromParts(subPart);
                if (textContent) {
                  return textContent;
                }
              }
            }
          } catch (extractError) {
            console.error(
              "Error extracting text from email part:",
              extractError,
            );
          }

          return "";
        }

        // Try to extract text from the email payload
        try {
          if (fullMessage.data.payload) {
            // If payload has direct parts
            if (
              fullMessage.data.payload.parts &&
              Array.isArray(fullMessage.data.payload.parts)
            ) {
              // First try to find text/plain parts
              for (const part of fullMessage.data.payload.parts) {
                const textContent = extractTextFromParts(
                  part as GmailMessagePart,
                );
                if (textContent) {
                  body = textContent;
                  break;
                }
              }
            }
            // If payload has direct body content
            else if (
              fullMessage.data.payload.body &&
              fullMessage.data.payload.body.data
            ) {
              body = Buffer.from(
                fullMessage.data.payload.body.data,
                "base64",
              ).toString("utf-8");
            }
            // If payload is multipart but structured differently
            else if (
              fullMessage.data.payload.mimeType &&
              fullMessage.data.payload.mimeType.startsWith("multipart/")
            ) {
              body = extractTextFromParts(
                fullMessage.data.payload as GmailMessagePart,
              );
            }
          }

          // If we still don't have body content, use the snippet as a fallback
          if (!body && fullMessage.data.snippet) {
            body = fullMessage.data.snippet.replace(
              /&#(\d+);/g,
              (match, dec) => {
                return String.fromCharCode(dec);
              },
            );
            body += " [Extracted from snippet]";
          }

          // Always ensure we have some content
          if (!body) {
            body = "[No content could be extracted]";
            console.log(
              `Could not extract content for email ${message?.id}, using placeholder`,
            );
          } else {
            console.log(
              `Successfully extracted ${body.length} characters of content for email ${message?.id}`,
            );
          }
        } catch (bodyExtractionError: any) {
          console.error("Error extracting email body:", bodyExtractionError);
          body =
            "[Error extracting content: " +
            (bodyExtractionError.message || "Unknown error") +
            "]";
        }

        // Only use Groq to categorize selected emails
        if (shouldCategorize) {
          const truncatedBody =
            body.length > 1500 ? body.substring(0, 1500) + "..." : body;
          category = await categorizeWithAI(
            fromEmail,
            subject,
            truncatedBody,
            enabledCategories,
          );

          // Map the lowercase category to the proper case in GMAIL_COLORS
          let labelToApply = null;

          if (category && category !== "") {
            // Find the matching label name with proper case from GMAIL_COLORS
            labelToApply = Object.keys(GMAIL_COLORS).find(
              (key) => key.toLowerCase() === category.toLowerCase(),
            );

            // Apply the label only if a matching category was found
            if (labelToApply && amurexLabels[labelToApply] && message?.id) {
              await gmail.users.messages.modify({
                userId: "me",
                id: message.id,
                requestBody: {
                  addLabelIds: [amurexLabels[labelToApply]],
                },
              } as any);
            }
          }

          // Add to processed results (only for categorized emails)
          results.push({
            messageId: message?.id,
            subject,
            category: category || "uncategorized",
            success: true,
          });
        }

        // Store email in the database
        try {
          const wasStored = await storeEmailInDatabase(
            userId,
            message?.id || "",
            threadId || "",
            fromEmail,
            subject,
            body,
            receivedAt,
            isRead,
            snippet,
          );
          if (wasStored) {
            totalStoredCount++;
          }
        } catch (dbError) {
          console.error("Database error while storing email:", dbError);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Emails processed successfully",
        processed: results.length,
        total_stored: totalStoredCount,
        total_found: messagesToProcess.length,
        skipped_promotions: skippedPromotions,
        skipped_sent: skippedSent,
        skipped_already_processed: skippedAlreadyProcessed,
        skipped_already_labeled: skippedAlreadyLabeled,
        results,
      });
    } catch (gmailError: any) {
      // Handle Gmail API error
      if (
        gmailError.status === 403 ||
        (gmailError.response && gmailError.response.status === 403)
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Insufficient Gmail permissions. Please disconnect and reconnect your Google account with the necessary permissions.",
            errorType: "insufficient_permissions",
          },
          { status: 403 },
        );
      }
      throw gmailError; // Re-throw if it's not a permissions issue
    }
  } catch (error: any) {
    console.error("Error processing emails:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: "Error processing emails: " + errorMessage,
      },
      { status: 500 },
    );
  }
}
