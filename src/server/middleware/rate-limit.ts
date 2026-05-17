import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";

export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  analytics: true,
  prefix: "codepilot:api",
});
