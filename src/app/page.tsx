"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bot, GitPullRequest, Lock, Rocket, Shield, Sparkles, TimerReset, Zap } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Security-First Reviews",
    description: "Catch auth bypasses, leaked secrets, injection paths, and risky dependencies before merge.",
  },
  {
    icon: Zap,
    title: "Performance Signals",
    description: "Surface heavy re-renders, expensive loops, network bottlenecks, and cache misuse instantly.",
  },
  {
    icon: Bot,
    title: "AI Suggested Fixes",
    description: "Get concrete corrected code suggestions, not vague feedback, mapped to touched files.",
  },
  {
    icon: GitPullRequest,
    title: "PR-Native Workflow",
    description: "Sync repositories, analyze incoming PRs, and track quality trends per team and repo.",
  },
  {
    icon: TimerReset,
    title: "Faster Review Cycles",
    description: "Reduce human review load and unblock developers with automated first-pass analysis.",
  },
  {
    icon: Lock,
    title: "Production-Ready Controls",
    description: "Built with authenticated access, rate limits, webhook verification, and audit-friendly flows.",
  },
];

const testimonials = [
  {
    quote: "CodePilot catches the stuff reviewers miss at 1 AM. It paid for itself in one week.",
    author: "VP Engineering, Seed-stage SaaS",
  },
  {
    quote: "Our PR turnaround dropped by 37% while quality went up. This is now in our default flow.",
    author: "Platform Lead, Fintech Team",
  },
  {
    quote: "The side-by-side diff with AI fixes is the killer feature. It changes how we review code.",
    author: "Staff Engineer, DevTools Company",
  },
];

