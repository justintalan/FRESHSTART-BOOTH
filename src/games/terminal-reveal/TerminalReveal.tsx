"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameShell } from "../../components/GameShell";
import { EndActions } from "../../components/EndActions";
import { PATHS } from "../../lib/paths";
import type { PathId } from "../../lib/paths";

// ── Quiz data ────────────────────────────────────────────────────────────────
// Each option awards +1 to a PathId. Options rotate across the three questions
// so all four paths (builder / guardian / analyst / architect) stay reachable.
interface Option {
  label: string;
  path: PathId;
}
interface Question {
  prompt: string;
  options: Option[];
}

const QUESTIONS: Question[] = [
  {
    prompt: "> something just broke. you:",
    options: [
      { label: "dive in and fix it", path: "builder" },
      { label: "rebuild it, better this time", path: "architect" },
      { label: "lock it down first", path: "guardian" },
    ],
  },
  {
    prompt: "> a new project lands. you reach for:",
    options: [
      { label: "your keyboard, start coding", path: "builder" },
      { label: "a whiteboard, map it out", path: "architect" },
      { label: "the data, find the pattern", path: "analyst" },
    ],
  },
  {
    prompt: "> your favorite kind of win:",
    options: [
      { label: "it finally runs", path: "builder" },
      { label: "nothing got breached", path: "guardian" },
      { label: "the numbers tell a story", path: "analyst" },
    ],
  },
];

type Tallies = Record<PathId, number>;
const EMPTY_TALLIES: Tallies = {
  builder: 0,
  guardian: 0,
  analyst: 0,
  architect: 0,
};

// argmax with tie-break order builder → guardian → analyst → architect.
function computeWinner(t: Tallies): PathId {
  const order: PathId[] = ["builder", "guardian", "analyst", "architect"];
  let best: PathId = order[0];
  let bestN = -1;
  for (const p of order) {
    if (t[p] > bestN) {
      bestN = t[p];
      best = p;
    }
  }
  return best;
}

type Phase = "quiz" | "analyzing" | "reveal";

// Shared line-color helpers (mirrors the mockup's .c2 / .pr classes).
const C2 = "text-[#7c8aa5]"; // dim gray comment line
const PR = "text-[#a3e635]"; // lime prompt line

