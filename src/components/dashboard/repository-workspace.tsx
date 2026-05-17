"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LoadingButton } from "@/components/ui/loading-button";

type RepoData = {
  id: string;
  fullName: string;
  defaultBranch: string | null;
  pullRequests: Array<{
    id: string;
    githubPrNumber: number;
    title: string;
    state: string;
    headBranch: string;
    baseBranch: string;
    updatedAt: string | Date;
    reviews: Array<{
      id: string;
      status: string;
      aiScore: number | null;
      securityScore: number | null;
      performanceScore: number | null;
      maintainabilityScore: number | null;
      createdAt: string | Date;
      comments: Array<{ id: string; severity: "CRITICAL" | "WARNING" | "SUGGESTION" }>;
    }>;
  }>;
};

type FileNode = { path: string; sha: string; size: number };

export function RepositoryWorkspace({ repo }: { repo: RepoData }) {
  const [syncing, setSyncing] = useState(false);
  const [runningReview, setRunningReview] = useState<string | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState("");
  const [prPage, setPrPage] = useState(1);
  const [filePage, setFilePage] = useState(1);
  const [findingPage, setFindingPage] = useState(1);

  const summary = useMemo(() => {
    const reviews = repo.pullRequests.flatMap((pr) => pr.reviews);
    const critical = reviews.reduce((acc, r) => acc + r.comments.filter((c) => c.severity === "CRITICAL").length, 0);
    const warnings = reviews.reduce((acc, r) => acc + r.comments.filter((c) => c.severity === "WARNING").length, 0);
    return { reviews: reviews.length, critical, warnings };
  }, [repo.pullRequests]);
  const prsPerPage = 5;
  const totalPrPages = Math.max(1, Math.ceil(repo.pullRequests.length / prsPerPage));
  const paginatedPrs = useMemo(
    () => repo.pullRequests.slice((prPage - 1) * prsPerPage, prPage * prsPerPage),
    [repo.pullRequests, prPage],
  );
  const filesPerPage = 10;
  const totalFilePages = Math.max(1, Math.ceil(files.length / filesPerPage));
  const paginatedFiles = useMemo(
    () => files.slice((filePage - 1) * filesPerPage, filePage * filesPerPage),
    [files, filePage],
  );
  const allFindings = useMemo(
    () => repo.pullRequests.flatMap((pr) => pr.reviews.map((review) => ({ pr, review }))),
    [repo.pullRequests],
  );
  const findingsPerPage = 6;
  const totalFindingPages = Math.max(1, Math.ceil(allFindings.length / findingsPerPage));
  const paginatedFindings = useMemo(
    () => allFindings.slice((findingPage - 1) * findingsPerPage, findingPage * findingsPerPage),
    [allFindings, findingPage],
  );

  async function syncPullRequests() {
    setSyncing(true);
    setError("");
    try {
      const res = await fetch(`/api/repositories/${repo.id}/sync`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to sync repository");
        return;
      }
      window.location.reload();
    } finally {
      setSyncing(false);
    }
  }

  async function runReview(prId: string) {
    setRunningReview(prId);
    setError("");
    try {
      const res = await fetch(`/api/pull-requests/${prId}/review`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to run AI review");
        return;
      }
      window.location.reload();
    } finally {
      setRunningReview(null);
    }
  }

  async function loadTree() {
    setLoadingFiles(true);
    setError("");
    try {
      const res = await fetch(`/api/repositories/${repo.id}/tree`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to load code tree");
        return;
      }
      const data = (await res.json()) as { files: FileNode[] };
      setFiles(data.files);
    } finally {
      setLoadingFiles(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <Metric title="Pull Requests" value={repo.pullRequests.length} />
        <Metric title="AI Reviews" value={summary.reviews} />
        <Metric title="Critical Findings" value={summary.critical} />
        <Metric title="Warning Findings" value={summary.warnings} />
      </section>

      <section className="flex flex-wrap gap-3">
        <LoadingButton loading={syncing} loadingText="Syncing..." onClick={syncPullRequests} className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-slate-900">
          Sync Pull Requests
        </LoadingButton>
        <LoadingButton loading={loadingFiles} loadingText="Loading Code Tree..." onClick={loadTree} className="rounded-lg border px-4 py-2 text-sm">
          Load Code Tree
        </LoadingButton>
      </section>

      {error ? <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-600">{error}</p> : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Repository Pull Requests">
          <div className="space-y-3">
            {repo.pullRequests.length === 0 ? <p className="text-sm text-slate-500">No PRs yet. Click Sync Pull Requests.</p> : null}
            {paginatedPrs.map((pr) => {
              const latest = pr.reviews[0];
              return (
                <div key={pr.id} className="rounded-xl border p-3">
                  <p className="font-medium">#{pr.githubPrNumber} {pr.title}</p>
                  <p className="text-xs text-slate-500">{pr.baseBranch} ? {pr.headBranch} | {pr.state}</p>
                  {latest ? (
                    <p className="mt-1 text-xs text-slate-500">Latest review: {latest.status} | AI {latest.aiScore ?? "-"}/100</p>
                  ) : null}
                  <div className="mt-2 flex items-center gap-2">
                    <Link href={`/pull-requests/${pr.id}`} className="rounded-md border px-2 py-1 text-xs">Open PR Workspace</Link>
                    <LoadingButton loading={runningReview === pr.id} loadingText="Running..." onClick={() => runReview(pr.id)} className="rounded-md bg-slate-900 px-2 py-1 text-xs text-white dark:bg-white dark:text-slate-900">
                      Run AI Review
                    </LoadingButton>
                  </div>
                </div>
              );
            })}
            {repo.pullRequests.length > prsPerPage ? (
              <Pager page={prPage} totalPages={totalPrPages} onPrev={() => setPrPage((p) => Math.max(1, p - 1))} onNext={() => setPrPage((p) => Math.min(totalPrPages, p + 1))} />
            ) : null}
          </div>
        </Panel>

        <Panel title="Code Tree">
          <div className="max-h-[420px] space-y-2 overflow-auto pr-2">
            {files.length === 0 ? <p className="text-sm text-slate-500">Load repository code tree to browse files.</p> : null}
            {paginatedFiles.map((file) => (
              <div key={file.sha + file.path} className="rounded-lg border px-3 py-2 text-sm">
                <p className="truncate font-mono text-xs">{file.path}</p>
                <p className="text-[11px] text-slate-500">{file.size} bytes</p>
              </div>
            ))}
            {files.length > filesPerPage ? (
              <Pager page={filePage} totalPages={totalFilePages} onPrev={() => setFilePage((p) => Math.max(1, p - 1))} onNext={() => setFilePage((p) => Math.min(totalFilePages, p + 1))} />
            ) : null}
          </div>
        </Panel>
      </section>

      <Panel title="Review Findings">
        <div className="space-y-3">
          {allFindings.length === 0 ? <p className="text-sm text-slate-500">No review findings yet.</p> : null}
          {paginatedFindings.map(({ pr, review }) => {
            const critical = review.comments.filter((c) => c.severity === "CRITICAL").length;
            const warning = review.comments.filter((c) => c.severity === "WARNING").length;
            const suggestion = review.comments.filter((c) => c.severity === "SUGGESTION").length;
            return (
              <Link key={review.id} href={`/pull-requests/${pr.id}`} className="block rounded-xl border p-3 hover:bg-slate-50 dark:hover:bg-slate-900">
                <p className="font-medium">PR #{pr.githubPrNumber}: {pr.title}</p>
                <p className="text-xs text-slate-500">
                  {review.status} | AI {review.aiScore ?? "-"}/100 | Critical {critical} | Warning {warning} | Suggestion {suggestion}
                </p>
              </Link>
            );
          })}
          {allFindings.length > findingsPerPage ? (
            <Pager page={findingPage} totalPages={totalFindingPages} onPrev={() => setFindingPage((p) => Math.max(1, p - 1))} onNext={() => setFindingPage((p) => Math.min(totalFindingPages, p + 1))} />
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
