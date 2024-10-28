drop function match_page_sections;

CREATE OR REPLACE FUNCTION match_page_sections(
  query_embedding vector(1536),
  similarity_threshold float,
  match_count int,
  user_id uuid
)
RETURNS TABLE (
  document_id integer,  -- Changed from bigint to integer
  context text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ps.document_id,
    ps.context,
    (ps.embedding <#> query_embedding) * -1 as similarity
  FROM
    page_sections ps
    INNER JOIN documents d ON ps.document_id = d.id
  WHERE
    d.user_id = match_page_sections.user_id
    AND (ps.embedding <#> query_embedding) * -1 > similarity_threshold
  ORDER BY
    similarity DESC
  LIMIT match_count;
END;
$$;