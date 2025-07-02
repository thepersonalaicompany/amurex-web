// TODO?: Following function is not implemented properly in original codebase and is never called

// import OpenAI from "openai";

// interface EmbeddingData {
//   embedding: number[];
// }

// interface EmbeddingResponse {
//   data: EmbeddingData[];
// }

// async function generateEmbeddings(text: string): Promise<number[]> {
//   const embeddingResponse: EmbeddingResponse = await OpenAI.embeddings.create({
//     model: "text-embedding-ada-002",
//     input: text.substring(0, 8000),
//   });
//   return embeddingResponse.data[0].embedding;
// }
