"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingButton } from "@/components/ui/loading-button";

type ReviewComment = {
  id: string;
  filePath: string;
  line: number;
  severity: "CRITICAL" | "WARNING" | "SUGGESTION";
  title: string;
  body: string;
  suggestion: string | null;
};

type Review = {
  id: string;
  status: string;
  summary: string | null;
  aiScore: number | null;
  maintainabilityScore: number | null;
  securityScore: number | null;
  performanceScore: number | null;
  createdAt: string | Date;
  comments: ReviewComment[];
};

type DiffBlock = {
  filePath: string;
  lines: Array<{ type: "add" | "del" | "ctx" | "meta"; text: string }>;
};

type PRData = {
  id: string;
  title: string;
  body: string | null;
  state: string;
  githubPrNumber: number;
  baseBranch: string;
  headBranch: string;
  url: string;
  repository: { id: string; fullName: string };
  reviews: Review[];
};

export function PullRequestWorkspace({ pr }: { pr: PRData }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [diffBlocks, setDiffBlocks] = useState<DiffBlock[]>([]);
  const [error, setError] = useState("");
  const [isDiffOpen, setIsDiffOpen] = useState(true);
  const [diffPage, setDiffPage] = useState(1);
  const [findingFilePage, setFindingFilePage] = useState(1);
  const [githubMeta, setGithubMeta] = useState<{
    state: string;
    merged: boolean;
    comments: number;
    reviewComments: number;
    updatedAt: string;
  } | null>(null);

  const latestReview = pr.reviews[0];
  const allComments = pr.reviews.flatMap((r) => r.comments);
  const donePoints = latestReview?.summary
    ? latestReview.summary.split(/\.\s+/).map((s) => s.trim()).filter(Boolean).slice(0, 4)
    : [];
  const criticalCount = allComments.filter((c) => c.severity === "CRITICAL").length;
  const warningCount = allComments.filter((c) => c.severity === "WARNING").length;
  const suggestionCount = allComments.filter((c) => c.severity === "SUGGESTION").length;
  const improvementPlan = useMemo(() => {
    if (!latestReview) return [];
    const items: string[] = [];
    if ((latestReview.securityScore ?? 0) < 90) {
      items.push("Harden input validation, auth checks, and secret handling to improve Security score.");
    }
    if ((latestReview.performanceScore ?? 0) < 90) {
      items.push("Optimize heavy code paths, reduce repeated work, and improve data-fetch patterns for Performance.");
    }
    if ((latestReview.maintainabilityScore ?? 0) < 90) {
      items.push("Refactor large functions, remove duplicate logic, and improve naming for Maintainability.");
    }
    if (criticalCount > 0) {
      items.push(`Resolve all ${criticalCount} critical finding(s) first; these block a high confidence merge.`);
    }
    if (warningCount > 0) {
      items.push(`Address ${warningCount} warning finding(s) next to raise overall AI score.`);
    }
    if (items.length === 0) {
      items.push("Great job. Focus on minor suggestions and additional tests to approach a perfect 100.");
    }
    return items;
  }, [latestReview, criticalCount, warningCount]);

  const groupedComments = useMemo(() => {
    const map = new Map<string, ReviewComment[]>();
    for (const comment of allComments) {
      const key = comment.filePath || "unknown";
      const arr = map.get(key) || [];
      arr.push(comment);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [allComments]);
  const diffPerPage = 4;
  const totalDiffPages = Math.max(1, Math.ceil(diffBlocks.length / diffPerPage));
  const paginatedDiffBlocks = useMemo(
    () => diffBlocks.slice((diffPage - 1) * diffPerPage, diffPage * diffPerPage),
    [diffBlocks, diffPage],
  );
  const findingsPerPage = 4;
  const totalFindingFilePages = Math.max(1, Math.ceil(groupedComments.length / findingsPerPage));
  const paginatedGroupedComments = useMemo(
    () =>
      groupedComments.slice(
        (findingFilePage - 1) * findingsPerPage,
        findingFilePage * findingsPerPage,
      ),
    [groupedComments, findingFilePage],
  );

  useEffect(() => {
    async function loadMeta() {
      const res = await fetch(`/api/pull-requests/${pr.id}/meta`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        state: string;
        merged: boolean;
        comments: number;
        reviewComments: number;
        updatedAt: string;
      };
      setGithubMeta(data);
    }
    void loadMeta();
  }, [pr.id]);

  useEffect(() => {
    const saved = window.sessionStorage.getItem(`pr-diff-open-${pr.id}`);
    if (saved === "0") setIsDiffOpen(false);
  }, [pr.id]);

  useEffect(() => {
    window.sessionStorage.setItem(`pr-diff-open-${pr.id}`, isDiffOpen ? "1" : "0");
  }, [pr.id, isDiffOpen]);
  const suggestionByFile = useMemo(() => {
    const map = new Map<string, ReviewComment[]>();
    for (const comment of allComments) {
      if (!comment.suggestion) continue;
      const arr = map.get(comment.filePath) || [];
      arr.push(comment);
      map.set(comment.filePath, arr);
    }
    return map;
  }, [allComments]);

  async function loadDiffData() {
    const res = await fetch(`/api/pull-requests/${pr.id}/diff`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Failed to load diff");
    }
    const data = (await res.json()) as { blocks: DiffBlock[] };
    setDiffBlocks(data.blocks || []);
  }

  async function runCombinedReview() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/pull-requests/${pr.id}/review`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Failed to run review");
        return;
      }
      setIsDiffOpen(true);
      await loadDiffData();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-5">
        <Metric title="PR State" value={(githubMeta?.state ?? pr.state).toUpperCase()} />
        <Metric title="AI Score" value={`${latestReview?.aiScore ?? "-"}/100`} />
        <Metric title="Security" value={`${latestReview?.securityScore ?? "-"}/100`} />
        <Metric title="Performance" value={`${latestReview?.performanceScore ?? "-"}/100`} />
        <Metric title="Maintainability" value={`${latestReview?.maintainabilityScore ?? "-"}/100`} />
      </section>
      {githubMeta ? (
        <section className="grid gap-4 md:grid-cols-3">
          <Metric title="GitHub Comments" value={`${githubMeta.comments}`} />
          <Metric title="Review Comments" value={`${githubMeta.reviewComments}`} />
          <Metric title="Merged" value={githubMeta.merged ? "YES" : "NO"} />
        </section>
      ) : null}

      <section className="rounded-2xl border bg-white/60 p-5 backdrop-blur dark:bg-white/5">
        <h2 className="text-lg font-semibold">PR Metadata</h2>
        <p className="mt-2 text-sm text-slate-500">Repository: {pr.repository.fullName}</p>
        <p className="text-sm text-slate-500">Branches: {pr.baseBranch} ← {pr.headBranch}</p>
        <a href={pr.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-cyan-600 hover:underline">Open on GitHub</a>
        {pr.body ? <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{pr.body}</p> : null}
        <div className="mt-4 flex gap-2">
          <LoadingButton loading={busy} loadingText="Analyzing PR..." onClick={runCombinedReview} className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-slate-900">
            Run AI Review + Load Diff
          </LoadingButton>
          {!isDiffOpen ? (
            <button onClick={() => setIsDiffOpen(true)} className="rounded-lg border px-4 py-2 text-sm">
              Open Diff Viewer
            </button>
          ) : null}
        </div>
      </section>

      {error ? <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-600">{error}</p> : null}

      {isDiffOpen ? (
        <Panel title="Diff Viewer">
          <div className="mb-3 flex justify-end">
            <button onClick={() => setIsDiffOpen(false)} className="rounded-md border px-3 py-1 text-xs">
              Close Diff Viewer
            </button>
          </div>
          <div className="space-y-4">
            {diffBlocks.length === 0 ? <p className="text-sm text-slate-500">Run AI Review + Load Diff to view changed files.</p> : null}
            {paginatedDiffBlocks.map((block) => (
              <div key={block.filePath} className="overflow-hidden rounded-xl border">
                <div className="border-b bg-slate-100 px-3 py-2 text-xs font-mono dark:bg-slate-900">{block.filePath}</div>
                <div className="grid gap-0 lg:grid-cols-2">
                  <div className="border-r">
                    <div className="border-b px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Pushed Code</div>
                    <pre className="max-h-[420px] overflow-auto p-3 text-xs leading-5">
                      {block.lines.map((line, idx) => (
                        <div
                          key={`${block.filePath}-${idx}`}
                          className={
                            line.type === "add"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : line.type === "del"
                                ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                                : line.type === "meta"
                                  ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
                                  : "text-slate-700 dark:text-slate-300"
                          }
                        >
                          {line.text || " "}
                        </div>
                      ))}
                    </pre>
                  </div>
                  <div>
                    <div className="border-b px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">AI Suggested Code</div>
                    <div className="max-h-[420px] space-y-2 overflow-auto p-3 text-xs">
                      {(suggestionByFile.get(block.filePath) || []).length === 0 ? (
                        <p className="text-slate-500">No code suggestion for this file yet.</p>
                      ) : (
                        (suggestionByFile.get(block.filePath) || []).map((comment) => (
                          <div key={comment.id} className="rounded-lg border p-2">
                            <p className="mb-1 text-[11px] font-semibold">
                              L{comment.line} · {comment.title}
                            </p>
                            <p className="mb-2 text-slate-600 dark:text-slate-300">{comment.body}</p>
                            <pre className="overflow-auto rounded bg-emerald-500/10 p-2 text-emerald-800 dark:text-emerald-300">
                              {comment.suggestion}
                            </pre>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {diffBlocks.length > diffPerPage ? (
              <Pager page={diffPage} totalPages={totalDiffPages} onPrev={() => setDiffPage((p) => Math.max(1, p - 1))} onNext={() => setDiffPage((p) => Math.min(totalDiffPages, p + 1))} />
            ) : null}
          </div>
        </Panel>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Review Summary">
          {latestReview ? (
            <>
              <p className="text-sm">Status: {latestReview.status}</p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{latestReview.summary ?? "No summary yet."}</p>
            </>
          ) : (
            <p className="text-sm text-slate-500">No reviews yet. Run AI review.</p>
          )}
        </Panel>

        <Panel title="Findings By File">
          <div className="max-h-[320px] space-y-3 overflow-auto pr-2">
            {groupedComments.length === 0 ? <p className="text-sm text-slate-500">No findings yet.</p> : null}
            {paginatedGroupedComments.map(([file, comments]) => (
              <div key={file} className="rounded-xl border p-3">
                <p className="font-mono text-xs">{file}</p>
                <div className="mt-2 space-y-2">
                  {comments.map((comment) => (
                    <div key={comment.id} className="rounded-lg border p-2 text-xs">
                      <p className="font-semibold">{comment.severity} · L{comment.line} · {comment.title}</p>
                      <p className="mt-1 text-slate-600 dark:text-slate-300">{comment.body}</p>
                      {comment.suggestion ? <p className="mt-1 text-emerald-700 dark:text-emerald-300">Suggestion: {comment.suggestion}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {groupedComments.length > findingsPerPage ? (
              <Pager page={findingFilePage} totalPages={totalFindingFilePages} onPrev={() => setFindingFilePage((p) => Math.max(1, p - 1))} onNext={() => setFindingFilePage((p) => Math.min(totalFindingFilePages, p + 1))} />
            ) : null}
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Panel title="What Was Done">
          {donePoints.length ? (
            <ul className="space-y-2 text-sm">
              {donePoints.map((point, idx) => (
                <li key={idx} className="rounded-lg border p-2">
                  {point.endsWith(".") ? point : `${point}.`}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Run AI review to generate completion summary.</p>
          )}
        </Panel>

        <Panel title="What Can Be Improved">
          {allComments.length ? (
            <ul className="space-y-2 text-sm">
              {allComments.slice(0, 6).map((c) => (
                <li key={c.id} className="rounded-lg border p-2">
                  <span className="font-semibold">{c.severity}</span> · {c.title} ({c.filePath}:{c.line})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No issues found yet.</p>
          )}
        </Panel>

        <Panel title="How To Reach 100">
          <ul className="space-y-2 text-sm">
            {improvementPlan.map((item, idx) => (
              <li key={idx} className="rounded-lg border p-2">
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Current findings: Critical {criticalCount}, Warning {warningCount}, Suggestion {suggestionCount}.
          </p>
        </Panel>
      </section>

    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white/60 p-5 backdrop-blur dark:bg-white/5">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
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
