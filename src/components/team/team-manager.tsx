"use client";

import { useMemo, useState } from "react";
import { LoadingButton } from "@/components/ui/loading-button";

type TeamRole = "ADMIN" | "DEVELOPER" | "VIEWER";

type TeamMembership = {
  id: string;
  role: TeamRole;
  team: {
    id: string;
    name: string;
    slug: string;
    members: Array<{
      id: string;
      role: TeamRole;
      user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
      };
    }>;
  };
};

export function TeamManager({ memberships }: { memberships: TeamMembership[] }) {
  const [activeTeamId, setActiveTeamId] = useState(memberships[0]?.team.id ?? "");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("DEVELOPER");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeTeam = useMemo(
    () => memberships.find((item) => item.team.id === activeTeamId)?.team ?? null,
    [memberships, activeTeamId],
  );

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, teamId: activeTeamId, role }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to invite teammate");
      setMessage("Invitation sent. Refresh to see newly added members.");
      setEmail("");
      setRole("DEVELOPER");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (memberships.length === 0) {
    return (
      <section className="mt-6 rounded-2xl border bg-white/70 p-5 dark:bg-white/5">
        <p className="text-sm text-slate-600 dark:text-slate-300">No team workspace found yet. Create a repository to auto-provision a personal team.</p>
      </section>
    );
  }

  return (
    <section className="mt-6 space-y-5">
      <div className="rounded-2xl border bg-white/70 p-5 dark:bg-white/5">
        <label className="text-sm font-medium">Workspace</label>
        <select
          value={activeTeamId}
          onChange={(e) => setActiveTeamId(e.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          {memberships.map((membership) => (
            <option key={membership.id} value={membership.team.id}>
              {membership.team.name} ({membership.role})
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border bg-white/70 p-5 dark:bg-white/5">
        <h2 className="text-lg font-semibold">Invite teammate</h2>
        <form onSubmit={handleInvite} className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as TeamRole)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="ADMIN">ADMIN</option>
            <option value="DEVELOPER">DEVELOPER</option>
            <option value="VIEWER">VIEWER</option>
          </select>
          <LoadingButton
            type="submit"
            loading={loading}
            loadingText="Inviting..."
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
          >
            Send invite
          </LoadingButton>
        </form>
        {message ? <p className="mt-3 text-sm text-emerald-600">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </div>

      <div className="rounded-2xl border bg-white/70 p-5 dark:bg-white/5">
        <h2 className="text-lg font-semibold">Members</h2>
        <p className="mt-1 text-sm text-slate-500">Workspace slug: {activeTeam?.slug ?? "-"}</p>
        <div className="mt-4 space-y-3">
          {activeTeam?.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
              <div>
                <p className="text-sm font-medium">{member.user.name || member.user.email || "Unnamed user"}</p>
                <p className="text-xs text-slate-500">{member.user.email || "No email available"}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
