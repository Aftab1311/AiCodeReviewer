"use client";

import { useState } from "react";
import { LoadingButton } from "@/components/ui/loading-button";

type SettingsUser = {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string;
};

type GithubAccount = {
  providerAccountId: string;
  scope: string | null;
  expires_at: number | null;
} | null;

export function SettingsPanel({
  user,
  github,
  teamCount,
}: {
  user: SettingsUser;
  github: GithubAccount;
  teamCount: number;
}) {
  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Unable to save changes");
      setMessage("Settings updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-6 space-y-5">
      <div className="rounded-2xl border bg-white/70 p-5 dark:bg-white/5">
        <h2 className="text-lg font-semibold">Profile</h2>
        <form onSubmit={saveProfile} className="mt-4 grid gap-3">
          <label className="text-sm font-medium">
            Full name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="Your name"
            />
          </label>
          <label className="text-sm font-medium">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="you@company.com"
            />
          </label>
          <LoadingButton
            type="submit"
            loading={saving}
            loadingText="Saving..."
            className="mt-1 w-fit rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
          >
            Save profile
          </LoadingButton>
        </form>
        {message ? <p className="mt-3 text-sm text-emerald-600">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </div>

      <div className="rounded-2xl border bg-white/70 p-5 dark:bg-white/5">
        <h2 className="text-lg font-semibold">Account overview</h2>
        <dl className="mt-3 grid gap-2 text-sm">
          <div className="flex items-center justify-between border-b border-slate-200 py-2 dark:border-slate-800">
            <dt className="text-slate-500">Account created</dt>
            <dd>{new Date(user.createdAt).toLocaleDateString()}</dd>
          </div>
          <div className="flex items-center justify-between border-b border-slate-200 py-2 dark:border-slate-800">
            <dt className="text-slate-500">Team memberships</dt>
            <dd>{teamCount}</dd>
          </div>
          <div className="flex items-center justify-between py-2">
            <dt className="text-slate-500">GitHub connected</dt>
            <dd>{github ? "Yes" : "No"}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border bg-white/70 p-5 dark:bg-white/5">
        <h2 className="text-lg font-semibold">GitHub integration</h2>
        {github ? (
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex items-center justify-between border-b border-slate-200 py-2 dark:border-slate-800">
              <dt className="text-slate-500">GitHub user ID</dt>
              <dd>{github.providerAccountId}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 py-2 dark:border-slate-800">
              <dt className="text-slate-500">Scopes</dt>
              <dd className="max-w-[60%] text-right">{github.scope || "Not available"}</dd>
            </div>
            <div className="flex items-center justify-between py-2">
              <dt className="text-slate-500">Token expiry</dt>
              <dd>{github.expires_at ? new Date(github.expires_at * 1000).toLocaleString() : "Not provided"}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No GitHub account connected yet. Sign in with GitHub to enable repository sync and PR reviews.</p>
        )}
      </div>
    </section>
  );
}
