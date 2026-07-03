"use client";

import type { ScoreEntry } from "../lib/types";

// "TODAY'S TOP" side panel (mockup 4) / score-screen board. Local-only,
// resets each calendar day.
export function Leaderboard({
  board,
  highlightTs,
  className = "",
}: {
  board: ScoreEntry[];
  highlightTs?: number;
  className?: string;
}) {
  return (
    <div
      className={`w-[238px] rounded-2xl border border-border bg-surface p-[18px] text-left shadow-[0_10px_28px_rgba(30,41,59,0.07)] ${className}`}
    >
      <h4 className="mb-3 font-mono text-[12px] tracking-[2px] text-dim-2">
        TODAY&apos;S TOP
      </h4>
      {board.length === 0 ? (
        <div className="py-[7px] font-mono text-[15px] text-slate-ink">
          Be the first today
        </div>
      ) : (
        board.slice(0, 5).map((e, i) => (
          <div
            key={`${e.ts}-${i}`}
            className={`flex justify-between border-b border-border-soft py-[7px] font-mono text-[15px] ${
              highlightTs === e.ts ? "font-bold text-primary" : "text-slate-ink"
            }`}
          >
            <span>
              {i + 1} {e.name}
            </span>
            <span>{e.score.toLocaleString()}</span>
          </div>
        ))
      )}
    </div>
  );
}
