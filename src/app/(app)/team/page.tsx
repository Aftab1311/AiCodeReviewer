import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db/prisma";

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const memberships = await prisma.teamMember.findMany({
    where: { userId: session.user.id },
    include: { team: true },
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Team Workspaces</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {memberships.map((membership) => (
          <div key={membership.id} className="rounded-2xl border bg-white/60 p-5 dark:bg-white/5">
            <p className="text-lg font-medium">{membership.team.name}</p>
            <p className="mt-1 text-sm text-slate-500">Role: {membership.role}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
