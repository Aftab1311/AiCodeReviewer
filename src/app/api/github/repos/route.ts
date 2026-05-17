import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db/prisma";

type GitHubRepo = {
  id: number;
  full_name: string;
  private: boolean;
  default_branch: string;
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "github" },
    orderBy: { userId: "desc" },
  });

  if (!account?.access_token) {
    return NextResponse.json({ error: "GitHub account token missing. Please sign in again." }, { status: 400 });
  }

  const response = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
    headers: {
      Authorization: `Bearer ${account.access_token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json({ error: "Failed to fetch GitHub repositories", details: text }, { status: 400 });
  }

  const repos = (await response.json()) as GitHubRepo[];
  return NextResponse.json({
    repos: repos.map((repo) => ({
      id: String(repo.id),
      fullName: repo.full_name,
      private: repo.private,
      defaultBranch: repo.default_branch,
    })),
  });
}
