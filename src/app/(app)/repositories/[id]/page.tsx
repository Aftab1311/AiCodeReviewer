import { auth } from "@/lib/auth";
import { prisma } from "@/server/db/prisma";
import { redirect } from "next/navigation";
import { RepositoryWorkspace } from "@/components/dashboard/repository-workspace";

export default async function RepositoryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const repo = await prisma.repository.findUnique({
    where: { id },
    include: {
      pullRequests: {
        include: {
          reviews: {
            include: { comments: { select: { id: true, severity: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      },
    },
  });

  if (!repo || repo.ownerId !== session.user.id) {
    return <main className="p-6">Repository not found.</main>;
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-3xl font-semibold">{repo.fullName}</h1>
      <p className="mt-2 text-sm text-slate-500">Default branch: {repo.defaultBranch ?? "unknown"}</p>
      <div className="mt-8">
        <RepositoryWorkspace repo={repo} />
      </div>
    </main>
  );
}
