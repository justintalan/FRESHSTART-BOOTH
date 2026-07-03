"use client";

import type { ReactNode } from "react";

// Small shared primitives from the mockups: kicker line, primary button,
// prize pill.

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <div className="mb-[14px] font-mono text-[14px] uppercase tracking-[3px] text-dim">
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`grad-fill min-h-16 rounded-[14px] px-[42px] py-[19px] text-[22px] font-bold text-white shadow-[0_12px_30px_rgba(37,99,235,0.28)] transition-transform active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}

export function PrizeBadge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-[10px] rounded-full border border-primary-soft-border bg-primary-soft px-[22px] py-[11px] font-mono text-[15px] text-primary ${className}`}
    >
      {children}
    </div>
  );
}
