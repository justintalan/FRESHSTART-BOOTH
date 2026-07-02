"use client";

import { useEffect, useRef, useState } from "react";
import { GameShell } from "../../components/GameShell";
import { Hud, Pill, TimerBar, fmtClock } from "../../components/Hud";
import { Kicker, ProgressDots, BigButton } from "../../components/Bits";
import { EndActions } from "../../components/EndActions";
import { PathReveal } from "../../components/PathReveal";
import { Leaderboard } from "../../components/Leaderboard";
import { NameEntry } from "../../components/NameEntry";
import { PATHS, PATH_LIST } from "../../lib/paths";
import type { PathMeta } from "../../lib/paths";
import { addScore, getBoard } from "../../lib/leaderboard";
import type { PathId, ScoreEntry } from "../../lib/types";
import { useCountdown } from "../../hooks/useCountdown";
import { useMounted } from "../../hooks/useMounted";

type Phase = "sort" | "reveal" | "sprint" | "score" | "board";
type Tallies = Record<PathId, number>;

interface Choice {
  emoji: string;
  title: string;
  sub: string;
  awards: PathId[];
  side: "x" | "y";
}

interface Question {
  left: Choice;
  right: Choice;
}

const QUESTIONS: Question[] = [
  {
    left: {
      emoji: "🔨",
      title: "BUILD IT",
      sub: "Make things from scratch",
      awards: ["builder", "architect"],
      side: "x",
    },
    right: {
      emoji: "💥",
      title: "BREAK IT",
      sub: "Find what's wrong",
      awards: ["guardian", "analyst"],
      side: "y",
    },
  },
  {
    left: {
      emoji: "🚀",
      title: "SHIP IT FAST",
      sub: "Move and iterate",
      awards: ["builder", "guardian"],
      side: "x",
    },
    right: {
      emoji: "📐",
      title: "DESIGN IT RIGHT",
      sub: "Plan the structure",
      awards: ["architect", "analyst"],
      side: "y",
    },
  },
  {
    left: {
      emoji: "🛡",
      title: "GUARD THE GATE",
      sub: "Keep it secure",
      awards: ["guardian", "architect"],
      side: "x",
    },
    right: {
      emoji: "🔍",
      title: "CHASE THE CLUE",
      sub: "Follow the data",
      awards: ["analyst", "builder"],
      side: "y",
    },
  },
  {
    left: {
      emoji: "⌨️",
      title: "HANDS ON KEYS",
      sub: "Just build it",
      awards: ["builder", "guardian"],
      side: "x",
    },
    right: {
      emoji: "📊",
      title: "EYES ON CHARTS",
      sub: "Read the signals",
      awards: ["analyst", "architect"],
      side: "y",
    },
  },
];

const EMPTY_TALLIES: Tallies = {
  builder: 0,
  guardian: 0,
  analyst: 0,
  architect: 0,
};

/* ---------- Debug Sprint snippet data ---------- */

interface Seg {
  text: string;
  bug?: boolean;
}
type Snippet = Seg[][];

const SNIPPETS: Snippet[] = [
  [
    [{ text: "for i in range(" }, { text: "0,10", bug: true }, { text: "):" }],
    [{ text: "  total " }, { text: "= total + i", bug: true }],
    [{ text: "  if i " }, { text: "= 5", bug: true }, { text: ":" }],
    [{ text: "    print(" }, { text: "total)", bug: true }],
    [{ text: "return total" }],
  ],
  [
    [{ text: "function avg(nums) {" }],
    [{ text: "  let sum = 0" }],
    [
      { text: "  for (let i = 0; i " },
      { text: "<= nums.length", bug: true },
      { text: "; i++) {" },
    ],
    [{ text: "    sum += nums[i]" }],
    [{ text: "  }" }],
    [{ text: "  " }, { text: "retrun", bug: true }, { text: " sum " }, { text: "* nums.length", bug: true }],
    [{ text: "}" }],
  ],
  [
    [{ text: "def is_even(n):" }],
    [{ text: "  if n % 2 " }, { text: "= 0", bug: true }, { text: ":" }],
    [{ text: "    " }, { text: "return", bug: true }, { text: " True" }],
    [{ text: "  else:" }],
    [{ text: "    return False" }],
    [{ text: "" }, { text: "prnt", bug: true }, { text: "(is_even(4))" }],
  ],
];

function countBugs(snip: Snippet): number {
  let n = 0;
  for (const line of snip) for (const seg of line) if (seg.bug) n++;
  return n;
}

/* ---------- Debug Sprint sub-component (remounts each sprint => fresh 20s) ---------- */

