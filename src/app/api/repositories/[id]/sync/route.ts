import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db/prisma";
import { createOctokit } from "@/lib/github/octokit";

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const repo = await prisma.repository.findUnique({ where: { id } });
  if (!repo || repo.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "github" },
  });
  if (!account?.access_token) {
    return NextResponse.json({ error: "Missing GitHub access token" }, { status: 400 });
  }

  const [owner, name] = repo.fullName.split("/");
  if (!owner || !name) return NextResponse.json({ error: "Invalid repository name" }, { status: 400 });

  const octokit = createOctokit(account.access_token);
  const repoRes = await octokit.repos.get({ owner, repo: name });
  const pulls = await octokit.pulls.list({ owner, repo: name, state: "all", per_page: 50 });

  await prisma.repository.update({
    where: { id: repo.id },
    data: { defaultBranch: repoRes.data.default_branch },
  });

  let upserted = 0;
  let closedCount = 0;
  for (const pr of pulls.data) {
    const githubId = String(pr.user?.id || "");
    const fallbackEmail = `${pr.user?.login || "github-user"}-${githubId || "unknown"}@users.noreply.github.com`;

    let author = await prisma.user.findFirst({
      where: {
        OR: [
          githubId ? { githubId } : undefined,
          { email: fallbackEmail },
        ].filter(Boolean) as Array<{ githubId?: string; email?: string }>,
      },
    });

    if (!author) {
      author = await prisma.user.create({
        data: {
          name: pr.user?.login || "GitHub User",
          email: fallbackEmail,
          githubId: githubId || null,
        },
      });
    }

    await prisma.pullRequest.upsert({
      where: {
        repositoryId_githubPrNumber: {
          repositoryId: repo.id,
          githubPrNumber: pr.number,
        },
      },
      update: {
        title: pr.title,
        body: pr.body,
        baseBranch: pr.base.ref,
        headBranch: pr.head.ref,
        state: pr.state,
        url: pr.html_url,
        latestCommitSha: pr.head.sha,
      },
      create: {
        repositoryId: repo.id,
        authorId: author.id,
        githubPrNumber: pr.number,
        title: pr.title,
        body: pr.body,
        baseBranch: pr.base.ref,
        headBranch: pr.head.ref,
        state: pr.state,
        url: pr.html_url,
        latestCommitSha: pr.head.sha,
      },
    });

    if (pr.state === "closed") closedCount += 1;
    upserted += 1;
  }

  await prisma.notification.create({
    data: {
      userId: session.user.id,
      title: `Repository sync complete: ${repo.fullName}`,
      body: `Updated ${upserted} PRs, including ${closedCount} closed PRs.`,
      type: "repo_sync",
    },
  });

  return NextResponse.json({ success: true, upserted, closedCount });
}
