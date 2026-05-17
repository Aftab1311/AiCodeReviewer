import { redis } from "@/lib/redis";

const QUEUE_KEY = "codepilot:review-queue";

export async function enqueueReviewJob(prId: string) {
  await redis.lpush(QUEUE_KEY, prId);
}

export async function dequeueReviewJob() {
  return redis.rpop<string>(QUEUE_KEY);
}