function DebugSprint({
  path,
  onDone,
}: {
  path: PathMeta;
  onDone: (finalScore: number) => void;
}) {
  const mounted = useMounted();
  const [snipIdx, setSnipIdx] = useState(0);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [wrongPulse, setWrongPulse] = useState(0);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [gain, setGain] = useState<{ value: number; key: number } | null>(null);

  useEffect(() => {
    if (!wrongFlash) return;
    const h = window.setTimeout(() => setWrongFlash(false), 260);
    return () => window.clearTimeout(h);
  }, [wrongFlash]);
  const scoreRef = useRef(0);
  scoreRef.current = score;

  const { remaining } = useCountdown({
    seconds: 20,
    autoStart: true,
    onDone: () => onDone(scoreRef.current),
  });

  const snippet = SNIPPETS[snipIdx];
  const totalBugs = countBugs(snippet);

  const tapBug = (line: number, seg: number) => {
    const key = `${line}:${seg}`;
    if (found.has(key)) return;
    const gained = 100 * combo;
    setScore((s) => s + gained);
    setCombo((c) => c + 1);
    setGain({ value: gained, key: Date.now() });
    const next = new Set(found);
    next.add(key);
    if (next.size >= totalBugs) {
      // snippet cleared -> load the next one and keep going
      setFound(new Set());
      setSnipIdx((i) => (i + 1) % SNIPPETS.length);
    } else {
      setFound(next);
    }
  };

  const tapPlain = () => {
    setCombo(1);
    setWrongPulse((p) => p + 1);
    setWrongFlash(true);
  };

  return (
    <div className="relative flex w-full flex-1 flex-col items-center justify-center px-[60px] text-center">
      <Kicker>Debug Sprint · 20 seconds</Kicker>

      <Hud>
        <Pill label="⏱" value={fmtClock(remaining)} />
        <TimerBar progress={remaining / 20} />
        <Pill label="SCORE" value={score} />
        <Pill label="COMBO" value={`x${combo}`} />
      </Hud>

      <h1 className="mb-5 text-[44px] font-bold">
        TAP THE <span className="grad">BUGS</span>
      </h1>

      <div className="relative">
        {gain ? (
          <div
            key={gain.key}
            className="pop pointer-events-none absolute left-1/2 top-[-30px] -translate-x-1/2 font-mono text-[26px] font-bold text-lime"
          >
            +{gain.value}
          </div>
        ) : null}

        <div
          key={wrongPulse}
          className={`w-[720px] rounded-2xl border text-left font-mono ${
            wrongPulse ? "pop" : ""
          }`}
          style={{
            background: "#0c1322",
            padding: "24px 28px",
            fontSize: 20,
            lineHeight: 1.9,
            color: "#c7d2e6",
            borderColor: wrongFlash ? "rgba(251,113,133,.8)" : "#1f2a3d",
          }}
        >
          {snippet.map((line, li) => (
            <div key={li} className="whitespace-pre">
              <span
                className="select-none"
                style={{ color: "#48577a", marginRight: 16 }}
              >
                {li + 1}
              </span>
              {line.map((seg, si) => {
                if (seg.bug) {
                  const key = `${li}:${si}`;
                  const isFound = found.has(key);
                  return (
                    <button
                      key={si}
                      disabled={isFound}
                      onClick={() => tapBug(li, si)}
                      className="mx-[1px] rounded-lg px-2 py-[2px] align-baseline font-mono"
                      style={
                        isFound
                          ? {
                              background: "rgba(52,211,153,.16)",
                              border: "1px solid rgba(52,211,153,.7)",
                              color: "#86efac",
                            }
                          : {
                              background: "rgba(251,113,133,.14)",
                              border: "1px solid rgba(251,113,133,.5)",
                              color: "#ffd7dd",
                            }
                      }
                    >
                      {isFound ? `✓ ${seg.text}` : seg.text}
                    </button>
                  );
                }
                return (
                  <span
                    key={si}
                    onClick={tapPlain}
                    className="cursor-pointer whitespace-pre"
                  >
                    {seg.text}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 font-mono text-[14px] text-dim">
        Tap the buggy code. Miss and your combo resets.
      </div>

      {mounted ? (
        <Leaderboard
          entries={getBoard("path-sorter")}
          variant="side"
          title="TODAY'S TOP"
        />
      ) : null}

      {/* keep path accent referenced for lint/clarity */}
      <span className="hidden">{path.word}</span>
    </div>
  );
}

/* ---------- Main game ---------- */

export default function PathSorter() {
  const mounted = useMounted();
  const [phase, setPhase] = useState<Phase>("sort");
  const [qIndex, setQIndex] = useState(0);
  const [tallies, setTallies] = useState<Tallies>({ ...EMPTY_TALLIES });
  const [winner, setWinner] = useState<PathMeta | null>(null);
  const [finalScore, setFinalScore] = useState(0);
  const [board, setBoard] = useState<ScoreEntry[]>([]);
  const [rank, setRank] = useState<number | null>(null);

  const computeWinner = (t: Tallies): PathMeta => {
    let best = PATH_LIST[0];
    let bestVal = t[best.id];
    for (const p of PATH_LIST) {
      if (t[p.id] > bestVal) {
        best = p;
        bestVal = t[p.id];
      }
    }
    return best;
  };

  const answer = (choice: Choice) => {
    const next: Tallies = { ...tallies };
    for (const id of choice.awards) next[id] += 1;
    if (qIndex < QUESTIONS.length - 1) {
      setTallies(next);
      setQIndex(qIndex + 1);
    } else {
      setTallies(next);
      setWinner(computeWinner(next));
      setPhase("reveal");
    }
  };

  const goToSprint = () => setPhase("sprint");

  const onSprintDone = (s: number) => {
    setFinalScore(s);
    setPhase("score");
  };

  const handleSave = (name: string) => {
    const res = addScore("path-sorter", {
      name,
      score: finalScore,
      ts: Date.now(),
    });
    setBoard(res.board);
    setRank(res.rank);
    setPhase("board");
  };

  const resetToSort = () => {
    setTallies({ ...EMPTY_TALLIES });
    setQIndex(0);
    setWinner(null);
    setFinalScore(0);
    setBoard([]);
    setRank(null);
    setPhase("sort");
  };

  const q = QUESTIONS[qIndex];

  const centeredWrap =
    "relative flex w-full flex-1 flex-col items-center justify-center px-[60px] text-center";

  return (
    <GameShell
      ribbon="01 · PATH SORTER + DEBUG SPRINT"
      accent="#22d3ee"
      center={false}
    >
      {phase === "sort" ? (
        <div className={centeredWrap}>
          <Kicker>What IT path are you?</Kicker>
          <ProgressDots total={QUESTIONS.length} current={qIndex} />
          <h1 className="mb-8 text-[64px] font-bold leading-[1.05]">
            {q.left.title} <span className="grad">or</span> {q.right.title}?
          </h1>
          <div className="flex gap-8">
            {[q.left, q.right].map((choice, i) => (
              <button
                key={i}
                onClick={() => answer(choice)}
                className="flex flex-col items-center justify-center gap-3 rounded-[22px] transition-transform active:scale-95"
                style={{
                  width: 330,
                  height: 290,
                  background: "rgba(255,255,255,.03)",
                  border:
                    choice.side === "x"
                      ? "1px solid rgba(34,211,238,.5)"
                      : "1px solid rgba(163,230,53,.5)",
                }}
              >
                <span className="text-[74px] leading-none">{choice.emoji}</span>
                <span className="text-[30px] font-bold">{choice.title}</span>
                <span className="text-[17px] text-dim">{choice.sub}</span>
              </button>
            ))}
          </div>
          <div className="mt-8 font-mono text-[15px] text-dim">
            Tap your gut. 4 quick taps, then play for a prize.
          </div>
        </div>
      ) : null}

      {phase === "reveal" && winner ? (
        <div className={centeredWrap}>
          <PathReveal
            path={winner}
            cta={
              <BigButton onClick={goToSprint}>
                PLAY FOR THE GRAND PRIZE →
              </BigButton>
            }
          />
        </div>
      ) : null}

      {phase === "sprint" && winner ? (
        <DebugSprint path={winner} onDone={onSprintDone} />
      ) : null}

      {phase === "score" ? (
        <div className={centeredWrap}>
          <NameEntry score={finalScore} onSubmit={handleSave} />
        </div>
      ) : null}

      {phase === "board" ? (
        <div className={centeredWrap}>
          <Kicker>Debug Sprint · Results</Kicker>
          <div className="mb-2 text-[64px] font-bold leading-none">
            <span className="grad">{finalScore}</span>
          </div>
          <div className="mb-6 font-mono text-[18px] text-dim">
            {rank ? `You placed #${rank} today` : "Great run!"}
          </div>
          {mounted ? (
            <Leaderboard
              entries={board}
              meIndex={rank ? rank - 1 : undefined}
              variant="panel"
            />
          ) : null}
          <EndActions onPlayAgain={resetToSort} />
        </div>
      ) : null}
    </GameShell>
  );
}
