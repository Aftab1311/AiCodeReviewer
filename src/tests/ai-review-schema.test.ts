import { describe, expect, it } from "vitest";
import { aiReviewSchema } from "../server/services/ai-review.service";

describe("aiReviewSchema", () => {
  it("validates review payload", () => {
    const parsed = aiReviewSchema.parse({
      summary: "Looks good",
      aiScore: 90,
      maintainabilityScore: 89,
      securityScore: 91,
      performanceScore: 87,
      comments: [],
    });

    expect(parsed.aiScore).toBe(90);
  });
});
