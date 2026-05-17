import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db/prisma";
import { createOctokit } from "@/lib/github/octokit";

type DiffBlock = {
  filePath: string;
  lines: Array<{ type: "add" | "del" | "ctx" | "meta"; text: string }>;
};

function parseDiff(diffText: string): DiffBlock[] {
  const blocks: DiffBlock[] = [];
  let current: DiffBlock | null = null;

  for (const raw of diffText.split("\n")) {
    const line = raw ?? "";
    if (line.startsWith("diff --git ")) {
      if (current) blocks.push(current);
      current = { filePath: "unknown", lines: [] };
      continue;
    }

    if (!current) continue;

    if (line.startsWith("+++ b/")) {
      current.filePath = line.replace("+++ b/", "");
      continue;
    }

    if (line.startsWith("@@")) {
      current.lines.push({ type: "meta", text: line });
      continue;
    }

    if (line.startsWith("+") && !line.startsWith("+++")) {
      current.lines.push({ type: "add", text: line });
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      current.lines.push({ type: "del", text: line });
    } else {
      current.lines.push({ type: "ctx", text: line });
    }
  }

  if (current) blocks.push(current);
  return blocks.slice(0, 30).map((b) => ({ ...b, lines: b.lines.slice(0, 400) }));
}

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const pr = await prisma.pullRequest.findUnique({
    where: { id },
    include: { repository: true },
  });

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
  const diff = await octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}", {
    owner,
    repo,
    pull_number: pr.githubPrNumber,
    mediaType: { format: "diff" },
  });

  const diffText = String(diff.data ?? "");
  const blocks = parseDiff(diffText);
  return NextResponse.json({ blocks });
}
