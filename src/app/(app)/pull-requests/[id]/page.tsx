import { auth } from "@/lib/auth";
import { prisma } from "@/server/db/prisma";
import { redirect } from "next/navigation";
import { PullRequestWorkspace } from "@/components/dashboard/pull-request-workspace";

export default async function PullRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const pr = await prisma.pullRequest.findUnique({
    where: { id },
    include: {
      repository: { select: { id: true, fullName: true, ownerId: true } },
      reviews: {
        include: {
          comments: {
            select: {
              id: true,
              filePath: true,
              line: true,
              severity: true,
              title: true,
              body: true,
              suggestion: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!pr || pr.repository.ownerId !== session.user.id) {
    return <main className="p-6">PR not found.</main>;
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-3xl font-semibold">PR #{pr.githubPrNumber}: {pr.title}</h1>
      <p className="mt-2 text-sm text-slate-500">{pr.repository.fullName} · {pr.baseBranch} ← {pr.headBranch}</p>
      <div className="mt-8">
        <PullRequestWorkspace pr={pr} />
      </div>
    </main>
  );
}
