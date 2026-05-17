function localEmbedding(text: string, dimensions = 256) {
  const vector = new Array<number>(dimensions).fill(0);
  const input = text.slice(0, 8000);
  for (let i = 0; i < input.length; i += 1) {
    const code = input.charCodeAt(i);
    const idx = (code * 31 + i * 17) % dimensions;
    vector[idx] += ((code % 97) + 1) / 100;
  }
  const norm = Math.sqrt(vector.reduce((acc, v) => acc + v * v, 0)) || 1;
  return vector.map((v) => v / norm);
}

export async function embedText(text: string) {
  return localEmbedding(text);
}

export function cosineSimilarity(a: number[], b: number[]) {
  if (!a.length || !b.length || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}
