import { supabaseAdminClient } from "@amurex/supabase";
import { NextResponse } from "next/server";
import { SearchResult } from "../types";

export const patternSearch = async (
  query: string,
  userId: string,
): Promise<NextResponse> => {
  // initialize supabase admin client with service role key
  const supabase = supabaseAdminClient(
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  );

  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("id, url, title, meta, tags")
    .eq("user_id", userId)
    .textSearch("text", query)
    .limit(5);

  if (documentsError) throw documentsError;

  const { data: sections, error: sectionsError } = await supabase
    .from("page_sections")
    .select("document_id, context")
    .textSearch("context", query)
    .limit(10);

  if (sectionsError) throw sectionsError;

  const sectionDocIds = sections.map((section) => section.document_id);
  const { data: additionalDocs, error: additionalError } = await supabase
    .from("documents")
    .select("id, url, title, meta, tags")
    .in("id", sectionDocIds)
    .not("id", "in", `(${documents.map((d) => d.id).join(",")})`);

  if (additionalError) throw additionalError;

  const allResults: SearchResult[] = [...documents, ...additionalDocs].map(
    (doc) => ({
      id: doc.id,
      url: doc.url,
      title: doc.title,
      tags: doc.tags,
      relevantSections: sections
        .filter((section) => section.document_id === doc.id)
        .map((section) => ({
          context: section.context,
        })),
    }),
  );

  return NextResponse.json({ results: allResults });
};
