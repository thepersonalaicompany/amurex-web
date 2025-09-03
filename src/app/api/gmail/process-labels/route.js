import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { google } from "googleapis";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// Create admin Supabase client globally
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Groq client using OpenAI SDK
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// Initialize Mistral client using OpenAI SDK
const mistral = new OpenAI({
  apiKey: process.env.MISTRAL_API_KEY,
  baseURL: "https://api.mistral.ai/v1",
});

// Gmail label colors
const GMAIL_COLORS = {
  // Using Gmail's standard palette colors:
  // See https://developers.google.com/gmail/api/reference/rest/v1/users.labels for allowed colors
  "to respond": { backgroundColor: "#fb4c2f", textColor: "#ffffff" }, // Red
  FYI: { backgroundColor: "#16a766", textColor: "#ffffff" }, // Green
  comment: { backgroundColor: "#ffad47", textColor: "#ffffff" }, // Orange
  notification: { backgroundColor: "#42d692", textColor: "#ffffff" }, // Light Green
  "meeting update": { backgroundColor: "#8e63ce", textColor: "#ffffff" }, // Purple (changed from #9334e9)
  "awaiting reply": { backgroundColor: "#ffad47", textColor: "#ffffff" }, // Orange
  actioned: { backgroundColor: "#4986e7", textColor: "#ffffff" }, // Blue
};

// Standard Gmail colors for reference (uncomment if needed):
// const GMAIL_STANDARD_COLORS = {
//   "berry": { "backgroundColor": "#dc2127", "textColor": "#ffffff" },
//   "red": { "backgroundColor": "#fb4c2f", "textColor": "#ffffff" },
//   "orange": { "backgroundColor": "#ffad47", "textColor": "#ffffff" },
//   "yellow": { "backgroundColor": "#fad165", "textColor": "#000000" },
//   "green": { "backgroundColor": "#16a766", "textColor": "#ffffff" },
//   "teal": { "backgroundColor": "#2da2bb", "textColor": "#ffffff" },
//   "blue": { "backgroundColor": "#4986e7", "textColor": "#ffffff" },
//   "purple": { "backgroundColor": "#8e63ce", "textColor": "#ffffff" },
//   "gray": { "backgroundColor": "#999999", "textColor": "#ffffff" },
//   "brown": { "backgroundColor": "#b65775", "textColor": "#ffffff" }
// };

