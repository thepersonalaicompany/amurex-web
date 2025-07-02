import { NextResponse } from "next/server";
import { supabaseAdminClient } from "@amurex/supabase";
import { EmbeddingResponse, SearchResult } from "../types";

export const aiSearch = async (
  query: string,
  userId: string,
): Promise<NextResponse> => {
  console.log("embeddings mistral lesgo");
  const embeddingResponse = await fetch(
    "https://api.mistral.ai/v1/embeddings",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        input: query,
        model: "mistral-embed",
        encoding_format: "float",
      }),
    },
  );

  const embedData: EmbeddingResponse = await embeddingResponse.json();
  const queryEmbedding = embedData.data[0]?.embedding;

  // initialize supabase admin client with service role key
  const supabase = supabaseAdminClient(
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  );

  const { data: sections, error: sectionsError } = await supabase.rpc(
    "match_page_sections",
    {
      query_embedding: queryEmbedding,
      similarity_threshold: 0.3,
      match_count: 5,
      user_id: userId,
    },
  );

  console.log("sections", sections);
  console.log("sectionsError", sectionsError);

  if (sectionsError) throw sectionsError;

  // TODO: remove any
  const documentIds = [
    ...new Set(sections.map((section: any) => section.document_id)),
  ];

  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("id, url, title, meta, tags, text")
    .in("id", documentIds)
    .eq("user_id", userId);

  if (documentsError) throw documentsError;

  const results: SearchResult[] = documents.map((doc) => ({
    id: doc.id,
    url: doc.url,
    title: doc.title,
    content: doc.text,
    tags: doc.tags,
    relevantSections: sections
      .filter((section: any) => section.document_id === doc.id)
      .map((section: any) => ({
        context: section.context,
        similarity: section.similarity,
      })),
  }));

  console.log(results);

  return NextResponse.json({ results });
};
