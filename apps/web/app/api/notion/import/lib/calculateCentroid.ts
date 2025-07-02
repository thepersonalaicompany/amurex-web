export const calculateCentroid = (
  embeddings: number[][] | null | undefined,
): number[] => {
  if (!embeddings || embeddings.length === 0) {
    throw new Error("No embeddings provided to calculate centroid");
  }

  const dimensions = embeddings[0]?.length ?? 1536; // TODO?: Default to OpenAI's embedding dimension, this is not same in actual codebase
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
};
