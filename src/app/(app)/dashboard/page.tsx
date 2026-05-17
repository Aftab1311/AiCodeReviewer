import { auth } from "@/lib/auth";
import { prisma } from "@/server/db/prisma";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [repos, prs, reviews, notifications, teamCount] = await Promise.all([
    prisma.repository.findMany({
      where: { ownerId: session.user.id },
      include: { pullRequests: { orderBy: { updatedAt: "desc" }, take: 12 } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.pullRequest.findMany({
      where: { repository: { ownerId: session.user.id } },
      include: {
        repository: { select: { id: true, fullName: true } },
        reviews: { select: { id: true, status: true, aiScore: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.review.findMany({
      where: { reviewerId: session.user.id },
      include: {
        comments: { select: { id: true, severity: true } },
        pullRequest: {
          select: {
            id: true,
            title: true,
            githubPrNumber: true,
            repository: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.teamMember.count({ where: { userId: session.user.id } }),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-sm text-slate-500">Manage repositories, run AI reviews, inspect quality signals, and track team activity.</p>
      <div className="mt-8">
        <DashboardShell
          initialRepos={repos}
          initialPrs={prs}
          initialReviews={reviews}
          initialNotifications={notifications}
          teamCount={teamCount}
        />
      </div>
    </main>
  );
}
