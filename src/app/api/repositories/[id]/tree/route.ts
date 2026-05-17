import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db/prisma";
import { createOctokit } from "@/lib/github/octokit";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const repo = await prisma.repository.findUnique({ where: { id } });
  if (!repo || repo.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  const account = await prisma.account.findFirst({ where: { userId: session.user.id, provider: "github" } });
  if (!account?.access_token) {
    return NextResponse.json({ error: "Missing GitHub access token" }, { status: 400 });
  }

  const [owner, name] = repo.fullName.split("/");
  if (!owner || !name) return NextResponse.json({ error: "Invalid repository name" }, { status: 400 });

  const octokit = createOctokit(account.access_token);
  const branch = repo.defaultBranch || "main";
  const tree = await octokit.git.getTree({ owner, repo: name, tree_sha: branch, recursive: "1" });

  const files = (tree.data.tree || [])
    .filter((item) => item.type === "blob" && item.path)
    .slice(0, 300)
    .map((item) => ({ path: item.path, sha: item.sha, size: item.size || 0 }));

  return NextResponse.json({ files });
}
