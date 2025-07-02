// Type definitions

export interface RequestBody {
  fileName: string;
  content: string;
  userId: string;
}

export interface User {
  email: string;
}

export interface DocumentRow {
  id?: string;
  checksum?: string;
  user_id?: string;
  title?: string;
  text?: string;
  tags?: string[];
  type?: string;
  created_at?: string;
  meta?: Record<string, unknown>;
  chunks?: string[];
  embeddings?: string[];
  centroid?: string;
}

export interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
    object: string;
  }>;
}
