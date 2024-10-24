import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Client } from '@notionhq/client';
import OpenAI from 'openai';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI(process.env.OPENAI_API_KEY);

export async function POST(req) {
  try {
    const { session } = await req.json(); // Extract session from request body
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('notion_access_token')
      .eq('id', session.user.id)
      .single();

    if (userError || !user.notion_access_token) {
      return NextResponse.json({ success: false, error: 'Notion not connected' }, { status: 400 });
    }

    const notion = new Client({ auth: user.notion_access_token });

    const response = await notion.search({
      filter: {
        property: 'object',
        value: 'page'
      }
    });
    
    console.log("Total length", response.results.length);

    for (const page of response.results.slice(0, 2)) {
      const pageContent = await fetchNotionPageContent(notion, page.id);
      const tags = await generateTags(pageContent);
      const embeddings = await generateEmbeddings(pageContent);
      console.log("User ID", session.user.id);

      try {
        await supabase
          .from('documents')
        .insert({
          url: page.url,
          title: page.properties.title?.title[0]?.plain_text || 'Untitled',
          text: pageContent,
          tags: tags,
          embeddings: embeddings,
          user_id: session.user.id,
          type: 'notion'
        });
        console.log("Document inserted");
        console.log(pageContent);
        console.log(tags);
      } catch (error) {
        console.error('Error inserting document:', error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error importing Notion pages:', error);
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
      { role: "system", content: "You are a helpful assistant that generates relevant tags for a given text." },
      { role: "user", content: `Generate 20 relevant tags for the following text:\n\n${text.substring(0, 1000)}` }
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
