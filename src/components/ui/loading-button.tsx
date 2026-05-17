"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export function LoadingButton({
  loading,
  children,
  loadingText,
  className,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  loading: boolean;
  loadingText?: string;
  children: ReactNode;
}) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${className ?? ""} inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {loading ? <Spinner /> : null}
      <span>{loading ? loadingText ?? "Processing..." : children}</span>
    </button>
  );
}

export function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />;
}
