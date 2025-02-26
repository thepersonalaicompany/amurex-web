import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { google } from 'googleapis';
import OpenAI from 'openai';
import crypto from 'crypto';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI(process.env.OPENAI_API_KEY);

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

async function generateTags(text) {
  const tagsResponse = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are a helpful assistant that generates relevant tags for a given text. Provide the tags as a comma-separated list without numbers or bullet points." },
      { role: "user", content: `Generate 20 relevant tags for the following text, separated by commas:\n\n${text.substring(0, 1000)}` }
    ],
  });
  return tagsResponse.choices[0].message.content.split(',').map(tag => tag.trim());
}

export async function POST(req) {
  try {
    const { userId, accessToken } = await req.json();
    
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

    // Start processing in the background
    processGoogleDocs({ user: { id: userId, email: req.headers.get('x-user-email') } }, supabase)
      .catch(error => {
        console.error('Background processing failed:', error);
      });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Import started. You will receive an email when complete.' 
    });

  } catch (error) {
    console.error('Error initiating Google Docs import:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function processGoogleDocs(session, supabase) {
  try {
    // Get user's Google tokens
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('google_access_token, google_refresh_token, google_token_expiry')
      .eq('id', session.user.id)
      .single();

    if (userError || !user.google_access_token) {
      console.error('Google credentials not found:', userError);
      throw new Error('Google Docs not connected');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Set credentials including expiry
    oauth2Client.setCredentials({
      access_token: user.google_access_token,
      refresh_token: user.google_refresh_token,
      expiry_date: new Date(user.google_token_expiry).getTime()
    });

    // Force token refresh if it's expired or about to expire
    if (!user.google_token_expiry || new Date(user.google_token_expiry) <= new Date()) {
      console.log('Token expired or missing expiry, refreshing...');
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Update tokens in database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          google_access_token: credentials.access_token,
          google_refresh_token: credentials.refresh_token || user.google_refresh_token,
          google_token_expiry: new Date(credentials.expiry_date).toISOString()
        })
        .eq('id', session.user.id);

      if (updateError) {
        console.error('Error updating refreshed tokens:', updateError);
        throw new Error('Failed to update Google credentials');
      }
    }

    const docs = google.docs({ version: 'v1', auth: oauth2Client });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // List documents
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.document'",
      fields: 'files(id, name, modifiedTime, mimeType)',
      pageSize: 10
    });

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const results = [];
    console.log('Response:', response.data.files.length);
    for (const file of response.data.files) {
      const doc = await docs.documents.get({ documentId: file.id });
      const content = doc.data.body.content
        .map(item => item.paragraph?.elements?.map(e => e.textRun?.content).join(''))
        .filter(Boolean)
        .join('\n');

      const checksum = crypto.createHash('sha256').update(content).digest('hex');

      // Check for existing document
      const { data: existingDoc } = await supabase
        .from('documents')
        .select('id')
        .eq('checksum', checksum)
        .single();

      if (existingDoc) {
        results.push({ id: existingDoc.id, status: 'existing' });
        continue;
      }

      // Generate embeddings and store new document
      const tags = await generateTags(content);
      console.log('Tags:', tags);

      const { data: newDoc, error: newDocError } = await supabase
        .from('documents')
        .insert({
          title: file.name,
          text: content,
          url: `https://docs.google.com/document/d/${file.id}`,
          type: 'google_docs',
          user_id: session.user.id,
          checksum: checksum,
          tags: tags,
          created_at: new Date().toISOString(),
          meta: {
            lastModified: file.modifiedTime,
            mimeType: file.mimeType,
            documentId: file.id
          }
        })
        .select()
        .single();

      const sections = await textSplitter.createDocuments([content]);

      for (const section of sections) {
        console.log("iterating");
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: section.pageContent,
        });

        try {
          const { data: newSection, error: newSectionError } = await supabase
            .from('page_sections')
            .insert({
              document_id: newDoc.id,
              context: section.pageContent,
              token_count: section.pageContent.split(/\s+/).length,
              embedding: embeddingResponse.data[0].embedding
            });

          console.log('New Section:', newSection);
          console.log('New Section Error:', newSectionError);
        } catch (error) {
          console.error('Error inserting section:', error);
        }
      }

      results.push({ id: newDoc.id, status: 'created' });
    }

    // When complete, send email notification
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail: session.user.email,
        importResults: results
      }),
    });

  } catch (error) {
    console.error('Error in processGoogleDocs:', error);
    
    // Send error notification email
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: session.user.email,
          importResults: [],
          error: error.message
        }),
      });
    } catch (emailError) {
      console.error('Error sending error notification:', emailError);
    }

    throw error;
  }
}
