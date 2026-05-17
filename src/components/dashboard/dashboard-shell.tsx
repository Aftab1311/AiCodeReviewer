"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LoadingButton, Spinner } from "@/components/ui/loading-button";

type Repo = {
  id: string;
  fullName: string;
  defaultBranch: string | null;
  installationId: string | null;
  pullRequests: Array<{ id: string; title: string; githubPrNumber: number; state: string }>;
};

type PullRequest = {
  id: string;
  title: string;
  githubPrNumber: number;
  state: string;
  repository: { id: string; fullName: string };
  reviews: Array<{ id: string; status: string; aiScore: number | null; createdAt: string | Date }>;
};

type Review = {
  id: string;
  status: string;
  aiScore: number | null;
  securityScore: number | null;
  performanceScore: number | null;
  maintainabilityScore: number | null;
  createdAt: string | Date;
  pullRequest: { id: string; title: string; githubPrNumber: number; repository: { fullName: string } };
  comments: Array<{ id: string; severity: "CRITICAL" | "WARNING" | "SUGGESTION" }>;
};

type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string | Date;
};
type AvailableRepo = {
  id: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
};

export function DashboardShell({
  initialRepos,
  initialPrs,
  initialReviews,
  initialNotifications,
  teamCount,
}: {
  initialRepos: Repo[];
  initialPrs: PullRequest[];
  initialReviews: Review[];
  initialNotifications: Notification[];
  teamCount: number;
}) {
  const [repos, setRepos] = useState(initialRepos);
  const [prs] = useState(initialPrs);
  const [reviews] = useState(initialReviews);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [form, setForm] = useState({ fullName: "", githubRepoId: "", teamId: "", installationId: "" });
  const [busyPrId, setBusyPrId] = useState<string | null>(null);
  const [creatingRepo, setCreatingRepo] = useState(false);
  const [repoError, setRepoError] = useState<string>("");
  const [availableRepos, setAvailableRepos] = useState<AvailableRepo[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(true);
  const [connectingRepoId, setConnectingRepoId] = useState<string | null>(null);
  const [repoPage, setRepoPage] = useState(1);
  const [connectedRepoPage, setConnectedRepoPage] = useState(1);
  const [prPage, setPrPage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);
  const [notificationPage, setNotificationPage] = useState(1);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const connectedSet = useMemo(() => new Set(repos.map((repo) => repo.fullName.toLowerCase())), [repos]);
  const reposPerPage = 5;
  const totalRepoPages = Math.max(1, Math.ceil(availableRepos.length / reposPerPage));
  const paginatedRepos = useMemo(
    () => availableRepos.slice((repoPage - 1) * reposPerPage, repoPage * reposPerPage),
    [availableRepos, repoPage],
  );
  const connectedReposPerPage = 5;
  const totalConnectedRepoPages = Math.max(1, Math.ceil(repos.length / connectedReposPerPage));
  const paginatedConnectedRepos = useMemo(
    () => repos.slice((connectedRepoPage - 1) * connectedReposPerPage, connectedRepoPage * connectedReposPerPage),
    [repos, connectedRepoPage],
  );
  const prsPerPage = 5;
  const totalPrPages = Math.max(1, Math.ceil(prs.length / prsPerPage));
  const paginatedPrs = useMemo(() => prs.slice((prPage - 1) * prsPerPage, prPage * prsPerPage), [prs, prPage]);
  const reviewsPerPage = 5;
  const totalReviewPages = Math.max(1, Math.ceil(reviews.length / reviewsPerPage));
  const paginatedReviews = useMemo(
    () => reviews.slice((reviewPage - 1) * reviewsPerPage, reviewPage * reviewsPerPage),
    [reviews, reviewPage],
  );
  const notificationsPerPage = 5;
  const totalNotificationPages = Math.max(1, Math.ceil(notifications.length / notificationsPerPage));
  const paginatedNotifications = useMemo(
    () =>
      notifications.slice(
        (notificationPage - 1) * notificationsPerPage,
        notificationPage * notificationsPerPage,
      ),
    [notifications, notificationPage],
  );

  useEffect(() => {
    async function loadAvailableRepos() {
      setLoadingAvailable(true);
      const res = await fetch("/api/github/repos");
      if (!res.ok) {
        setLoadingAvailable(false);
        return;
      }
      const data = (await res.json()) as { repos: AvailableRepo[] };
      setAvailableRepos(data.repos ?? []);
      setRepoPage(1);
      setLoadingAvailable(false);
    }
    void loadAvailableRepos();
  }, []);

  async function addRepository() {
    if (!form.fullName.trim() || !form.githubRepoId.trim()) {
      setRepoError("Repository name and GitHub Repo ID are required.");
      return;
    }
    setRepoError("");
    setCreatingRepo(true);
    try {
      const payload = {
        fullName: form.fullName,
        githubRepoId: form.githubRepoId,
        installationId: form.installationId || undefined,
        teamId: form.teamId || undefined,
      };
      const res = await fetch("/api/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setRepoError(err.error ?? "Failed to add repository.");
        return;
      }
      const data = await res.json();
      setRepos((prev) => [{ ...data.repo, pullRequests: [] }, ...prev]);
      setForm({ fullName: "", githubRepoId: "", teamId: "", installationId: "" });
      setRepoError("");
    } finally {
      setCreatingRepo(false);
    }
  }

  async function runReview(prId: string) {
    setBusyPrId(prId);
    try {
      await fetch(`/api/pull-requests/${prId}/review`, { method: "POST" });
    } finally {
      setBusyPrId(null);
      window.location.reload();
    }
  }

  async function connectFromGithub(repo: AvailableRepo) {
    setConnectingRepoId(repo.id);
    try {
      const res = await fetch("/api/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: repo.fullName,
          githubRepoId: repo.id,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setRepoError(err.error ?? "Failed to connect repository.");
        return;
      }
      const data = await res.json();
      setRepos((prev) => [{ ...data.repo, pullRequests: [] }, ...prev]);
    } finally {
      setConnectingRepoId(null);
    }
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-5">
        <Metric title="Connected Repositories" value={repos.length} />
        <Metric title="Pull Requests" value={prs.length} />
        <Metric title="AI Reviews" value={reviews.length} />
        <Metric title="Unread Notifications" value={unreadCount} />
        <Metric title="Team Workspaces" value={teamCount} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="GitHub Repositories">
          <div className="space-y-3">
            {loadingAvailable ? <p className="inline-flex items-center gap-2 text-sm text-slate-500"><Spinner /> Loading repositories from GitHub...</p> : null}
            {!loadingAvailable && availableRepos.length === 0 ? <p className="text-sm text-slate-500">No repositories found or token scope missing.</p> : null}
            {paginatedRepos.map((repo) => {
              const connected = connectedSet.has(repo.fullName.toLowerCase());
              return (
                <div key={repo.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <p className="font-medium">{repo.fullName}</p>
                    <p className="text-xs text-slate-500">{repo.private ? "Private" : "Public"} | {repo.defaultBranch}</p>
                  </div>
                  <LoadingButton
                    loading={connectingRepoId === repo.id}
                    loadingText="Connecting..."
                    disabled={connected}
                    onClick={() => connectFromGithub(repo)}
                    className="rounded-md bg-slate-900 px-2 py-1 text-xs text-white disabled:opacity-50 dark:bg-white dark:text-slate-900"
                  >
                    {connected ? "Connected" : "Connect"}
                  </LoadingButton>
                </div>
              );
            })}
            {!loadingAvailable && availableRepos.length > reposPerPage ? (
              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  onClick={() => setRepoPage((p) => Math.max(1, p - 1))}
                  disabled={repoPage === 1}
                  className="rounded-md border px-2 py-1 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-slate-500">
                  Page {repoPage} of {totalRepoPages}
                </span>
                <button
                  onClick={() => setRepoPage((p) => Math.min(totalRepoPages, p + 1))}
                  disabled={repoPage === totalRepoPages}
                  className="rounded-md border px-2 py-1 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel title="Connected Repositories">
          <div className="space-y-3">
            {repos.length === 0 ? <p className="text-sm text-slate-500">No repositories connected yet.</p> : null}
            {paginatedConnectedRepos.map((repo) => (
              <Link key={repo.id} href={`/repositories/${repo.id}`} className="block rounded-xl border p-3 hover:bg-slate-50 dark:hover:bg-slate-900">
                <p className="font-medium">{repo.fullName}</p>
                <p className="text-xs text-slate-500">Branch: {repo.defaultBranch ?? "unknown"} | PRs: {repo.pullRequests.length}</p>
              </Link>
            ))}
            {repos.length > connectedReposPerPage ? (
              <Pager page={connectedRepoPage} totalPages={totalConnectedRepoPages} onPrev={() => setConnectedRepoPage((p) => Math.max(1, p - 1))} onNext={() => setConnectedRepoPage((p) => Math.min(totalConnectedRepoPages, p + 1))} />
            ) : null}
          </div>
        </Panel>

        <Panel title="Add Repository">
          <div className="grid gap-3">
            <input className="rounded-lg border px-3 py-2 text-sm" placeholder="owner/repo" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
            <input className="rounded-lg border px-3 py-2 text-sm" placeholder="GitHub Repo ID" value={form.githubRepoId} onChange={(e) => setForm((f) => ({ ...f, githubRepoId: e.target.value }))} />
            <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Team ID (optional)" value={form.teamId} onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))} />
            <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Installation ID (optional)" value={form.installationId} onChange={(e) => setForm((f) => ({ ...f, installationId: e.target.value }))} />
            {repoError ? <p className="text-xs text-rose-500">{repoError}</p> : null}
            <LoadingButton loading={creatingRepo} loadingText="Adding..." onClick={addRepository} className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white dark:bg-white dark:text-slate-900">
              Connect Repository
            </LoadingButton>
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Recent Pull Requests">
          <div className="space-y-3">
            {prs.length === 0 ? <p className="text-sm text-slate-500">No pull requests synced yet.</p> : null}
            {paginatedPrs.map((pr) => (
              <div key={pr.id} className="rounded-xl border p-3">
                <p className="font-medium">#{pr.githubPrNumber} {pr.title}</p>
                <p className="text-xs text-slate-500">{pr.repository.fullName} | {pr.state}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Link href={`/pull-requests/${pr.id}`} className="rounded-md border px-2 py-1 text-xs">View</Link>
                  <LoadingButton loading={busyPrId === pr.id} loadingText="Running..." onClick={() => runReview(pr.id)} className="rounded-md bg-slate-900 px-2 py-1 text-xs text-white dark:bg-white dark:text-slate-900">
                    Run AI Review
                  </LoadingButton>
                </div>
              </div>
            ))}
            {prs.length > prsPerPage ? (
              <Pager page={prPage} totalPages={totalPrPages} onPrev={() => setPrPage((p) => Math.max(1, p - 1))} onNext={() => setPrPage((p) => Math.min(totalPrPages, p + 1))} />
            ) : null}
          </div>
        </Panel>

        <Panel title="Latest Reviews">
          <div className="space-y-3">
            {reviews.length === 0 ? <p className="text-sm text-slate-500">No reviews yet.</p> : null}
            {paginatedReviews.map((review) => {
              const critical = review.comments.filter((c) => c.severity === "CRITICAL").length;
              const warning = review.comments.filter((c) => c.severity === "WARNING").length;
              return (
                <Link key={review.id} href={`/pull-requests/${review.pullRequest.id}`} className="block rounded-xl border p-3 hover:bg-slate-50 dark:hover:bg-slate-900">
                  <p className="font-medium">{review.pullRequest.repository.fullName} | PR #{review.pullRequest.githubPrNumber}</p>
                  <p className="text-xs text-slate-500">{review.status} | AI {review.aiScore ?? "-"}/100 | Critical {critical} | Warning {warning}</p>
                </Link>
              );
            })}
            {reviews.length > reviewsPerPage ? (
              <Pager page={reviewPage} totalPages={totalReviewPages} onPrev={() => setReviewPage((p) => Math.max(1, p - 1))} onNext={() => setReviewPage((p) => Math.min(totalReviewPages, p + 1))} />
            ) : null}
          </div>
        </Panel>
      </section>

      <Panel title="Notifications">
        <div className="space-y-3">
          {notifications.length === 0 ? <p className="text-sm text-slate-500">No notifications.</p> : null}
          {paginatedNotifications.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 rounded-xl border p-3">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{item.body}</p>
                <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
              {!item.read ? (
                <button onClick={() => markRead(item.id)} className="rounded-md border px-2 py-1 text-xs">Mark read</button>
              ) : (
                <span className="text-xs text-emerald-600">Read</span>
              )}
            </div>
          ))}
          {notifications.length > notificationsPerPage ? (
            <Pager page={notificationPage} totalPages={totalNotificationPages} onPrev={() => setNotificationPage((p) => Math.max(1, p - 1))} onNext={() => setNotificationPage((p) => Math.min(totalNotificationPages, p + 1))} />
          ) : null}
        </div>
      </Panel>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-white/60 p-5 backdrop-blur dark:bg-white/5">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white/60 p-5 backdrop-blur dark:bg-white/5">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Pager({ page, totalPages, onPrev, onNext }: { page: number; totalPages: number; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center justify-between pt-2 text-xs">
      <button onClick={onPrev} disabled={page === 1} className="rounded-md border px-2 py-1 disabled:opacity-50">Previous</button>
      <span className="text-slate-500">Page {page} of {totalPages}</span>
      <button onClick={onNext} disabled={page === totalPages} className="rounded-md border px-2 py-1 disabled:opacity-50">Next</button>
    </div>
  );
}
