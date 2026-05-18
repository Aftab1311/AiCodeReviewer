import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db/prisma";
import { SettingsPanel } from "@/components/settings/settings-panel";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, githubAccount, teamCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.account.findFirst({
      where: { userId: session.user.id, provider: "github" },
      select: { providerAccountId: true, scope: true, expires_at: true },
    }),
    prisma.teamMember.count({ where: { userId: session.user.id } }),
  ]);

  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Settings</h1>
      <p className="mt-2 text-sm text-slate-500">Manage your account profile and integration status.</p>
      <SettingsPanel
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt.toISOString(),
        }}
        github={githubAccount}
        teamCount={teamCount}
      />
    </main>
  );
}
