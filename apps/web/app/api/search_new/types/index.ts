// Define export interfaces for our data structures
export interface Session {
  user: {
    id: string;
  };
}

export interface SearchRequest {
  query: string;
  searchType: "ai" | "pattern";
  session: Session;
}

export interface SearchResult {
  id: string;
  url: string;
  title: string;
  content?: string;
  tags: string[];
  relevantSections: {
    context: string;
    similarity?: number;
  }[];
}

export interface EmbeddingResponse {
  data: {
    embedding: number[];
  }[];
}
