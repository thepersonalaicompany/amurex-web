// Commented out chunking and embedding generation
/*
        const chunks = await textSplitter.createDocuments([content]);
        const chunkTexts = chunks.map((chunk) => chunk.pageContent);

        // Log chunk information for debugging
        console.log(`Document ${file.name} (${file.id}) generated ${chunks.length} chunks`);
        console.log(`Chunk lengths: ${chunkTexts.map(c => c.length).join(', ')}`);

        // Validate chunks before generating embeddings
        if (!chunkTexts || chunkTexts.length === 0) {
          console.warn(`No valid chunks generated for document ${file.name} (${file.id})`);
          results.push({
            id: file.id,
            status: "error",
            title: file.name,
            error: "Failed to generate text chunks",
          });
          continue;
        }

        // Filter out any empty chunks
        const validChunks = chunkTexts.filter(chunk => chunk && chunk.trim().length > 0);

        if (validChunks.length === 0) {
          console.warn(`All chunks were empty for document ${file.name} (${file.id})`);
          results.push({
            id: file.id,
            status: "error",
            title: file.name,
            error: "All text chunks were empty",
          });
          continue;
        }

        // Generate embeddings using Mistral API
        const embeddingResponse = await fetch(
          "https://api.mistral.ai/v1/embeddings",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
            },
            body: JSON.stringify({
              input: validChunks,
              model: "mistral-embed",
              encoding_format: "float",
            }),
          }
        );

        const embedData = await embeddingResponse.json();

        // Add error handling for the embedding data
        if (!embedData || !embedData.data || !Array.isArray(embedData.data)) {
          console.error("Invalid embedding data received:", embedData);
          throw new Error("Failed to generate embeddings: Invalid response format");
        }

        // Format embeddings as arrays for Postgres vector type
        const embeddings = embedData.data.map(item => {
          if (!item || !item.embedding || !Array.isArray(item.embedding)) {
            console.error("Invalid embedding item:", item);
            throw new Error("Failed to process embedding: Invalid format");
          }
          return `[${item.embedding.join(",")}]`;
        });

        // Calculate and format centroid as array for Postgres
        const centroid = `[${calculateCentroid(
          embedData.data.map(item => {
            if (!item || !item.embedding || !Array.isArray(item.embedding)) {
              console.error("Invalid embedding item for centroid:", item);
              throw new Error("Failed to calculate centroid: Invalid embedding format");
            }
            return item.embedding;
          })
        ).join(",")}]`;
        */

// Commenting out the centroid calculation function since it's not being used
/*
function calculateCentroid(embeddings: number[][]) {
  if (!embeddings || embeddings.length === 0) {
    throw new Error("No embeddings provided to calculate centroid");
  }

  const dimensions = embeddings[0].length;
  const centroid = new Array(dimensions).fill(0);

  for (const embedding of embeddings) {
    for (let i = 0; i < dimensions; i++) {
      centroid[i] += embedding[i];
    }
  }

  for (let i = 0; i < dimensions; i++) {
    centroid[i] /= embeddings.length;
  }

  return centroid;
}
*/
