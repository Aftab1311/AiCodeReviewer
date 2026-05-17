"use client";

import { useEffect, useState } from "react";

const commands = [
  { key: "g d", label: "Go to Dashboard", href: "/dashboard" },
  { key: "g t", label: "Go to Team", href: "/team" },
  { key: "g s", label: "Go to Settings", href: "/settings" },
  { key: "g p", label: "Go to Pricing", href: "/pricing" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-black/50 p-6 pt-24" onClick={() => setOpen(false)}>
      <div className="w-full max-w-xl rounded-2xl border bg-white p-4 shadow-2xl dark:bg-slate-950" onClick={(e) => e.stopPropagation()}>
        <p className="mb-3 text-xs uppercase tracking-wider text-slate-500">Command Palette</p>
        <div className="space-y-2">
          {commands.map((command) => (
            <a key={command.key} href={command.href} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-900">
              <span>{command.label}</span>
              <kbd className="rounded bg-slate-200 px-2 py-1 text-xs dark:bg-slate-800">{command.key}</kbd>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
