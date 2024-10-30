import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { google } from 'googleapis';
import OpenAI from 'openai';
import crypto from 'crypto';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const openai = new OpenAI(process.env.OPENAI_API_KEY);

export async function POST(req) {
  try {
    const { session } = await req.json();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('google_access_token, google_refresh_token')
      .eq('id', session.user.id)
      .single();

    if (userError || !user.google_access_token) {
      return NextResponse.json({ success: false, error: 'Google Docs not connected' }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: user.google_access_token,
      refresh_token: user.google_refresh_token
    });

    const docs = google.docs({ version: 'v1', auth: oauth2Client });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // List documents
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.document'",
      fields: 'files(id, name)',
      pageSize: 10
    });

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const results = [];
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
      const { data: newDoc } = await supabase
        .from('documents')
        .insert({
          title: file.name,
          text: content,
          url: `https://docs.google.com/document/d/${file.id}`,
          source: 'google_docs',
          user_id: session.user.id,
          checksum: checksum
        })
        .select()
        .single();

      const sections = await textSplitter.createDocuments([content]);

      for (const section of sections) {
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: section.pageContent,
        });

        await supabase
          .from('page_sections')
          .insert({
            document_id: newDoc.id,
            content: section.pageContent,
            token_count: section.pageContent.split(/\s+/).length,
            embedding: embeddingResponse.data[0].embedding
          });
      }

      results.push({ id: newDoc.id, status: 'created' });
    }

    return NextResponse.json({ success: true, documents: results });
  } catch (error) {
    console.error('Error importing Google Docs:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
