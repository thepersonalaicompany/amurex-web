import { NextResponse } from "next/server";
import { supabaseAdminClient } from "@amurex/supabase";

export async function POST(req: Request) {
  const { query, searchType, session } = await req.json();

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (searchType === "ai") {
      const result = await aiSearch(query, session.user.id);
      return result;
    } else if (searchType === "pattern") {
      return await patternSearch(query, session.user.id);
    } else {
      return NextResponse.json(
        { error: "Invalid search type" },
        { status: 400 },
      );
    }
  } catch (error: any) {
    console.error("Error during search:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function aiSearch(query: string, userId: string) {
  console.log("embeddings mistral lesgo");

  // TODO?: fetched response is never used
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
}

async function patternSearch(query: string, userId: string) {
  // initialize supabase admin client with service role key
  const supabase = supabaseAdminClient(
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  );

  // First search in documents
  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("id, url, title, meta, tags")
    .eq("user_id", userId)
    .textSearch("text", query)
    .limit(5);

  if (documentsError) throw documentsError;

  // Then search in page_sections
  const { data: sections, error: sectionsError } = await supabase
    .from("page_sections")
    .select("document_id, context")
    .textSearch("context", query)
    .limit(10);

  if (sectionsError) throw sectionsError;

  // Get additional documents from matching sections
  const sectionDocIds = sections.map((section) => section.document_id);
  const { data: additionalDocs, error: additionalError } = await supabase
    .from("documents")
    .select("id, url, title, meta, tags")
    .in("id", sectionDocIds)
    .not("id", "in", `(${documents.map((d) => d.id).join(",")})`);

  if (additionalError) throw additionalError;

  // Combine all results
  const allResults = [...documents, ...additionalDocs].map((doc) => ({
    id: doc.id,
    url: doc.url,
    title: doc.title,
    tags: doc.tags,
    relevantSections: sections
      .filter((section) => section.document_id === doc.id)
      .map((section) => ({
        context: section.context,
      })),
  }));

  return NextResponse.json({ results: allResults });
}
