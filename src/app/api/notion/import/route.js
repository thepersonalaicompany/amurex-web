import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { Client } from '@notionhq/client';
import OpenAI from 'openai';
import crypto from 'crypto';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const openai = new OpenAI(process.env.OPENAI_API_KEY);

export const config = {
  maxDuration: 300 // 5 minutes
};


export async function POST(req) {
  try {
    const { session } = await req.json();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

      const { data: user, error: userError } = await supabase
        .from('users')
      .select('notion_access_token')
      .eq('id', session.user.id)
        .single();

    
    if (userError || !user.notion_access_token) {
      console.log('User Error:', userError);
      return NextResponse.json({ success: false, error: 'Notion not connected' }, { status: 400 });
    }


    const notion = new Client({ auth: user.notion_access_token });
    const response = await notion.search({
      filter: { property: 'object', value: 'page' }
    });

    console.log('Response:', response.results.length);


    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    console.log('Response:', response.results.length);

    const results = [];
    for (const page of response.results) {
      const pageContent = await fetchNotionPageContent(notion, page.id);
      const tags = await generateTags(pageContent);
      const checksum = crypto.createHash('sha256').update(pageContent).digest('hex');

      // Check for existing page
      const { data: existingPage } = await supabase
        .from('documents')
        .select('id')
        .eq('checksum', checksum)
        .single();

      if (existingPage) {
        results.push({ id: existingPage.id, status: 'existing' });
        continue;
      }

      // Create new page
      const { data: newPage, error: pageError } = await supabase
        .from('documents')
        .insert({
          url: page.url,
          title: page.properties.title?.title[0]?.plain_text || 'Untitled',
          text: pageContent,
          tags: tags,
          user_id: session.user.id,
          type: 'notion',
          checksum,
          created_at: new Date().toISOString(),
          meta: {
            title: page.properties.title?.title[0]?.plain_text || 'Untitled',
            type: 'notion',
            created_at: new Date().toISOString(),
            tags: tags
          },
        })
        .select()
        .single();

      if (pageError) { 
        console.error('Error creating page:', pageError, page);
        throw pageError; 
      }

      // Split and process content
      const sections = await textSplitter.createDocuments([pageContent]);

      for (const section of sections) {
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: section.pageContent,
        });

        await supabase
          .from('page_sections')
          .insert({
            document_id: newPage.id,
            context: section.pageContent,
            token_count: section.pageContent.split(/\s+/).length,
            embedding: embeddingResponse.data[0].embedding
          });
      }

      results.push({ id: newPage.id, status: 'created' });
    }

    console.log('results', results);
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Error importing from Notion:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function fetchNotionPageContent(notion, pageId) {
  const response = await notion.blocks.children.list({ block_id: pageId });
  return response.results
    .filter(block => block.type === 'paragraph' && block.paragraph.rich_text.length > 0)
    .map(block => block.paragraph.rich_text[0].plain_text)
    .join('\n');
}

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

async function generateEmbeddings(text) {
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text.substring(0, 8000),
  });
  return embeddingResponse.data[0].embedding;
}
