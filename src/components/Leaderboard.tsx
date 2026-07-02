"use client";

import type { ScoreEntry } from "../lib/types";

// The daily leaderboard, both as a floating side panel (during play) and a
// centered panel (on the end screen). Empty state invites the first player.
export function Leaderboard({
  entries,
  meIndex,
  variant = "panel",
  title = "TODAY'S TOP",
}: {
  entries: ScoreEntry[];
  meIndex?: number; // highlight this row as "YOU"
  variant?: "panel" | "side";
  title?: string;
}) {
  const rows = entries.slice(0, 10);
  const side = variant === "side";

  return (
    <div
      className={
        side
          ? "absolute right-10 top-[120px] w-[240px] rounded-2xl border border-border bg-panel p-[18px] text-left"
          : "w-[440px] rounded-2xl border border-border bg-panel p-6 text-left"
      }
    >
      <h4 className="mb-3 font-mono text-[13px] tracking-[2px] text-dim">
        {title}
      </h4>

      {rows.length === 0 ? (
        <p className="py-2 font-mono text-[15px] text-dim">
          Be the first today ✦
        </p>
      ) : (
        rows.map((e, i) => (
          <div
            key={`${e.name}-${e.ts}-${i}`}
            className="flex justify-between border-b border-dashed border-border py-[7px] font-mono text-[16px] last:border-0"
            style={i === meIndex ? { color: "var(--a)" } : undefined}
          >
            <span>
              {i + 1} {i === meIndex ? "YOU" : e.name}
            </span>
            <span>{e.score}</span>
          </div>
        ))
      )}
    </div>
  );
}
