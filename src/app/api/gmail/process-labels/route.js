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
  "to respond": { "backgroundColor": "#fb4c2f", "textColor": "#ffffff" },
  "FYI": { "backgroundColor": "#16a766", "textColor": "#ffffff" },
  "comment": { "backgroundColor": "#ffad47", "textColor": "#ffffff" },
  "notification": { "backgroundColor": "#42d692", "textColor": "#ffffff" },
  "meeting update": { "backgroundColor": "#9334e9", "textColor": "#ffffff" },
  "awaiting reply": { "backgroundColor": "#ffd6c7", "textColor": "#000000" },
  "actioned": { "backgroundColor": "#a0eade", "textColor": "#000000" },
  "promotions": { "backgroundColor": "#a8c1e5", "textColor": "#000000" }
};

// Helper function to categorize emails using OpenAI
async function categorizeWithOpenAI(fromEmail, subject, body) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an email categorization assistant. Categorize the email into one of these categories: to respond, FYI, comment, notification, meeting update, awaiting reply, actioned, promotions. Return ONLY the category name, nothing else."
        },
        {
          role: "user",
          content: `Email from: ${fromEmail}\nSubject: ${subject}\n\nBody: ${body}`
        }
      ],
      max_tokens: 20,
      temperature: 0.3
    });

    const category = response.choices[0].message.content.trim().toLowerCase();
    
    // Make sure the category is one of our predefined categories
    if (GMAIL_COLORS[category]) {
      return category;
    } else {
      // Default to "FYI" if category doesn't match our options
      console.log(`Category "${category}" not found in predefined categories, using default`);
      return "FYI";
    }
  } catch (error) {
    console.error("Error categorizing with OpenAI:", error);
    // Default to "FYI" on error
    return "FYI";
  }
}

export async function POST(req) {
  try {
    const requestData = await req.json();
    const userId = requestData.userId;

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
            const newLabel = await gmail.users.labels.create({
              userId: 'me',
              requestBody: {
                name: fullLabelName,
                labelListVisibility: "labelShow",
                messageListVisibility: "show",
                color: colors
              }
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
            }
            throw labelError; // Re-throw if it's not a permissions issue
          }
        }
      }

      // Fetch recent unread emails
      const messages = await gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread -label:Amurex/processed',
        maxResults: 10
      });
      
      if (!messages.data.messages || messages.data.messages.length === 0) {
        return NextResponse.json({ 
          success: true, 
          message: "No new emails to process", 
          processed: 0 
        });
      }

      // Process each email
      const results = [];
      
      for (const message of messages.data.messages) {
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
        
        // Extract email body
        let body = "";
        
        if (fullMessage.data.payload.parts) {
          for (const part of fullMessage.data.payload.parts) {
            if (part.mimeType === "text/plain" && part.body.data) {
              body = Buffer.from(part.body.data, 'base64').toString('utf-8');
              break;
            }
          }
        } else if (fullMessage.data.payload.body.data) {
          body = Buffer.from(fullMessage.data.payload.body.data, 'base64').toString('utf-8');
        }
        
        const truncatedBody = body.length > 1500 ? body.substring(0, 1500) + "..." : body;

        // Use OpenAI to categorize the email
        const category = await categorizeWithOpenAI(fromEmail, subject, truncatedBody);
        
        // Apply the label
        if (amurexLabels[category]) {
          await gmail.users.messages.modify({
            userId: 'me',
            id: message.id,
            requestBody: {
              addLabelIds: [amurexLabels[category]]
            }
          });
        }
        
        // Add to processed
        results.push({
          messageId: message.id,
          subject,
          category,
          success: true
        });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: "Emails processed successfully", 
        processed: results.length, 
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