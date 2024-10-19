import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { Client } from '@notionhq/client';
import { google } from 'googleapis';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI(process.env.OPENAI_API_KEY);
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/documents.readonly'],
});

export async function POST(req) {
  const { url, title, text } = await req.json();
  // const text = await fetchDocumentText(url);
  console.log(url, title, text);

  try {
    // Generate tags using OpenAI
    const tagsResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant that generates relevant tags for a given text." },
        { role: "user", content: `Generate 20 relevant tags for the following text:\n\n${text.substring(0, 1000)}` }
      ],
    });
    const tags = tagsResponse.choices[0].message.content.split(',').map(tag => tag.trim());

    // Generate embeddings using OpenAI
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text.substring(0, 8000),
    });
    const embeddings = embeddingResponse.data[0].embedding;

    // Store in Supabase
    const { data, error } = await supabase
      .from('documents')
      .insert({ url, title, text, tags, embeddings })
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, documentId: data[0].id });
  } catch (error) {
    console.error('Error processing document:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function fetchDocumentText(url) {
  if (url.includes('notion.so')) {
    return await fetchNotionText(url);
  } else if (url.includes('docs.google.com')) {
    return await fetchGoogleDocsText(url);
  } else {
    throw new Error('Unsupported document type');
  }
}

async function fetchNotionText(url) {
  const pageId = url.split('-').pop();
  const response = await notion.blocks.children.list({ block_id: pageId });
  return response.results
    .filter(block => block.type === 'paragraph' && block.paragraph.rich_text.length > 0)
    .map(block => block.paragraph.rich_text[0].plain_text)
    .join('\n');
}

async function fetchGoogleDocsText(url) {
  const docs = google.docs({ version: 'v1', auth });
  const docId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)[1];
  const response = await docs.documents.get({ documentId: docId });
  return response.data.body.content
    .filter(element => element.paragraph)
    .map(element => element.paragraph.elements.map(e => e.textRun.content).join(''))
    .join('\n');
}