export default function TerminalReveal() {
  const [phase, setPhase] = useState<Phase>("quiz");
  const [qIndex, setQIndex] = useState(0);
  const [tallies, setTallies] = useState<Tallies>(EMPTY_TALLIES);

  // Per-line typewriter reveal: `vis` counts how many body lines are shown.
  const [vis, setVis] = useState(0);

  const qIndexRef = useRef(qIndex);
  qIndexRef.current = qIndex;

  // Record an answer for the current question, then advance.
  const answer = useCallback((path: PathId) => {
    setTallies((prev) => ({ ...prev, [path]: prev[path] + 1 }));
    setQIndex((prev) => {
      const next = prev + 1;
      if (next >= QUESTIONS.length) {
        setPhase("analyzing");
        return prev;
      }
      return next;
    });
  }, []);

  const restart = useCallback(() => {
    setPhase("quiz");
    setQIndex(0);
    setTallies(EMPTY_TALLIES);
    setVis(0);
  }, []);

  // Typewriter: stagger the visible lines of the current question (~0.9s total).
  useEffect(() => {
    if (phase !== "quiz") return;
    setVis(0);
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setVis(n);
      if (n >= 8) window.clearInterval(id);
    }, 110);
    return () => window.clearInterval(id);
  }, [qIndex, phase]);

  // "> analyzing ..." beat before the reveal.
  useEffect(() => {
    if (phase !== "analyzing") return;
    const id = window.setTimeout(() => setPhase("reveal"), 800);
    return () => window.clearTimeout(id);
  }, [phase]);

  // Physical keys 1 / 2 / 3 mirror tapping the option rows.
  useEffect(() => {
    if (phase !== "quiz") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "1" || e.key === "2" || e.key === "3") {
        const q = QUESTIONS[qIndexRef.current];
        const opt = q.options[Number(e.key) - 1];
        if (opt) answer(opt.path);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, answer]);

  const winner = useMemo(() => computeWinner(tallies), [tallies]);
  const path = PATHS[winner];

  // Two lowercase lines drawn from the path blurb (matches the reveal mockup).
  const blurbLines = useMemo(() => {
    return path.blurb
      .split(". ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s.replace(/\.$/, "").toLowerCase());
  }, [path.blurb]);

  const headerN = phase === "quiz" ? qIndex + 1 : 3;

  return (
    <GameShell ribbon="02 · TERMINAL REVEAL" accent="#34d399">
      <div className="flex flex-col items-center">
        {/* Terminal window */}
        <div className="w-[900px] max-w-full overflow-hidden rounded-2xl border border-border bg-[#0b1020] text-left">
          {/* Title bar */}
          <div className="flex items-center bg-[#131b2e] px-[18px] py-[14px] font-mono text-[14px] text-dim">
            <span className="mr-[6px] inline-block h-3 w-3 rounded-full bg-[#fb7185]" />
            <span className="mr-[6px] inline-block h-3 w-3 rounded-full bg-[#fbbf24]" />
            <span className="mr-[6px] inline-block h-3 w-3 rounded-full bg-[#34d399]" />
            <span>itec@freshstart: ~/discover — question {headerN} of 3</span>
          </div>

          {/* Body */}
          <div className="min-h-[420px] px-[32px] py-[28px] font-mono text-[22px] leading-[1.85] text-[#cfe0ff]">
            {phase === "reveal" ? (
              <>
                <div className={C2}>&gt; analyzing ...</div>
                <div
                  className="text-[34px] tracking-[2px]"
                  style={{ color: "var(--a)" }}
                >
                  [ ACCESS GRANTED ]
                </div>
                <div className={PR}>
                  &gt; ROLE: {path.label} {path.emoji}
                </div>
                {blurbLines.map((line, i) => (
                  <div key={i}>&gt; {line}.</div>
                ))}
                <div className={C2}>
                  &gt; claim prize: show this screen at the booth
                </div>
                <div>&gt; prize: {path.playPrize}</div>
                <div>
                  &gt; <span className="cursor" />
                </div>
              </>
            ) : phase === "analyzing" ? (
              <div>
                <div className={C2}>$ ./discover_your_path.sh</div>
                <div className={C2}>&gt; profile scan complete</div>
                <div className={PR}>&gt; analyzing ...</div>
                <div>
                  &gt; <span className="cursor" />
                </div>
              </div>
            ) : (
              <>
                <BodyLine show={vis > 0} className={C2}>
                  $ ./discover_your_path.sh
                </BodyLine>
                <BodyLine show={vis > 1} className={C2}>
                  &gt; booting profile scan ...
                </BodyLine>
                <BodyLine show={vis > 2} className={C2}>
                  &gt; question {qIndex + 1} of 3:
                </BodyLine>
                <BodyLine show={vis > 3} className={PR}>
                  {QUESTIONS[qIndex].prompt}
                </BodyLine>
                {QUESTIONS[qIndex].options.map((opt, i) => (
                  <button
                    key={`${qIndex}-${i}`}
                    type="button"
                    onClick={() => answer(opt.path)}
                    style={{
                      opacity: vis > 4 + i ? 1 : 0,
                      transition: "opacity 200ms ease, background 150ms ease",
                    }}
                    className="flex min-h-[64px] w-full items-center rounded-lg px-2 text-left text-[#cfe0ff] hover:bg-white/5 active:scale-[0.99]"
                  >
                    &nbsp;&nbsp;[{i + 1}] {opt.label}
                  </button>
                ))}
                <div>
                  &gt; <span className="cursor" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Hint / end actions */}
        {phase === "reveal" ? (
          <EndActions onPlayAgain={restart} />
        ) : (
          <div className="mt-6 font-mono text-[13px] tracking-[1px] text-dim">
            Tap an option or press 1 · 2 · 3
          </div>
        )}
      </div>
    </GameShell>
  );
}

// A single body line with a fade-in reveal. Kept as a plain element so the
// typewriter stagger reads cleanly; option rows are separate tappable buttons.
function BodyLine({
  show,
  className,
  children,
}: {
  show: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={className}
      style={{ opacity: show ? 1 : 0, transition: "opacity 200ms ease" }}
    >
      {children}
    </div>
  );
}
