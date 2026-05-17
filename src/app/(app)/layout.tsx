import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CommandPalette } from "@/components/layout/command-palette";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-white/60 backdrop-blur dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-lg font-semibold">CodePilot AI</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/team">Team</Link>
            <Link href="/settings">Settings</Link>
            <form action={async () => {"use server"; await signOut({ redirectTo: "/" });}}>
              <button type="submit">Sign out</button>
            </form>
          </nav>
        </div>
      </header>
      <CommandPalette />
      {children}
    </div>
  );
}
