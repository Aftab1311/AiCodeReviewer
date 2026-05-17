import { z } from "zod";
import { AI_MODEL, getOpenAIClient } from "@/lib/ai/client";

export const aiReviewSchema = z.object({
  summary: z.string(),
  aiScore: z.number().min(0).max(100),
  maintainabilityScore: z.number().min(0).max(100),
  securityScore: z.number().min(0).max(100),
  performanceScore: z.number().min(0).max(100),
  comments: z.array(
    z.object({
      filePath: z.string(),
      line: z.coerce.number().int().min(0).default(0),
      severity: z.enum(["CRITICAL", "WARNING", "SUGGESTION"]),
      title: z.string(),
      body: z.string(),
      suggestion: z.string().optional(),
    }),
  ),
});

export type AIReviewOutput = z.infer<typeof aiReviewSchema>;

function extractFilePaths(diff: string) {
  const matches = diff.match(/^(\+\+\+ b\/)(.+)$/gm) ?? [];
  return matches.map((m) => m.replace("+++ b/", "").trim()).filter(Boolean);
}

export async function reviewPullRequest(input: { title: string; description?: string | null; diff: string }) {
  const openai = getOpenAIClient();
  const filePaths = extractFilePaths(input.diff);
  const schemaHint = {
    summary: "string",
    aiScore: "number 0-100",
    maintainabilityScore: "number 0-100",
    securityScore: "number 0-100",
    performanceScore: "number 0-100",
    comments: [
      {
        filePath: "string",
        line: "number (>= 0, prefer exact changed line)",
        severity: "CRITICAL|WARNING|SUGGESTION",
        title: "string",
        body: "string",
        suggestion: "string - include corrected code snippet, not empty",
      },
    ],
  };

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a senior staff engineer reviewing pull requests. Be strict, concrete, and code-focused. Always return actionable issues with file-specific fixes.",
      },
      {
        role: "user",
        content: `Return only valid JSON matching this shape: ${JSON.stringify(schemaHint)}.
Rules:
- Detect issues in: unused imports/state, any typing, event-listener leaks/cleanup, accessibility, bad React keys, unsafe casts, perf/code-quality issues.
- filePath must be one of these files when possible: ${filePaths.join(", ") || "unknown"}.
- suggestion must include corrected code snippet for each comment.
- Do not return vague generic feedback.

PR Title: ${input.title}
Description: ${input.description ?? "N/A"}

Diff:
${input.diff.slice(0, 120000)}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("AI returned empty content");

  const parsed = aiReviewSchema.parse(JSON.parse(content));
  const normalized = {
    ...parsed,
    comments: parsed.comments.map((comment) => ({
      ...comment,
      filePath:
        comment.filePath && comment.filePath !== "unknown"
          ? comment.filePath
          : filePaths[0] ?? "unknown",
      suggestion: comment.suggestion?.trim() ? comment.suggestion : `// Suggested fix for ${comment.title}\n// Replace the problematic code with a safer typed and cleaned-up version.`,
    })),
  };
  return {
    parsed: normalized,
    usage: completion.usage?.total_tokens ?? 0,
    model: AI_MODEL,
  };
}
