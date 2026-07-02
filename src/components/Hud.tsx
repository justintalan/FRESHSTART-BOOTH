"use client";

import type { ReactNode } from "react";

// A single mono HUD pill, e.g. ⏱ 0:12 / SCORE 840 / COMBO x3.
export function Pill({
  label,
  value,
}: {
  label?: ReactNode;
  value: ReactNode;
}) {
  return (
    <span className="rounded-xl border border-border bg-panel px-[18px] py-3 font-mono text-[20px]">
      {label ? <span>{label} </span> : null}
      <b style={{ color: "var(--a)" }}>{value}</b>
    </span>
  );
}

// Format seconds as m:ss.
export function fmtClock(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

// Row of HUD pills.
export function Hud({ children }: { children: ReactNode }) {
  return <div className="mb-6 flex items-center gap-[14px]">{children}</div>;
}

// The lime→rose timer bar used in the debug sprint. progress = 0..1 remaining.
export function TimerBar({ progress }: { progress: number }) {
  return (
    <div className="h-[14px] w-[520px] overflow-hidden rounded-full border border-border bg-panel">
      <div
        className="h-full"
        style={{
          width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
          background: "linear-gradient(90deg,#a3e635,#fb7185)",
          transition: "width .1s linear",
        }}
      />
    </div>
  );
}
