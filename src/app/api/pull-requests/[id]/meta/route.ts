import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db/prisma";
import { createOctokit } from "@/lib/github/octokit";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const pr = await prisma.pullRequest.findUnique({ where: { id }, include: { repository: true } });
  if (!pr || pr.repository.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Pull request not found" }, { status: 404 });
  }

  const account = await prisma.account.findFirst({ where: { userId: session.user.id, provider: "github" } });
  if (!account?.access_token) {
    return NextResponse.json({ error: "Missing GitHub access token" }, { status: 400 });
  }

  const [owner, repo] = pr.repository.fullName.split("/");
  if (!owner || !repo) return NextResponse.json({ error: "Invalid repository name" }, { status: 400 });

  const octokit = createOctokit(account.access_token);
  const details = await octokit.pulls.get({ owner, repo, pull_number: pr.githubPrNumber });

  return NextResponse.json({
    state: details.data.state,
    merged: Boolean(details.data.merged_at),
    comments: details.data.comments ?? 0,
    reviewComments: details.data.review_comments ?? 0,
    updatedAt: details.data.updated_at,
  });
}
