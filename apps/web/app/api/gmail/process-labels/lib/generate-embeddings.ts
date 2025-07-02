import { mistralClient as mistral } from "@amurex/web/lib";

interface EmbeddingData {
  embedding: number[];
}

interface EmbeddingResponse {
  data: EmbeddingData[];
}

/**
 * Generates text embeddings using Mistral's API
 * @param text Input text to generate embeddings for
 * @returns Promise resolving to embedding array or null if failed
 */
export const generateEmbeddings = async (
  text: string,
): Promise<number[] | null> => {
  try {
    // Validate input
    if (!text || text.trim() === "") {
      console.warn("Empty text provided for embedding");
      return null;
    }

    // Truncate text to handle model limits
    const truncatedText: string =
      text.length > 8000 ? text.substring(0, 8000) : text;

    // API call with proper typing
    const response: EmbeddingResponse = await mistral.embeddings.create({
      model: "mistral-embed",
      input: truncatedText,
    });

    // Type-safe response validation
    if (response?.data?.[0]?.embedding) {
      return response.data[0].embedding;
    }

    console.error("Invalid embedding response structure:", response);
    return null;
  } catch (error: unknown) {
    console.error("Error generating embeddings:", error);
    return null;
  }
};
