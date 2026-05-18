import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db/prisma";
import { TeamManager } from "@/components/team/team-manager";

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const memberships = await prisma.teamMember.findMany({
    where: { userId: session.user.id },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Team Workspaces</h1>
      <p className="mt-2 text-sm text-slate-500">Invite teammates, assign roles, and manage shared workspaces.</p>
      <TeamManager memberships={memberships} />
    </main>
  );
}
