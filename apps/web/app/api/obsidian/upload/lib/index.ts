export const calculateCentroid = (embeddings: number[][]): number[] => {
  if (!embeddings || embeddings.length === 0) {
    throw new Error("No embeddings provided to calculate centroid");
  }

  const dimensions = embeddings[0]?.length ?? 0;
  if (dimensions === 0) {
    throw new Error("Invalid embedding dimensions");
  }
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