const faqs = [
  {
    q: "How does CodePilot integrate with GitHub?",
    a: "Authenticate with GitHub, connect repositories, and sync pull requests. CodePilot analyzes PR diffs and generates review insights with suggested fixes.",
  },
  {
    q: "Can teams collaborate on reviews?",
    a: "Yes. Workspaces support team members, notifications, and shared visibility across repositories and pull requests.",
  },
  {
    q: "Is this only for React/TypeScript?",
    a: "No. It is optimized for modern web stacks but can review general code diffs and repository patterns across projects.",
  },
  {
    q: "Do I need to replace human review?",
    a: "No. CodePilot is an intelligent first-pass reviewer that helps humans focus on high-context decisions.",
  },
];

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 pb-16 pt-10">
      <header className="glass mb-8 rounded-2xl px-5 py-4">
        <nav className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-lg font-semibold">CodePilot AI</Link>
          <div className="flex items-center gap-4 text-sm">
            <a href="#features" className="text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">Features</a>
            <a href="#how-it-works" className="text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">How It Works</a>
            <a href="#faq" className="text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">FAQ</a>
            <Link className="rounded-lg border px-3 py-1.5" href="/pricing">Pricing</Link>
            <Link className="rounded-lg bg-slate-900 px-3 py-1.5 text-white dark:bg-white dark:text-slate-900" href="/login">Sign In</Link>
          </div>
        </nav>
      </header>

      <section className="glass relative overflow-hidden rounded-3xl p-8 md:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="relative z-10 grid items-center gap-10 lg:grid-cols-2">
          <div>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold">
              <Sparkles size={14} />
              AI Review Infrastructure For Serious Teams
            </motion.p>

            <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="text-5xl leading-tight md:text-6xl">
              Merge with confidence.
              <span className="block bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 bg-clip-text text-transparent">
                Ship with velocity.
              </span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-300">
              CodePilot AI reviews every pull request for bugs, security risks, performance regressions, and maintainability debt. Teams get actionable fixes before code reaches production.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mt-8 flex flex-wrap gap-3">
              <Link className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-white dark:bg-white dark:text-slate-900" href="/login">
                Start Free Trial
                <ArrowRight size={16} />
              </Link>
              <Link className="rounded-xl border px-5 py-3" href="/pricing">View Pricing</Link>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="glass rounded-2xl p-4">
            <div className="rounded-xl border p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Live PR Intelligence</p>
              <div className="mt-3 space-y-3 text-sm">
                <Row label="PR #1842" value="security/session-hardening" />
                <Row label="AI Score" value="91 / 100" />
                <Row label="Critical" value="1" danger />
                <Row label="Warnings" value="3" />
                <Row label="Suggested Fixes" value="8" success />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="mt-16">
        <h2 className="text-3xl">Why CodePilot Wins</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Everything teams need to scale code quality without slowing product velocity.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="glass rounded-2xl p-5 transition hover:-translate-y-0.5">
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg border">
                  <Icon size={18} />
                </span>
                <h3 className="text-xl">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="how-it-works" className="mt-16 grid gap-6 lg:grid-cols-3">
        {[
          ["1", "Connect GitHub", "Authenticate and pull repositories into your workspace."],
          ["2", "Sync Pull Requests", "Automatically fetch PR metadata, diffs, and activity."],
          ["3", "Review + Fix", "Get prioritized issues and code-level suggestions instantly."],
        ].map(([step, title, text]) => (
          <div key={step} className="glass rounded-2xl p-5">
            <p className="text-xs font-semibold text-cyan-600">STEP {step}</p>
            <h3 className="mt-2 text-2xl">{title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{text}</p>
          </div>
        ))}
      </section>

      <section id="faq" className="mt-16">
        <h2 className="text-3xl">Trusted by Fast-Moving Teams</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {testimonials.map((item) => (
            <blockquote key={item.author} className="glass rounded-2xl p-5">
              <p className="text-sm">“{item.quote}”</p>
              <footer className="mt-4 text-xs text-slate-500">{item.author}</footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="mt-16 glass rounded-3xl p-8 md:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl">Pricing Built for Scale</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">From solo builders to large engineering orgs.</p>
          </div>
          <Link className="rounded-xl border px-4 py-2" href="/pricing">See Full Pricing</Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Starter", "$29", "50 PR reviews / month"],
            ["Growth", "$99", "300 PR reviews / month"],
            ["Scale", "$299", "Unlimited reviews + priority support"],
          ].map(([name, price, detail]) => (
            <div key={name} className="rounded-2xl border p-5">
              <h3 className="text-xl">{name}</h3>
              <p className="mt-3 text-3xl">{price}</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-3xl">FAQ</h2>
        <div className="mt-6 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="glass rounded-xl p-4">
              <summary className="cursor-pointer font-semibold">{f.q}</summary>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-16 glass rounded-3xl p-8 text-center md:p-12">
        <Rocket className="mx-auto" />
        <h2 className="mt-4 text-4xl">Ready to upgrade your PR workflow?</h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
          Turn every pull request into a quality gate with deep AI review, clear fixes, and team-wide visibility.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link className="rounded-xl bg-slate-900 px-5 py-3 text-white dark:bg-white dark:text-slate-900" href="/login">Start Free Trial</Link>
          <Link className="rounded-xl border px-5 py-3" href="/pricing">Compare Plans</Link>
        </div>
      </section>

      <footer className="mt-12 glass rounded-2xl p-6 text-sm text-slate-500">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <p className="text-base font-semibold text-slate-900 dark:text-white">CodePilot AI</p>
            <p className="mt-2 text-xs">Autonomous pull request intelligence for elite engineering teams.</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide">Product</p>
            <div className="mt-2 flex flex-col gap-2">
              <Link href="/pricing">Pricing</Link>
              <a href="#features">Features</a>
              <a href="#faq">FAQ</a>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide">Company</p>
            <div className="mt-2 flex flex-col gap-2">
              <Link href="/login">Sign In</Link>
              <a href="#how-it-works">How it works</a>
              <a href="mailto:hello@codepilot.ai">Contact</a>
            </div>
          </div>
        </div>
        <div className="mt-6 border-t border-white/10 pt-4 text-xs">
          © {new Date().getFullYear()} CodePilot AI. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

function Row({ label, value, danger, success }: { label: string; value: string; danger?: boolean; success?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <span className={danger ? "text-rose-500" : success ? "text-emerald-500" : ""}>{value}</span>
    </div>
  );
}
