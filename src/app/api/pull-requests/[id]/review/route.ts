import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db/prisma";
import { reviewPullRequest } from "@/server/services/ai-review.service";
import { fetchPullRequestDiff } from "@/server/services/github-pr.service";
import { semanticSearch } from "@/server/services/repository-memory.service";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const pr = await prisma.pullRequest.findUnique({
    where: { id },
    include: { repository: true },
  });
  if (!pr) return NextResponse.json({ error: "PR not found" }, { status: 404 });

  const review = await prisma.review.create({
    data: {
      pullRequestId: pr.id,
      reviewerId: session.user.id,
      status: "PROCESSING",
    },
  });

  try {
    const account = await prisma.account.findFirst({
      where: { userId: session.user.id, provider: "github" },
    });
    if (!account?.access_token) {
      throw new Error("Missing GitHub OAuth token. Please sign in again.");
    }

    const [owner, repoName] = pr.repository.fullName.split("/");
    if (!owner || !repoName) {
      throw new Error("Invalid repository fullName.");
    }

    const realDiff = await fetchPullRequestDiff({
      token: account.access_token,
      owner,
      repo: repoName,
      pullNumber: pr.githubPrNumber,
    });

    const contextChunks = await semanticSearch(pr.repositoryId, `Review PR ${pr.title}`);
    const context = contextChunks.map((c) => `File: ${c.chunk.path}\n${c.chunk.chunk}`).join("\n\n");

    const { parsed, usage, model } = await reviewPullRequest({
      title: pr.title,
      description: `${pr.body || ""}\n\nRepository context:\n${context || "No repository memory indexed yet."}`,
      diff: realDiff,
    });

    await prisma.review.update({
      where: { id: review.id },
      data: {
        status: "COMPLETED",
        summary: parsed.summary,
        aiScore: parsed.aiScore,
        maintainabilityScore: parsed.maintainabilityScore,
        securityScore: parsed.securityScore,
        performanceScore: parsed.performanceScore,
        tokenUsage: usage,
        model,
      },
    });

    if (parsed.comments.length) {
      await prisma.comment.createMany({
        data: parsed.comments.map((comment) => ({ ...comment, reviewId: review.id })),
      });
    }

    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: `Review completed for PR #${pr.githubPrNumber}`,
        body: parsed.summary,
        type: "review_complete",
      },
    });

    return NextResponse.json({ reviewId: review.id });
  } catch (error) {
    await prisma.review.update({ where: { id: review.id }, data: { status: "FAILED" } });
    return NextResponse.json({ error: "Review failed", details: `${error}` }, { status: 500 });
  }
}