// Helper function to categorize emails using Groq
async function categorizeWithAI(fromEmail, subject, body, enabledCategories) {
  const modelName = process.env.MODEL_NAME;
  const clientMode = process.env.CLIENT_MODE;
  try {
    // Build the system prompt based on enabled categories
    let systemPrompt =
      "You are an email classifier. Classify the email into one of these categories (but don't come up with any other new categories):\n";
    let categoryMap = {};
    let index = 1;

    // Track if we have any enabled categories
    let hasEnabledCategories = false;

    // Add enabled categories to the prompt and mapping
    for (const [category, enabled] of Object.entries(enabledCategories)) {
      if (enabled) {
        hasEnabledCategories = true;
        const formattedCategory = category.replace(/_/g, " "); // Convert to_respond to "to respond"
        systemPrompt += `${index} = ${formattedCategory}\n`;
        categoryMap[index] = formattedCategory;
        index++;
      }
    }

    // If no categories are enabled, return empty string to indicate no categorization
    if (!hasEnabledCategories) {
      console.log(
        "No categories enabled for this user, skipping categorization"
      );
      return "";
    }

    systemPrompt += `\nRespond ONLY with the number (1-${index - 1}). If the email doesn't fit into any of these categories, respond with 0. Do not include any other text, just the single digit number.`;

    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Email from: ${fromEmail}\nSubject: ${subject}\n\nBody: ${body}`,
      },
    ];

    let response;

    if (clientMode === "local" && modelName?.length > 0) {
      // Call local Ollama API
      const req_response = await fetch(`${process.env.NEXT_PUBLIC_LOCAL_AI_MODEL_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelName, 
          messages: messages,
          stream: false,
          max_tokens: 20,
          temperature: 0.3,
        }),
      });

      const data = await req_response.json();

      // Format the response to match the OpenAI structure we're expecting
      response = {
        choices: [
          {
            message: {
              content: data.message.content,
            },
          },
        ],
      };
    } else {
      response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Email from: ${fromEmail}\nSubject: ${subject}\n\nBody: ${body}`,
          },
        ],
        max_tokens: 20,
        temperature: 0.3,
      });
    }

    // Get the raw response and convert to a number
    const rawResponse = response.choices[0].message.content.trim();

    // Extract just the first digit from the response
    const numberMatch = rawResponse.match(/\d+/);
    const categoryNumber = numberMatch ? parseInt(numberMatch[0]) : null;

    // Look up the category by number (0 means no category fits)
    if (categoryNumber && categoryNumber > 0 && categoryMap[categoryNumber]) {
      const category = categoryMap[categoryNumber];
      return category;
    } else {
      // Return empty string if no category fits or if the number is invalid
      console.log(
        `No matching category (${categoryNumber}), skipping categorization`
      );
      return "";
    }
  } catch (error) {
    console.error(`Error categorizing with Groq:`, error);
    // Return empty string on error to indicate no categorization
    return "";
  }
}

// Set up OAuth2 credentials from user data
async function getOAuth2Client(userId) {
  // Create admin Supabase client
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log("Getting OAuth credentials for user:", userId);
    // First, get the user's google_cohort
    const { data: userData, error: userError } = await adminSupabase
      .from("users")
      .select("google_cohort")
      .eq("id", userId)
      .single();

    if (userError) throw userError;

    console.log("User cohort:", userData.google_cohort);

    // Then, fetch the client credentials from google_clients table
    const { data: clientData, error: clientError } = await adminSupabase
      .from("google_clients")
      .select("client_id, client_secret")
      .eq("id", userData.google_cohort)
      .single();

    if (clientError) throw clientError;

    // Use the fetched OAuth credentials with redirect URI from env
    return new google.auth.OAuth2(
      clientData.client_id,
      clientData.client_secret,
      process.env.GOOGLE_REDIRECT_URI
    );
  } catch (error) {
    console.error("Error getting OAuth credentials:", error);
    // Fallback to default credentials if there's an error
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }
}

// Helper function to generate embeddings using Mistral
async function generateEmbeddings(text) {
  try {
    // Ensure we have some text to embed
    if (!text || text.trim() === "") {
      console.warn("Empty text provided for embedding");
      return null;
    }

    // Truncate text if it's too long (Mistral has token limits)
    const truncatedText = text.length > 8000 ? text.substring(0, 8000) : text;
    const misttralApiKey = process.env.MISTRAL_API_KEY || ''

    let response;
    if (misttralApiKey?.length == 0) {
      response = await fetch("/api/embed", {
        method: "GET",
        body: JSON.stringify({text: truncatedText}),
        headers: {
          "Content-Type": "application/json",
        },
      });
    } else {
      response = await mistral.embeddings.create({
        model: "mistral-embed",
        input: truncatedText,
      });
    }
    if (
      response &&
      response.data &&
      response.data[0] &&
      response.data[0].embedding
    ) {
      return response.data[0].embedding;
    } else {
      console.error("Invalid embedding response structure:", response);
      return null;
    }

  } catch (error) {
    console.error("Error generating embeddings:", error);
    return null;
  }
}

// Update the processEmails function to skip already processed emails
async function processEmails(emails, userId, labelId, labelName, labelColor) {
  const results = [];

  // First, get all existing message IDs for this user to avoid duplicates
  const { data: existingEmails, error: fetchError } = await supabase
    .from("emails")
    .select("message_id")
    .eq("user_id", userId);

  if (fetchError) {
    console.error("Error fetching existing emails:", fetchError);
    return [];
  }

  // Create a Set of existing message IDs for faster lookup
  const existingMessageIds = new Set();
  if (existingEmails && existingEmails.length > 0) {
    existingEmails.forEach((email) => existingMessageIds.add(email.message_id));
  }

  console.log(
    `Found ${existingMessageIds.size} existing emails for user ${userId}`
  );

  for (const email of emails) {
    try {
      // Skip if email already exists in database
      if (existingMessageIds.has(email.id)) {
        console.log(`Skipping email ${email.id} - already in database`);
        results.push({
          id: email.id,
          status: "skipped",
          reason: "already_exists",
        });
        continue;
      }

      // Check if email already has an Amurex label
      const hasAmurexLabel =
        email.labelIds &&
        email.labelIds.some(
          (labelId) =>
            labelId.startsWith("Label_") && labelId.includes("Amurex")
        );

      if (hasAmurexLabel) {
        console.log(`Skipping email ${email.id} - already has Amurex label`);
        results.push({
          id: email.id,
          status: "skipped",
          reason: "already_labeled",
        });
        continue;
      }

      // Extract email content
      let content = "";

      // Check for plain text content
      if (email.payload.body && email.payload.body.data) {
        content = Buffer.from(email.payload.body.data, "base64").toString(
          "utf-8"
        );
      }
      // Check for multipart content
      else if (email.payload.parts) {
        // Try to find HTML or plain text parts
        for (const part of email.payload.parts) {
          if (part.mimeType === "text/plain" || part.mimeType === "text/html") {
            if (part.body && part.body.data) {
              const partContent = Buffer.from(
                part.body.data,
                "base64"
              ).toString("utf-8");
              content += partContent;
            }
          }
        }
      }

      // Get email headers
      const headers = email.payload.headers || [];
      const subject =
        headers.find((h) => h.name === "Subject")?.value || "No Subject";
      const from = headers.find((h) => h.name === "From")?.value || "";
      const to = headers.find((h) => h.name === "To")?.value || "";
      const date = headers.find((h) => h.name === "Date")?.value || "";

      console.log(
        `Processing email: ${subject} (Content length: ${content.length})`
      );

      // Store email in database
      const emailData = {
        message_id: email.id,
        thread_id: email.threadId,
        user_id: userId,
        label_id: labelId,
        label_name: labelName,
        label_color: labelColor,
        subject: subject,
        from: from,
        to: to,
        date: date,
        content: content,
        content_length: content.length,
        processed_at: new Date().toISOString(),
      };

      // Insert into database
      const { data, error } = await supabase
        .from("emails")
        .insert(emailData)
        .select();

      if (error) {
        console.error("Error storing email:", error);
        results.push({ id: email.id, status: "error", error: error.message });
      } else {
        results.push({ id: email.id, status: "success" });
      }
    } catch (error) {
      console.error(`Error processing email ${email.id}:`, error);
      results.push({ id: email.id, status: "error", error: error.message });
    }
  }

  return results;
}

// Update storeEmailInDatabase function to include embeddings
async function storeEmailInDatabase(
  userId,
  messageId,
  threadId,
  sender,
  subject,
  content,
  receivedAt,
  isRead,
  snippet
) {
  // Check if email already exists in the database
  const { data: existingEmail } = await adminSupabase
    .from("emails")
    .select("id")
    .eq("user_id", userId)
    .eq("message_id", messageId)
    .maybeSingle();

  if (!existingEmail) {
    // Generate embeddings for the email content or at least the subject
    // let embedding = null;
    // let textToEmbed = "";

    // if (content && content.trim() !== '') {
    //   // Combine subject and content for better semantic representation
    //   textToEmbed = `Subject: ${subject}\n\n${content}`;
    // } else if (subject && subject.trim() !== '') {
    //   // If no content, at least embed the subject
    //   textToEmbed = `Subject: ${subject}`;
    //   console.log(`No content for email ${messageId}, embedding subject only`);
    // } else if (snippet && snippet.trim() !== '') {
    //   // If no subject or content, try using the snippet
    //   textToEmbed = snippet;
    //   console.log(`No subject or content for email ${messageId}, embedding snippet only`);
    // }

    // // Only try to generate embeddings if we have some text
    // if (textToEmbed.trim() !== '') {
    //   embedding = await generateEmbeddings(textToEmbed);
    // }

    // Insert email into database
    const emailData = {
      user_id: userId,
      message_id: messageId,
      thread_id: threadId,
      sender: sender,
      subject: subject,
      content: content,
      received_at: receivedAt.toISOString(),
      created_at: new Date().toISOString(),
      is_read: isRead,
      snippet: snippet,
    };

    console.log(`Storing email in database:`, {
      message_id: messageId,
      thread_id: threadId,
      subject: subject,
      content_length: content ? content.length : 0,
      has_embedding: false,
    });

    const { error: insertError } = await adminSupabase
      .from("emails")
      .insert(emailData);

    if (insertError) {
      console.error("Error inserting email into database:", insertError);

      // Check if the error is related to the category or is_categorized column
      if (
        insertError.message &&
        (insertError.message.includes("category") ||
          insertError.message.includes("is_categorized"))
      ) {
        // Try again without those fields
        delete emailData.category;
        delete emailData.is_categorized;

        const { error: retryError } = await adminSupabase
          .from("emails")
          .insert(emailData);

        if (retryError) {
          console.error(
            "Error inserting email with simplified fields:",
            retryError
          );
        } else {
          console.log(
            `Email ${messageId} stored in database with simplified fields`
          );
        }
      }
    } else {
      console.log(`Email ${messageId} stored in database successfully`);
    }
  }
  return !existingEmail; // Return true if we inserted a new email
}

// Helper function to validate token by making a simple API call
async function validateGmailAccess(oauth2Client) {
  try {
    console.log(`Validating Gmail access with OAuth client`);

    // Create Gmail API client
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Make API calls that require the specific scopes we need:
    // 1. Try to get labels (requires gmail.labels)
    const labels = await gmail.users.labels.list({ userId: "me" });

    // 2. Try to modify a label (requires gmail.modify)
    // Use a dummy modification on an existing label just to test permissions
    if (labels.data.labels && labels.data.labels.length > 0) {
      const testLabelId = labels.data.labels[0].id;
      // We're not actually changing anything, just checking permissions
      await gmail.users.labels.get({
        userId: "me",
        id: testLabelId,
      });
    } else {
      // If no labels, we need to check permissions another way for gmail.modify
      // Try to get a message to test gmail.readonly
      const messages = await gmail.users.messages.list({
        userId: "me",
        maxResults: 1,
      });

      if (messages.data.messages && messages.data.messages.length > 0) {
        // Try to get a message (requires gmail.readonly)
        await gmail.users.messages.get({
          userId: "me",
          id: messages.data.messages[0].id,
        });
      }
    }

    // If we get here, the token is valid and has the required scopes
    return { valid: true };
  } catch (error) {
    console.error(`Token validation failed:`, error);

    // Check for specific error types that indicate permission issues
    const errorMessage = error.message || "";
    const errorCode = error.code || "";
    const status = error.status || (error.response && error.response.status);

    if (
      status === 401 ||
      status === 403 ||
      errorMessage.includes("insufficient authentication") ||
      errorMessage.includes("invalid_grant") ||
      errorMessage.includes("invalid credentials") ||
      errorMessage.includes("insufficient permission") ||
      errorCode === "EAUTH"
    ) {
      return {
        valid: false,
        reason: "insufficient_permissions",
        message:
          "User needs to reconnect their Google account with gmail.readonly, gmail.modify, and gmail.labels permissions",
      };
    }

    // For other types of errors (network, etc.), we'll still return invalid but with a different reason
    return {
      valid: false,
      reason: "error",
      message: errorMessage || "Unknown error",
    };
  }
}

export async function POST(req) {
  try {
    const requestData = await req.json();
    const userId = requestData.userId;
    const useStandardColors = true;
    const maxEmails = requestData.maxEmails || 20;
    const googleClientId = requestData.googleClientId;
    const googleClientSecret = requestData.googleClientSecret;
    const refreshToken = requestData.refreshToken;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Declare variables that will be used later
    let oauth2Client;
    let enabledCategories = {
      to_respond: true,
      fyi: true,
      comment: true,
      notification: true,
      meeting_update: true,
      awaiting_reply: true,
      actioned: true,
    };

    // Check if credentials are provided in the request body
    if (googleClientId && googleClientSecret && refreshToken) {
      console.log(
        "Using credentials provided in request body for user:",
        userId
      );

      // Fetch user's email tagging settings using admin Supabase client
      const { data: userData, error: userError } = await adminSupabase
        .from("users")
        .select("email_tagging_enabled, email_categories")
        .eq("id", userId)
        .single();

      if (userError || !userData) {
        return NextResponse.json(
          {
            success: false,
            error: "User settings not found",
          },
          { status: 400 }
        );
      }

      if (!userData.email_tagging_enabled) {
        return NextResponse.json(
          {
            success: false,
            error: "Email tagging is not enabled for this user",
          },
          { status: 400 }
        );
      }

      // Parse the email_categories JSON or use default values
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
      } catch (parseError) {
        console.error("Error parsing email_categories:", parseError);
        // Continue with default categories
      }

      // Create the OAuth client with the provided credentials
      oauth2Client = new google.auth.OAuth2(
        googleClientId,
        googleClientSecret,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });
    } else {
      // Fallback to the original database-based credential fetching
      console.log(
        "No credentials in request body, fetching from database for user:",
        userId
      );

      // Fetch user's Google credentials and email tagging settings using admin Supabase client
      const { data: userData, error: userError } = await adminSupabase
        .from("users")
        .select(
          "google_refresh_token, email_tagging_enabled, email_categories, google_cohort"
        )
        .eq("id", userId)
        .single();

      if (userError || !userData || !userData.google_refresh_token) {
        return NextResponse.json(
          {
            success: false,
            error: "Google credentials not found",
          },
          { status: 400 }
        );
      }

      if (!userData.email_tagging_enabled) {
        return NextResponse.json(
          {
            success: false,
            error: "Email tagging is not enabled for this user",
          },
          { status: 400 }
        );
      }

      // Parse the email_categories JSON or use default values
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
      } catch (parseError) {
        console.error("Error parsing email_categories:", parseError);
        // Continue with default categories
      }

      // Fetch client credentials for this user's cohort
      if (!userData.google_cohort) {
        return NextResponse.json(
          {
            success: false,
            error: "User has no assigned Google client cohort",
          },
          { status: 400 }
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
          { status: 500 }
        );
      }

      // Create the OAuth client with the fetched credentials
      oauth2Client = new google.auth.OAuth2(
        clientData.client_id,
        clientData.client_secret,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        refresh_token: userData.google_refresh_token,
      });
    }

    // Validate the OAuth token by making a simple API call
    const validation = await validateGmailAccess(oauth2Client);

    if (!validation.valid) {
      console.log(
        `Token validation failed for user ${userId}: ${validation.reason}`
      );
      return NextResponse.json(
        {
          success: false,
          error: validation.message || "Token validation failed",
          errorType: validation.reason || "auth_error",
        },
        { status: 403 }
      );
    }

    // Token is valid, proceed with Gmail operations
    console.log(
      `Token validated for user ${userId}, proceeding with email processing`
    );

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    try {
      // Get existing labels
      const labels = await gmail.users.labels.list({ userId: "me" });
      const existingLabels = {};

      labels.data.labels.forEach((label) => {
        existingLabels[label.name] = label.id;
      });

      // Create Amurex labels if they don't exist, but only for enabled categories
      const amurexLabels = {};

      for (const [labelName, colors] of Object.entries(GMAIL_COLORS)) {
        // Convert label name to the format used in enabledCategories (e.g., "to respond" -> "to_respond")
        const categoryKey = labelName.replace(/\s+/g, "_").toLowerCase();

        // Skip this label if it's not enabled (except for "none" which we always include)
        if (enabledCategories[categoryKey] === false) {
          continue;
        }

        const fullLabelName = `Amurex/${labelName}`;

        if (existingLabels[fullLabelName]) {
          amurexLabels[labelName] = existingLabels[fullLabelName];
        } else {
          try {
            const requestBody = {
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

            amurexLabels[labelName] = newLabel.data.id;
          } catch (labelError) {
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
                { status: 403 }
              );
            } else if (
              labelError.status === 400 ||
              (labelError.response && labelError.response.status === 400)
            ) {
              // Color palette error - try without color
              console.error(
                "Color error for label",
                fullLabelName,
                labelError.message || labelError
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

                amurexLabels[labelName] = newLabel.data.id;
              } catch (retryError) {
                console.error(
                  "Failed to create label even without color:",
                  retryError
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
        `Found ${processedMessageIds.size} already processed emails for user ${userId}`
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
            id: message.id,
            format: "minimal", // Use minimal format to reduce data transfer
          });

          // Check if it has an Amurex label
          hasAmurexLabel =
            fullMessageResponse.data.labelIds &&
            fullMessageResponse.data.labelIds.some((labelId) => {
              // Get the actual label name for this ID if it exists
              const matchingLabels = labels.data.labels.filter(
                (label) => label.id === labelId
              );
              if (matchingLabels.length > 0) {
                return matchingLabels[0].name.includes("Amurex/");
              }
              return false;
            });

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

      // Update log to be more accurate
      console.log(
        `Found ${messages.data.messages.length} emails, ${messagesToProcess.length} to process, ${skippedAlreadyProcessed} skipped (already in database AND labeled)`
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
          id: message.id,
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

        const headers = {};
        fullMessage.data.payload.headers.forEach((header) => {
          headers[header.name] = header.value;
        });

        const subject = headers.Subject || "(No Subject)";
        const fromEmail = headers.From || "Unknown";
        const threadId = fullMessage.data.threadId || message.id;
        const receivedAt = new Date(parseInt(fullMessage.data.internalDate));
        const isRead = !fullMessage.data.labelIds.includes("UNREAD");
        const snippet = fullMessage.data.snippet || "";

        // Check if the email already has an Amurex category label (only for emails we'll categorize)
        let alreadyLabeled = false;
        let category = "none";

        if (shouldCategorize) {
          // Create a reverse map of label IDs to label names for checking
          const labelIdToName = {};
          Object.entries(amurexLabels).forEach(([name, id]) => {
            labelIdToName[id] = name;
          });

          // Check if any of the email's labels are Amurex category labels
          for (const labelId of emailLabels) {
            if (labelIdToName[labelId]) {
              console.log(
                `Email already has Amurex label: ${labelIdToName[labelId]}`
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
            messageId: message.id,
            subject,
            category: "already_labeled",
            success: true,
          });

          // Still store the email in database but continue to next email for categorization
          try {
            const wasStored = await storeEmailInDatabase(
              userId,
              message.id,
              threadId,
              fromEmail,
              subject,
              "",
              receivedAt,
              isRead,
              snippet
            );
            if (wasStored) {
              totalStoredCount++;
            }
          } catch (dbError) {
            console.error(
              "Database error while storing already labeled email:",
              dbError
            );
          }

          continue;
        }

        // Extract email body
        let body = "";

        // Recursive function to extract text content from any part of the email
        function extractTextFromParts(part) {
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
                "base64"
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
              extractError
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
                const textContent = extractTextFromParts(part);
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
                "base64"
              ).toString("utf-8");
            }
            // If payload is multipart but structured differently
            else if (
              fullMessage.data.payload.mimeType &&
              fullMessage.data.payload.mimeType.startsWith("multipart/")
            ) {
              body = extractTextFromParts(fullMessage.data.payload);
            }
          }

          // If we still don't have body content, use the snippet as a fallback
          if (!body && fullMessage.data.snippet) {
            body = fullMessage.data.snippet.replace(
              /&#(\d+);/g,
              (match, dec) => {
                return String.fromCharCode(dec);
              }
            );
            body += " [Extracted from snippet]";
          }

          // Always ensure we have some content
          if (!body) {
            body = "[No content could be extracted]";
            console.log(
              `Could not extract content for email ${message.id}, using placeholder`
            );
          } else {
            console.log(
              `Successfully extracted ${body.length} characters of content for email ${message.id}`
            );
          }
        } catch (bodyExtractionError) {
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
            enabledCategories
          );

          // Map the lowercase category to the proper case in GMAIL_COLORS
          let labelToApply = null;

          if (category && category !== "") {
            // Find the matching label name with proper case from GMAIL_COLORS
            labelToApply = Object.keys(GMAIL_COLORS).find(
              (key) => key.toLowerCase() === category.toLowerCase()
            );

            // Apply the label only if a matching category was found
            if (labelToApply && amurexLabels[labelToApply]) {
              await gmail.users.messages.modify({
                userId: "me",
                id: message.id,
                requestBody: {
                  addLabelIds: [amurexLabels[labelToApply]],
                },
              });
            }
          }

          // Add to processed results (only for categorized emails)
          results.push({
            messageId: message.id,
            subject,
            category: category || "uncategorized",
            success: true,
          });
        }

        // Store email in the database
        try {
          const wasStored = await storeEmailInDatabase(
            userId,
            message.id,
            threadId,
            fromEmail,
            subject,
            body,
            receivedAt,
            isRead,
            snippet
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
    } catch (gmailError) {
      // Handle Gmail API errors
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
          { status: 403 }
        );
      }
      throw gmailError; // Re-throw if it's not a permissions issue
    }
  } catch (error) {
    console.error("Error processing emails:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error processing emails: " + (error.message || "Unknown error"),
      },
      { status: 500 }
    );
  }
}
