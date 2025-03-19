import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { google } from 'googleapis';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
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

// Helper function to categorize emails using OpenAI
async function categorizeWithOpenAI(fromEmail, subject, body) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an email classifier. Classify the email into one of these categories:\n1 = to respond\n2 = FYI\n3 = comment\n4 = notification\n5 = meeting update\n6 = awaiting reply\n7 = actioned\n8 = promotions\n9 = none\n\nRespond ONLY with the number (1-9). Use category 9 (none) if the email doesn't fit into any of the other categories. Do not include any other text, just the single digit number."
        },
        {
          role: "user",
          content: `Email from: ${fromEmail}\nSubject: ${subject}\n\nBody: ${body}`
        }
      ],
      max_tokens: 10,
      temperature: 0.3
    });

    // Get the raw response and convert to a number
    const rawResponse = response.choices[0].message.content.trim();
    console.log("Raw OpenAI category response:", rawResponse);
    
    // Extract just the first digit from the response
    const numberMatch = rawResponse.match(/\d/);
    const categoryNumber = numberMatch ? parseInt(numberMatch[0]) : null;
    
    console.log("Extracted category number:", categoryNumber);
    
    // Map from number to category name
    const categoryMap = {
      1: "to respond",
      2: "FYI",
      3: "comment",
      4: "notification", 
      5: "meeting update",
      6: "awaiting reply",
      7: "actioned",
      8: "promotions",
      9: "none"
    };
    
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
    console.error("Error categorizing with OpenAI:", error);
    // Default to "none" on error
    return "none";
  }
}

export async function POST(req) {
  try {
    const requestData = await req.json();
    const userId = requestData.userId;
    const useStandardColors = requestData.useStandardColors === true;

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    // Fetch user's Google credentials
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("google_refresh_token, email_tagging_enabled")
      .eq("id", userId)
      .single();

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

    // Set up OAuth2 credentials
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

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

      // Create Amurex labels if they don't exist
      const amurexLabels = {};
      
      for (const [labelName, colors] of Object.entries(GMAIL_COLORS)) {
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
        q: 'is:unread',  // Simplified query without processed label filter
        maxResults: 100  // Fetch up to 100 emails
      });
      
      if (!messages.data.messages || messages.data.messages.length === 0) {
        return NextResponse.json({ 
          success: true, 
          message: "No new emails to process", 
          processed: 0 
        });
      }

      // Create a set of already processed message IDs to avoid duplicates
      const { data: processedEmails, error: processedError } = await supabase
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
        
        // Only use OpenAI to categorize selected emails
        if (shouldCategorize) {
          const truncatedBody = body.length > 1500 ? body.substring(0, 1500) + "..." : body;
          category = await categorizeWithOpenAI(fromEmail, subject, truncatedBody);
          
          // Apply the label only if the category is not "none"
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
      
      // Helper function to store email in database
      async function storeEmailInDatabase(userId, messageId, threadId, sender, subject, content, receivedAt, isRead, snippet) {
        // Check if email already exists in the database
        const { data: existingEmail } = await supabase
          .from('emails')
          .select('id')
          .eq('user_id', userId)
          .eq('message_id', messageId)
          .maybeSingle();
          
        if (!existingEmail) {
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
            content_length: content ? content.length : 0
          });
          
          const { error: insertError } = await supabase
            .from('emails')
            .insert(emailData);
            
          if (insertError) {
            console.error("Error inserting email into database:", insertError);
            
            // Check if the error is related to the category or is_categorized column
            if (insertError.message && (insertError.message.includes('category') || insertError.message.includes('is_categorized'))) {
              // Try again without those fields
              delete emailData.category;
              delete emailData.is_categorized;
              
              const { error: retryError } = await supabase
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