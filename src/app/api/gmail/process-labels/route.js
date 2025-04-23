import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { google } from 'googleapis';
import OpenAI from 'openai';
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
  "to respond": { "backgroundColor": "#fb4c2f", "textColor": "#ffffff" },  // Red
  "FYI": { "backgroundColor": "#16a766", "textColor": "#ffffff" },         // Green
  "comment": { "backgroundColor": "#ffad47", "textColor": "#ffffff" },     // Orange
  "notification": { "backgroundColor": "#42d692", "textColor": "#ffffff" }, // Light Green
  "meeting update": { "backgroundColor": "#8e63ce", "textColor": "#ffffff" }, // Purple (changed from #9334e9)
  "awaiting reply": { "backgroundColor": "#ffad47", "textColor": "#ffffff" }, // Orange
  "actioned": { "backgroundColor": "#4986e7", "textColor": "#ffffff" },    // Blue
  "promotions": { "backgroundColor": "#2da2bb", "textColor": "#ffffff" },   // Teal
  "none": { "backgroundColor": "#999999", "textColor": "#ffffff" }         // Gray
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
  try {
    // Build the system prompt based on enabled categories
    let systemPrompt = "You are an email classifier. Classify the email into one of these categories (but don't come up with any other new categories):\n";
    let categoryMap = {};
    let index = 1;
    
    // Add enabled categories to the prompt and mapping
    for (const [category, enabled] of Object.entries(enabledCategories)) {
      if (enabled) {
        const formattedCategory = category.replace(/_/g, ' '); // Convert to_respond to "to respond"
        systemPrompt += `${index} = ${formattedCategory}\n`;
        categoryMap[index] = formattedCategory;
        index++;
      }
    }
    
    // Always include "none" as the last option
    systemPrompt += `${index} = none\n`;
    categoryMap[index] = "none";
    
    systemPrompt += `\nRespond ONLY with the number (1-${index}). Use category ${index} (none) if the email doesn't fit into any of the other categories. Do not include any other text, just the single digit number.`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Email from: ${fromEmail}\nSubject: ${subject}\n\nBody: ${body}`
        }
      ],
      max_tokens: 100,
      temperature: 0.3
    });

    // Get the raw response and convert to a number
    const rawResponse = response.choices[0].message.content.trim();
    console.log(`Raw Groq category response:`, rawResponse);
    
    // Extract just the first digit from the response
    const numberMatch = rawResponse.match(/\d+/);
    const categoryNumber = numberMatch ? parseInt(numberMatch[0]) : null;
    
    console.log("Extracted category number:", categoryNumber);
    
    // Look up the category by number
    if (categoryNumber && categoryMap[categoryNumber]) {
      const category = categoryMap[categoryNumber];
      console.log("Mapped to category:", category);
      return category;
    } else {
      // Default to "none" if we couldn't get a valid number
      console.log(`Invalid category number "${categoryNumber}", using default`);
      return "none";
    }
  } catch (error) {
    console.error(`Error categorizing with Groq:`, error);
    // Default to "none" on error
    return "none";
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
      .from('users')
      .select('google_cohort')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    console.log("User cohort:", userData.google_cohort);

    // Then, fetch the client credentials from google_clients table
    const { data: clientData, error: clientError } = await adminSupabase
      .from('google_clients')
      .select('client_id, client_secret')
      .eq('id', userData.google_cohort)
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
    if (!text || text.trim() === '') {
      console.warn("Empty text provided for embedding");
      return null;
    }
    
    // Truncate text if it's too long (Mistral has token limits)
    const truncatedText = text.length > 8000 ? text.substring(0, 8000) : text;
    
    const response = await mistral.embeddings.create({
      model: "mistral-embed",
      input: truncatedText,
    });
    
    if (response && response.data && response.data[0] && response.data[0].embedding) {
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
    .from('emails')
    .select('message_id')
    .eq('user_id', userId);
    
  if (fetchError) {
    console.error('Error fetching existing emails:', fetchError);
    return [];
  }
  
  // Create a Set of existing message IDs for faster lookup
  const existingMessageIds = new Set();
  if (existingEmails && existingEmails.length > 0) {
    existingEmails.forEach(email => existingMessageIds.add(email.message_id));
  }
  
  console.log(`Found ${existingMessageIds.size} existing emails for user ${userId}`);
  
  for (const email of emails) {
    try {
      // Skip if email already exists in database
      if (existingMessageIds.has(email.id)) {
        console.log(`Skipping email ${email.id} - already in database`);
        results.push({ id: email.id, status: 'skipped', reason: 'already_exists' });
        continue;
      }
      
      // Check if email already has an Amurex label
      const hasAmurexLabel = email.labelIds && email.labelIds.some(labelId => 
        labelId.startsWith('Label_') && labelId.includes('Amurex')
      );
      
      if (hasAmurexLabel) {
        console.log(`Skipping email ${email.id} - already has Amurex label`);
        results.push({ id: email.id, status: 'skipped', reason: 'already_labeled' });
        continue;
      }
      
      // Extract email content
      let content = '';
      
      // Check for plain text content
      if (email.payload.body && email.payload.body.data) {
        content = Buffer.from(email.payload.body.data, 'base64').toString('utf-8');
      } 
      // Check for multipart content
      else if (email.payload.parts) {
        // Try to find HTML or plain text parts
        for (const part of email.payload.parts) {
          if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
            if (part.body && part.body.data) {
              const partContent = Buffer.from(part.body.data, 'base64').toString('utf-8');
              content += partContent;
            }
          }
        }
      }
      
      // Get email headers
      const headers = email.payload.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(h => h.name === 'From')?.value || '';
      const to = headers.find(h => h.name === 'To')?.value || '';
      const date = headers.find(h => h.name === 'Date')?.value || '';
      
      console.log(`Processing email: ${subject} (Content length: ${content.length})`);
      
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
        processed_at: new Date().toISOString()
      };
      
      // Insert into database
      const { data, error } = await supabase
        .from('emails')
        .insert(emailData)
        .select();
        
      if (error) {
        console.error('Error storing email:', error);
        results.push({ id: email.id, status: 'error', error: error.message });
      } else {
        results.push({ id: email.id, status: 'success' });
      }
    } catch (error) {
      console.error(`Error processing email ${email.id}:`, error);
      results.push({ id: email.id, status: 'error', error: error.message });
    }
  }
  
  return results;
}

// Update storeEmailInDatabase function to include embeddings
async function storeEmailInDatabase(userId, messageId, threadId, sender, subject, content, receivedAt, isRead, snippet) {
  // Check if email already exists in the database
  const { data: existingEmail } = await adminSupabase
    .from('emails')
    .select('id')
    .eq('user_id', userId)
    .eq('message_id', messageId)
    .maybeSingle();
    
  if (!existingEmail) {
    // Generate embeddings for the email content or at least the subject
    let embedding = null;
    let textToEmbed = "";
    
    if (content && content.trim() !== '') {
      // Combine subject and content for better semantic representation
      textToEmbed = `Subject: ${subject}\n\n${content}`;
    } else if (subject && subject.trim() !== '') {
      // If no content, at least embed the subject
      textToEmbed = `Subject: ${subject}`;
      console.log(`No content for email ${messageId}, embedding subject only`);
    } else if (snippet && snippet.trim() !== '') {
      // If no subject or content, try using the snippet
      textToEmbed = snippet;
      console.log(`No subject or content for email ${messageId}, embedding snippet only`);
    }
    
    // Only try to generate embeddings if we have some text
    if (textToEmbed.trim() !== '') {
      embedding = await generateEmbeddings(textToEmbed);
    }
    
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
    
    // Add embedding if available
    if (embedding) {
      emailData.embedding = embedding;
    }
    
    console.log(`Storing email in database:`, {
      message_id: messageId,
      thread_id: threadId,
      subject: subject,
      content_length: content ? content.length : 0,
      has_embedding: embedding ? true : false,
      embedded_text: textToEmbed ? (textToEmbed.length > 50 ? textToEmbed.substring(0, 50) + '...' : textToEmbed) : 'none'
    });
    
    const { error: insertError } = await adminSupabase
      .from('emails')
      .insert(emailData);
      
    if (insertError) {
      console.error("Error inserting email into database:", insertError);
      
      // Check if the error is related to the category or is_categorized column
      if (insertError.message && (insertError.message.includes('category') || insertError.message.includes('is_categorized'))) {
        // Try again without those fields
        delete emailData.category;
        delete emailData.is_categorized;
        
        const { error: retryError } = await adminSupabase
          .from('emails')
          .insert(emailData);
          
        if (retryError) {
          console.error("Error inserting email with simplified fields:", retryError);
        } else {
          console.log(`Email ${messageId} stored in database with simplified fields`);
        }
      }
    } else {
      console.log(`Email ${messageId} stored in database successfully`);
    }
  }
  return !existingEmail; // Return true if we inserted a new email
}

export async function POST(req) {
  try {
    const requestData = await req.json();
    const userId = requestData.userId;
    const useStandardColors = requestData.useStandardColors === true;
    const accessToken = requestData.accessToken;
    const numEmailsToProcess = requestData.numEmailsToProcess || 20;

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    // Update the admin Supabase client with the access token if provided
    let currentAdminSupabase = adminSupabase;
    if (accessToken) {
      currentAdminSupabase = createClient(
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
    }

    // Fetch user's Google credentials and email tagging settings using admin Supabase client
    const { data: userData, error: userError } = await currentAdminSupabase
      .from("users")
      .select("google_refresh_token, email_tagging_enabled, email_categories")
      .eq("id", userId)
      .single();

    console.log("User data:", userData);

    if (userError || !userData || !userData.google_refresh_token) {
      return NextResponse.json({ 
        success: false, 
        error: "Google credentials not found" 
      }, { status: 400 });
    }

    if (!userData.email_tagging_enabled) {
      return NextResponse.json({ 
        success: false, 
        error: "Email tagging is not enabled for this user" 
      }, { status: 400 });
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
      promotions: true
    };

    try {
      if (userData.email_categories) {
        const parsedCategories = typeof userData.email_categories === 'object' 
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

    console.log("User's enabled categories:", enabledCategories);

    // Get the appropriate OAuth client based on user signup date
    const oauth2Client = await getOAuth2Client(userId);

    oauth2Client.setCredentials({
      refresh_token: userData.google_refresh_token
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    try {
      // Get existing labels
      const labels = await gmail.users.labels.list({ userId: 'me' });
      const existingLabels = {};
      
      labels.data.labels.forEach(label => {
        existingLabels[label.name] = label.id;
      });

      // Create Amurex labels if they don't exist, but only for enabled categories
      const amurexLabels = {};
      
      for (const [labelName, colors] of Object.entries(GMAIL_COLORS)) {
        // Convert label name to the format used in enabledCategories (e.g., "to respond" -> "to_respond")
        const categoryKey = labelName.replace(/\s+/g, '_');
        
        // Skip this label if it's not enabled (except for "none" which we always include)
        if (labelName !== "none" && enabledCategories[categoryKey] === false) {
          console.log(`Skipping disabled category: ${labelName}`);
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
              messageListVisibility: "show"
            };
            
            // Only add colors if not explicitly disabled
            if (!useStandardColors) {
              requestBody.color = colors;
            }
            
            const newLabel = await gmail.users.labels.create({
              userId: 'me',
              requestBody
            });
            
            amurexLabels[labelName] = newLabel.data.id;
          } catch (labelError) {
            if (labelError.status === 403 || (labelError.response && labelError.response.status === 403)) {
              // Permission error
              return NextResponse.json({ 
                success: false, 
                error: "Insufficient Gmail permissions. Please disconnect and reconnect your Google account with the necessary permissions.",
                errorType: "insufficient_permissions"
              }, { status: 403 });
            } else if (labelError.status === 400 || (labelError.response && labelError.response.status === 400)) {
              // Color palette error - try without color
              console.error("Color error for label", fullLabelName, labelError.message || labelError);
              
              try {
                const newLabel = await gmail.users.labels.create({
                  userId: 'me',
                  requestBody: {
                    name: fullLabelName,
                    labelListVisibility: "labelShow",
                    messageListVisibility: "show"
                    // No color specified this time
                  }
                });
                
                amurexLabels[labelName] = newLabel.data.id;
              } catch (retryError) {
                console.error("Failed to create label even without color:", retryError);
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
        userId: 'me',
        q: 'is:unread',
        maxResults: numEmailsToProcess
      });
      
      if (!messages.data.messages || messages.data.messages.length === 0) {
        return NextResponse.json({ 
          success: true, 
          message: "No new emails to process", 
          processed: 0 
        });
      }

      // Create a set of already processed message IDs to avoid duplicates
      const { data: processedEmails, error: processedError } = await currentAdminSupabase
        .from('emails')
        .select('message_id')
        .eq('user_id', userId);
        
      const processedMessageIds = new Set();
      
      if (!processedError && processedEmails) {
        processedEmails.forEach(email => {
          processedMessageIds.add(email.message_id);
        });
      }

      // Filter out already processed messages
      const newMessages = messages.data.messages.filter(message => 
        !processedMessageIds.has(message.id)
      );
      
      console.log(`Found ${messages.data.messages.length} unread emails, ${newMessages.length} new to process`);
      
      if (newMessages.length === 0) {
        return NextResponse.json({ 
          success: true, 
          message: "No new emails to process", 
          processed: 0 
        });
      }

      // Process each email
      const results = [];
      const categorizedCount = Math.min(20, newMessages.length); // Only categorize the first 20
      let totalStoredCount = 0;
      
      for (let i = 0; i < newMessages.length; i++) {
        const message = newMessages[i];
        const shouldCategorize = i < categorizedCount; // Only categorize first 20 emails
        
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id
        });
        
        const headers = {};
        fullMessage.data.payload.headers.forEach(header => {
          headers[header.name] = header.value;
        });
        
        const subject = headers.Subject || "(No Subject)";
        const fromEmail = headers.From || "Unknown";
        const threadId = fullMessage.data.threadId || message.id;
        const receivedAt = new Date(parseInt(fullMessage.data.internalDate));
        const isRead = !fullMessage.data.labelIds.includes('UNREAD');
        const snippet = fullMessage.data.snippet || "";
        
        // Check if the email already has an Amurex category label (only for emails we'll categorize)
        let alreadyLabeled = false;
        let category = "none";
        
        if (shouldCategorize) {
          const emailLabels = fullMessage.data.labelIds || [];
          
          // Create a reverse map of label IDs to label names for checking
          const labelIdToName = {};
          Object.entries(amurexLabels).forEach(([name, id]) => {
            labelIdToName[id] = name;
          });
          
          // Check if any of the email's labels are Amurex category labels
          for (const labelId of emailLabels) {
            if (labelIdToName[labelId]) {
              console.log(`Email already has Amurex label: ${labelIdToName[labelId]}`);
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
            success: true
          });
          
          // Still store the email in database but continue to next email for categorization
          try {
            const wasStored = await storeEmailInDatabase(userId, message.id, threadId, fromEmail, subject, "", receivedAt, isRead, snippet);
            if (wasStored) {
              totalStoredCount++;
            }
          } catch (dbError) {
            console.error("Database error while storing already labeled email:", dbError);
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
              return Buffer.from(part.body.data, 'base64').toString('utf-8');
            }
            
            // If this part has HTML content and we don't have plain text yet
            if (part.mimeType === "text/html" && part.body && part.body.data && body === "") {
              // Convert HTML to plain text (simple version - strips tags)
              const htmlContent = Buffer.from(part.body.data, 'base64').toString('utf-8');
              return htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
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
            console.error("Error extracting text from email part:", extractError);
          }
          
          return "";
        }
        
        // Try to extract text from the email payload
        try {
          if (fullMessage.data.payload) {
            // If payload has direct parts
            if (fullMessage.data.payload.parts && Array.isArray(fullMessage.data.payload.parts)) {
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
            else if (fullMessage.data.payload.body && fullMessage.data.payload.body.data) {
              body = Buffer.from(fullMessage.data.payload.body.data, 'base64').toString('utf-8');
            }
            // If payload is multipart but structured differently
            else if (fullMessage.data.payload.mimeType && fullMessage.data.payload.mimeType.startsWith('multipart/')) {
              body = extractTextFromParts(fullMessage.data.payload);
            }
          }
          
          // If we still don't have body content, use the snippet as a fallback
          if (!body && fullMessage.data.snippet) {
            body = fullMessage.data.snippet.replace(/&#(\d+);/g, (match, dec) => {
              return String.fromCharCode(dec);
            });
            body += " [Extracted from snippet]";
          }
          
          // Always ensure we have some content
          if (!body) {
            body = "[No content could be extracted]";
            console.log(`Could not extract content for email ${message.id}, using placeholder`);
          } else {
            console.log(`Successfully extracted ${body.length} characters of content for email ${message.id}`);
          }
        } catch (bodyExtractionError) {
          console.error("Error extracting email body:", bodyExtractionError);
          body = "[Error extracting content: " + (bodyExtractionError.message || "Unknown error") + "]";
        }
        
        // Only use Groq to categorize selected emails
        if (shouldCategorize) {
          const truncatedBody = body.length > 1500 ? body.substring(0, 1500) + "..." : body;
          category = await categorizeWithAI(fromEmail, subject, truncatedBody, enabledCategories);
          
          // Apply the label only if the category is not "none" and the label exists
          if (category !== "none" && amurexLabels[category]) {
            await gmail.users.messages.modify({
              userId: 'me',
              id: message.id,
              requestBody: {
                addLabelIds: [amurexLabels[category]]
              }
            });
          }
          
          // Add to processed results (only for categorized emails)
          results.push({
            messageId: message.id,
            subject,
            category,
            success: true
          });
        }
        
        // Store email in the database
        try {
          const wasStored = await storeEmailInDatabase(userId, message.id, threadId, fromEmail, subject, body, receivedAt, isRead, snippet);
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
        total_found: newMessages.length,
        results 
      });
    } catch (gmailError) {
      // Handle Gmail API errors
      if (gmailError.status === 403 || (gmailError.response && gmailError.response.status === 403)) {
        return NextResponse.json({ 
          success: false, 
          error: "Insufficient Gmail permissions. Please disconnect and reconnect your Google account with the necessary permissions.",
          errorType: "insufficient_permissions"
        }, { status: 403 });
      }
      throw gmailError; // Re-throw if it's not a permissions issue
    }
    
  } catch (error) {
    console.error("Error processing emails:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Error processing emails: " + (error.message || "Unknown error") 
    }, { status: 500 });
  }
} 