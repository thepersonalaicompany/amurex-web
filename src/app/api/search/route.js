import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI(process.env.OPENAI_API_KEY);

export async function POST(req) {
  const { query, searchType } = await req.json();

  try {
    if (searchType === 'ai') {
      const result = await aiSearch(query);
      return result;
    } else if (searchType === 'pattern') {
      return await patternSearch(query);
    } else {
      return NextResponse.json({ error: 'Invalid search type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error during search:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function aiSearch(query) {
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: query,
  });
  const queryEmbedding = embeddingResponse.data[0].embedding;

  const { data, error } = await supabase
    .rpc('match_documents', { query_embedding: queryEmbedding })
    .order('similarity', { ascending: true })  // Change this to false
    .gte('similarity', 0.3);
    
  console.log('AI search data', data);

  if (error) throw error;

  return NextResponse.json({ results: data });
}

async function patternSearch(query) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .or(`text.ilike.%${query}%,tags.cs.{${query}}`)
    .limit(5);

  if (error) throw error;

  return NextResponse.json({ results: data });
}
