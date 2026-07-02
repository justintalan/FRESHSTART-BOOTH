"use client";

import type { ReactNode } from "react";

// Small shared presentational bits used across several games.

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 font-mono text-[15px] uppercase tracking-[3px] text-dim">
      {children}
    </div>
  );
}

// Progress dots (e.g. 4 sorter questions). `total` dots, `current` filled.
export function ProgressDots({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  return (
    <div className="mb-6 flex gap-[10px]">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="h-[14px] w-[14px] rounded-full"
          style={{ background: i <= current ? "var(--a)" : "#1f2a3d" }}
        />
      ))}
    </div>
  );
}

// The dashed lime play-prize badge.
export function PrizeBadge({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 inline-flex gap-[10px] rounded-full border border-dashed border-lime px-[22px] py-3 font-mono text-[16px] text-lime">
      {children}
    </div>
  );
}

// The big gradient CTA button.
export function BigButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="mt-[34px] rounded-[14px] grad-fill px-10 py-5 text-[22px] font-bold text-[#04121a] transition-transform active:scale-95"
    >
      {children}
    </button>
  );
}

// The circular avatar used on reveal screens.
export function Avatar({ emoji }: { emoji: ReactNode }) {
  return (
    <div
      className="mb-2 grid h-[180px] w-[180px] place-items-center rounded-full text-[92px]"
      style={{
        background: "radial-gradient(circle at 30% 30%,#1c2740,#0c1220)",
        border: "2px solid var(--a)",
      }}
    >
      {emoji}
    </div>
  );
}

// A generic subheading paragraph.
export function Sub({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 max-w-[720px] text-[22px] text-dim-2">{children}</div>
  );
}
