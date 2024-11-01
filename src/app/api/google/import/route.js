import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { google } from 'googleapis';
import OpenAI from 'openai';
import crypto from 'crypto';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const openai = new OpenAI(process.env.OPENAI_API_KEY);

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

    return NextResponse.json({ success: true, documents: results });
  } catch (error) {
    console.error('Error importing Google Docs:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
