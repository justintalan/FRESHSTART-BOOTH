"use client";

// Debug Sprint HUD: score / bugs found / next-bug-value pills (mockup 4).
export function Hud({
  score,
  found,
  total,
  nextBugValue,
}: {
  score: number;
  found: number;
  total: number;
  nextBugValue: number;
}) {
  const pill =
    "rounded-xl border border-border bg-surface px-[18px] py-3 font-mono text-[19px] text-ink-2 shadow-[0_4px_12px_rgba(30,41,59,0.05)]";
  return (
    <div className="mb-[22px] flex items-center gap-[14px]">
      <span className={pill}>
        SCORE <b className="text-primary">{score}</b>
      </span>
      <span className={pill}>
        BUGS{" "}
        <b className="text-primary">
          {found} / {total}
        </b>
      </span>
      <span className={pill}>
        NEXT BUG <b className="text-primary">+{nextBugValue}</b>
      </span>
    </div>
  );
}
