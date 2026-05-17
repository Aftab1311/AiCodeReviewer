import { NextResponse } from "next/server";
import { Webhooks } from "@octokit/webhooks";
import { prisma } from "@/server/db/prisma";

const webhooks = new Webhooks({ secret: process.env.GITHUB_WEBHOOK_SECRET || "" });
type PullRequestWebhookPayload = {
  action: string;
  repository: { owner: { login: string }; name: string };
  pull_request: {
    number: number;
    title: string;
    body: string | null;
    state: string;
    html_url: string;
    base: { ref: string };
    head: { ref: string; sha: string };
    user?: { id?: number; login?: string; email?: string };
  };
};

export async function POST(req: Request) {
  const signature = req.headers.get("x-hub-signature-256");
  const id = req.headers.get("x-github-delivery");
  const event = req.headers.get("x-github-event");
  const payload = await req.text();

  if (!signature || !id || !event) {
    return NextResponse.json({ error: "Invalid webhook headers" }, { status: 400 });
  }

  const ok = await webhooks.verify(payload, signature);
  if (!ok) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const data = JSON.parse(payload) as PullRequestWebhookPayload;
  if (event === "pull_request" && ["opened", "synchronize", "reopened", "edited", "closed"].includes(data.action)) {
    const repoFullName = `${data.repository.owner.login}/${data.repository.name}`;
    const repo = await prisma.repository.findFirst({ where: { fullName: repoFullName } });
    if (!repo) return NextResponse.json({ received: true, skipped: true });

    const authorEmail = data.pull_request.user?.email || `${data.pull_request.user?.login}@users.noreply.github.com`;
    let author = await prisma.user.findUnique({ where: { email: authorEmail } });
    if (!author) {
      author = await prisma.user.create({
        data: {
          email: authorEmail,
          name: data.pull_request.user?.login || "GitHub User",
          githubId: String(data.pull_request.user?.id || ""),
        },
      });
    }

    await prisma.pullRequest.upsert({
      where: {
        repositoryId_githubPrNumber: {
          repositoryId: repo.id,
          githubPrNumber: data.pull_request.number,
        },
      },
      update: {
        title: data.pull_request.title,
        body: data.pull_request.body,
        state: data.pull_request.state,
        baseBranch: data.pull_request.base.ref,
        headBranch: data.pull_request.head.ref,
        latestCommitSha: data.pull_request.head.sha,
        url: data.pull_request.html_url,
      },
      create: {
        repositoryId: repo.id,
        authorId: author.id,
        githubPrNumber: data.pull_request.number,
        title: data.pull_request.title,
        body: data.pull_request.body,
        baseBranch: data.pull_request.base.ref,
        headBranch: data.pull_request.head.ref,
        state: data.pull_request.state,
        url: data.pull_request.html_url,
        latestCommitSha: data.pull_request.head.sha,
      },
    });
  }

  return NextResponse.json({ received: true });
}
