"use client";

import { useMemo, useState } from "react";
import { GameShell } from "../../components/GameShell";
import { Kicker, BigButton } from "../../components/Bits";
import { PathReveal } from "../../components/PathReveal";
import { EndActions } from "../../components/EndActions";
import { PATHS } from "../../lib/paths";
import type { PathMeta } from "../../lib/paths";
import type { PathId } from "../../lib/types";

// One gadget tile in the rig grid. `weights` are the PathIds it contributes a
// point to when selected.
interface Gadget {
  emoji: string;
  label: string;
  weights: PathId[];
}

// 12 gadgets, multi-select. Weights chosen so all four paths are reachable:
//   builder  ← 💻 ⌨️ 🎧 ☕ 🕹️
//   analyst  ← 🖱️ 📱 📷
//   architect← 🖥️ 🖊️ (+🗄️)
//   guardian ← 🔦 (+🗄️)
const GADGETS: Gadget[] = [
  { emoji: "💻", label: "laptop", weights: ["builder"] },
  { emoji: "⌨️", label: "mechanical keyboard", weights: ["builder"] },
  { emoji: "🖥️", label: "big monitor", weights: ["architect"] },
  { emoji: "🎧", label: "headphones", weights: ["builder"] },
  { emoji: "☕", label: "coffee", weights: ["builder"] },
  { emoji: "🖱️", label: "mouse", weights: ["analyst"] },
  { emoji: "📱", label: "phone", weights: ["analyst"] },
  { emoji: "🕹️", label: "controller", weights: ["builder"] },
  { emoji: "🗄️", label: "server / NAS", weights: ["guardian", "architect"] },
  { emoji: "🔦", label: "pentest tool", weights: ["guardian"] },
  { emoji: "🖊️", label: "design stylus", weights: ["architect"] },
  { emoji: "📷", label: "camera", weights: ["analyst"] },
];

// argmax tally with a fixed tie-break order.
const TIE_BREAK: PathId[] = ["builder", "guardian", "analyst", "architect"];

function winningPath(selected: Set<number>): PathMeta {
  const tally: Record<PathId, number> = {
    builder: 0,
    guardian: 0,
    analyst: 0,
    architect: 0,
  };
  selected.forEach((i) => {
    GADGETS[i].weights.forEach((p) => {
      tally[p] += 1;
    });
  });
  let best: PathId = TIE_BREAK[0];
  let bestScore = -1;
  for (const p of TIE_BREAK) {
    if (tally[p] > bestScore) {
      bestScore = tally[p];
      best = p;
    }
  }
  return PATHS[best];
}

type Phase = "pick" | "reveal";

export default function BuildSetup() {
  const [phase, setPhase] = useState<Phase>("pick");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const selectedList = useMemo(
    () => GADGETS.filter((_, i) => selected.has(i)),
    [selected],
  );

  function toggle(i: number): void {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function restart(): void {
    setSelected(new Set());
    setPhase("pick");
  }

  const hasSelection = selected.size > 0;
  const path = useMemo(() => winningPath(selected), [selected]);

  return (
    <GameShell ribbon="05 · BUILD YOUR SETUP" accent="#22d3ee">
      {phase === "pick" ? (
        <div className="flex flex-col items-center">
          <Kicker>Tap what&apos;s on your desk</Kicker>
          <h1 className="mb-[18px] text-[54px] font-bold leading-[1.05]">
            BUILD YOUR <span className="grad">RIG</span>
          </h1>

          <div
            className="grid w-[720px] gap-[14px]"
            style={{ gridTemplateColumns: "repeat(6,1fr)" }}
          >
            {GADGETS.map((g, i) => {
              const on = selected.has(i);
              return (
                <button
                  key={g.emoji}
                  onClick={() => toggle(i)}
                  aria-pressed={on}
                  aria-label={g.label}
                  className="grid aspect-square min-h-[64px] place-items-center rounded-2xl border bg-panel text-[38px] transition-all active:scale-95"
                  style={{
                    borderColor: on ? "#22d3ee" : "var(--border, #1f2a3d)",
                    boxShadow: on ? "0 0 22px rgba(34,211,238,.35)" : "none",
                  }}
                >
                  {g.emoji}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-panel px-5 py-3 font-mono">
            <span className="text-dim">YOUR RIG:</span>
            {selectedList.length === 0 ? (
              <span className="text-dim-2">nothing yet</span>
            ) : (
              selectedList.map((g) => (
                <span
                  key={g.emoji}
                  className="rounded-lg border border-border px-3 py-1.5 text-[24px]"
                  style={{ background: "#16213a" }}
                >
                  {g.emoji}
                </span>
              ))
            )}
          </div>

          <div
            className={hasSelection ? "" : "pointer-events-none opacity-40"}
            aria-disabled={!hasSelection}
          >
            <BigButton onClick={hasSelection ? () => setPhase("reveal") : undefined}>
              REVEAL MY PATH →
            </BigButton>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <PathReveal path={path} />
          <EndActions onPlayAgain={restart} />
        </div>
      )}
    </GameShell>
  );
}
