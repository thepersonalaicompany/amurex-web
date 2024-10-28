import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI(process.env.OPENAI_API_KEY);

export async function POST(req) {
  const { query, searchType, session } = await req.json();

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (searchType === 'ai') {
      const result = await aiSearch(query, session.user.id);
      return result;
    } else if (searchType === 'pattern') {
      return await patternSearch(query, session.user.id);
    } else {
      return NextResponse.json({ error: 'Invalid search type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error during search:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function aiSearch(query, userId) {
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: query,
  });
  const queryEmbedding = embeddingResponse.data[0].embedding;

  // Search in page_sections using the match_page_sections function
  const { data: sections, error: sectionsError } = await supabase
    .rpc('match_page_sections', {
      query_embedding: queryEmbedding,
      similarity_threshold: 0.3,
      match_count: 5,
      user_id: userId
    });

  console.log('sections', sections);
  console.log('sectionsError', sectionsError);

  if (sectionsError) throw sectionsError;

  // Get unique document IDs from the matching sections
  const documentIds = [...new Set(sections.map(section => section.document_id))];

  // Fetch the corresponding documents
  const { data: documents, error: documentsError } = await supabase
    .from('documents')
    .select('id, url, title, meta, tags, text')
    .in('id', documentIds)
    .eq('user_id', userId);

  if (documentsError) throw documentsError;

  // Combine the results
  const results = documents.map(doc => ({
    id: doc.id,
    url: doc.url,
    title: doc.title,
    content: doc.text,
    tags: doc.tags,
    relevantSections: sections
      .filter(section => section.document_id === doc.id)
      .map(section => ({
        context: section.context,
        similarity: section.similarity
      }))
  }));

  console.log(results);

  return NextResponse.json({ results });
}

async function patternSearch(query, userId) {
  // First search in documents
  const { data: documents, error: documentsError } = await supabase
    .from('documents')
    .select('id, url, title, meta, tags')
    .eq('user_id', userId)
    .textSearch('text', query)
    .limit(5);

  if (documentsError) throw documentsError;

  // Then search in page_sections
  const { data: sections, error: sectionsError } = await supabase
    .from('page_sections')
    .select('document_id, context')
    .textSearch('context', query)
    .limit(10);

  if (sectionsError) throw sectionsError;

  // Get additional documents from matching sections
  const sectionDocIds = sections.map(section => section.document_id);
  const { data: additionalDocs, error: additionalError } = await supabase
    .from('documents')
    .select('id, url, title, meta, tags')
    .in('id', sectionDocIds)
    .not('id', 'in', `(${documents.map(d => d.id).join(',')})`);

  if (additionalError) throw additionalError;

  // Combine all results
  const allResults = [...documents, ...additionalDocs].map(doc => ({
    id: doc.id,
    url: doc.url,
    title: doc.title,
    tags: doc.tags,
    relevantSections: sections
      .filter(section => section.document_id === doc.id)
      .map(section => ({
        context: section.context
      }))
  }));

  return NextResponse.json({ results: allResults });
}
