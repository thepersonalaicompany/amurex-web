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
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a helpful assistant that generates relevant tags for a given text. Provide the tags as a comma-separated list without numbers or bullet points." },
      { role: "user", content: `Generate 3 relevant tags for the following text, separated by commas:\n\n${text.substring(0, 1000)}` }
    ],
  });
  return tagsResponse.choices[0].message.content.split(',').map(tag => tag.trim());
}

export async function POST(req) {
  try {
    const { userId, accessToken } = await req.json();
    let userEmail = req.headers.get('x-user-email');
    
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
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();
      
      if (userError || !userData?.email) {
        throw new Error('User email not found');
      }
      
      userEmail = userData.email;
    }

    // Process the documents
    const results = await processGoogleDocs({ id: userId }, supabase);
    
    // Send email notification
    if (results.length > 0) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: userEmail,
          importResults: results
        }),
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Import complete. Check your email for details.',
      documents: results.map(result => ({
        id: result.id,
        title: result.title || `Document ${result.id}`,
        status: result.status
      }))
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
      .eq('id', session.id)
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
        .eq('id', session.id);

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
      chunkSize: 200,
      chunkOverlap: 50,
    });

    const results = [];
    for (const file of response.data.files) {
      try {
        const doc = await docs.documents.get({ documentId: file.id });
        
        // Add null checks for document content
        if (!doc.data?.body?.content) {
          console.warn(`Empty or invalid document content for ${file.name} (${file.id})`);
          results.push({ 
            id: file.id, 
            status: 'error',
            title: file.name,
            error: 'Empty or invalid document content'
          });
          continue;
        }

        const content = doc.data.body.content
          .filter(item => item?.paragraph?.elements)
          .map(item => item.paragraph.elements
            .filter(e => e?.textRun?.content)
            .map(e => e.textRun.content)
            .join('')
          )
          .filter(Boolean)
          .join('\n');

        if (!content) {
          console.warn(`No text content found in document ${file.name} (${file.id})`);
          results.push({ 
            id: file.id, 
            status: 'error',
            title: file.name,
            error: 'No text content found'
          });
          continue;
        }

        const checksum = crypto.createHash('sha256').update(content).digest('hex');

        console.log("checksum:", checksum);
        console.log("user id?", session.id);
        
        // Check for existing document
        const { data: existingDoc } = await supabase
          .from('documents')
          .select('id')
          .eq('user_id', session.id)
          .eq('checksum', checksum)
          .single();

        console.log("existing doc?", existingDoc);
        console.log("existing doc type?", typeof existingDoc);

        if (existingDoc !== null) {
          console.log("existing doc found!");
          results.push({ 
            id: existingDoc.id, 
            status: 'existing',
            title: file.name 
          });
          continue;
        }


        // Generate tags and chunks
        const tags = await generateTags(content);
        const chunks = await textSplitter.createDocuments([content]);
        const chunkTexts = chunks.map(chunk => chunk.pageContent);
        
        // Generate embeddings using Mistral API
        const embeddingResponse = await fetch('https://api.mistral.ai/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
          },
          body: JSON.stringify({
            input: chunkTexts,
            model: "mistral-embed",
            encoding_format: "float"
          })
        });

        const embedData = await embeddingResponse.json();
        // Format embeddings as arrays for Postgres vector type
        const embeddings = embedData.data.map(item => `[${item.embedding.join(',')}]`);
        
        // Calculate and format centroid as array for Postgres
        const centroid = `[${calculateCentroid(embedData.data.map(item => item.embedding)).join(',')}]`;

        // Insert document with properly formatted vectors
        const { data: newDoc, error: newDocError } = await supabase
          .from('documents')
          .insert({
            title: file.name,
            text: content,
            url: `https://docs.google.com/document/d/${file.id}`,
            type: 'google_docs',
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
              documentId: file.id
            }
          })
          .select()
          .single();

        results.push({ 
          id: newDoc.id, 
          status: 'created',
          title: file.name 
        });

      } catch (docError) {
        console.error(`Error processing document ${file.name} (${file.id}):`, docError);
        results.push({ 
          id: file.id, 
          status: 'error',
          title: file.name,
          error: docError.message
        });
        continue;
      }
    }

    return results;

  } catch (error) {
    console.error('Error in processGoogleDocs:', error);
    throw error;
  }
}

function calculateCentroid(embeddings) {
  if (!embeddings || embeddings.length === 0) {
    throw new Error('No embeddings provided to calculate centroid');
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
