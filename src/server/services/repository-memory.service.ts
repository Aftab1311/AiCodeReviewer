import { prisma } from "@/server/db/prisma";
import { cosineSimilarity, embedText } from "@/server/services/embedding.service";
import type { Prisma } from "@prisma/client";

export async function indexRepositoryChunk(input: {
  repositoryId: string;
  path: string;
  chunk: string;
  metadata?: Record<string, unknown>;
}) {
  const embedding = await embedText(input.chunk);
  return prisma.repositoryMemory.create({
    data: {
      repositoryId: input.repositoryId,
      path: input.path,
      chunk: input.chunk,
      embedding,
      metadata: (input.metadata ?? null) as Prisma.InputJsonValue,
    },
  });
}

export async function semanticSearch(repositoryId: string, query: string, limit = 6) {
  const queryEmbedding = await embedText(query);
  const chunks = await prisma.repositoryMemory.findMany({
    where: { repositoryId },
    take: 200,
    orderBy: { createdAt: "desc" },
  });

  return chunks
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, (chunk.embedding as number[]) || []),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
