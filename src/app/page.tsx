"use client";

import { useCallback, useRef, useState } from "react";
import { Stage } from "../components/Stage";
import { Shell } from "../components/Shell";
import { Kicker, PrimaryButton, PrizeBadge } from "../components/Bits";
import { ChoiceCard } from "../components/ChoiceCard";
import { CodePanel } from "../components/CodePanel";
import { Hud } from "../components/Hud";
import { Leaderboard } from "../components/Leaderboard";
import { NameEntry } from "../components/NameEntry";
import { useIdleReset } from "../hooks/useIdleReset";
import { useMounted } from "../hooks/useMounted";
import { generateRound } from "../lib/bugGen";
import { addScore, getBoard } from "../lib/leaderboard";
import { PATHS } from "../lib/paths";
import { SORTER_QUESTIONS, scoreSorter } from "../lib/sorter";
import { applyTap, createScoreState, type ScoreState } from "../lib/scoring";
import type { PathId, Round, ScoreEntry } from "../lib/types";

// Single-page state machine: ATTRACT -> SORTER -> REVEAL -> DEBUG -> SCORE
// -> back to ATTRACT. One page (no routes): a booth kiosk never deep-links,
// idle-reset must work from any screen, and per-play state (answers, round,
// score) lives naturally in one component.
type Phase = "ATTRACT" | "SORTER" | "REVEAL" | "DEBUG" | "SCORE";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("ATTRACT");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [path, setPath] = useState<PathId | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [scoreState, setScoreState] = useState<ScoreState>(createScoreState);
  const [wrongFlashId, setWrongFlashId] = useState<string | null>(null);
  const [board, setBoard] = useState<ScoreEntry[]>([]);
  const [saved, setSaved] = useState<{ rank: number | null; ts: number } | null>(
    null,
  );
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  const refreshBoard = useCallback(() => setBoard(getBoard()), []);

  // Reset a play in progress (idle, DONE button, attract loop).
  const resetToAttract = useCallback(() => {
    clearTimers();
    setPhase("ATTRACT");
    setQIndex(0);
    setAnswers([]);
    setPath(null);
    setRound(null);
    setScoreState(createScoreState());
    setWrongFlashId(null);
    setSaved(null);
    refreshBoard();
  }, [clearTimers, refreshBoard]);

  // Any screen returns to ATTRACT after 30s without input.
  useIdleReset(() => {
    if (phase !== "ATTRACT") resetToAttract();
  }, 30_000);

  const startSorter = useCallback(() => {
    clearTimers();
    setQIndex(0);
    setAnswers([]);
    setPath(null);
    setRound(null);
    setScoreState(createScoreState());
    setWrongFlashId(null);
    setSaved(null);
    setPhase("SORTER");
  }, [clearTimers]);

  const answer = useCallback(
    (choice: number) => {
      const next = [...answers, choice];
      setAnswers(next);
      if (next.length >= SORTER_QUESTIONS.length) {
        setPath(scoreSorter(next));
        setPhase("REVEAL");
      } else {
        setQIndex(next.length);
      }
    },
    [answers],
  );

  // Every play gets a FRESH randomized round — the anti-cheat requirement.
  const startDebug = useCallback(() => {
    setRound(generateRound());
    setScoreState(createScoreState());
    setWrongFlashId(null);
    refreshBoard();
    setPhase("DEBUG");
  }, [refreshBoard]);

  const tapToken = useCallback(
    (tokenId: string) => {
      if (!round) return;
      const { state, result, done } = applyTap(scoreState, round, tokenId);
      setScoreState(state);
      if (result === "miss") {
        setWrongFlashId(tokenId);
        later(() => setWrongFlashId(null), 420);
      }
      if (done) {
        refreshBoard();
        later(() => setPhase("SCORE"), 750);
      }
    },
    [round, scoreState, later, refreshBoard],
  );

  const save = useCallback(
    (name: string) => {
      const ts = Date.now();
      const { board: nextBoard, rank } = addScore({
        name,
        score: scoreState.score,
        ts,
      });
      setBoard(nextBoard);
      setSaved({ rank, ts });
    },
    [scoreState.score],
  );

  return (
    <Stage>
      {phase === "ATTRACT" && <AttractScreen onStart={startSorter} />}
      {phase === "SORTER" && (
        <SorterScreen qIndex={qIndex} onChoose={answer} />
      )}
      {phase === "REVEAL" && path && (
        <RevealScreen path={path} onPlay={startDebug} />
      )}
      {phase === "DEBUG" && round && (
        <DebugScreen
          round={round}
          scoreState={scoreState}
          wrongFlashId={wrongFlashId}
          board={board}
          onTap={tapToken}
        />
      )}
      {phase === "SCORE" && path && (
        <ScoreScreen
          path={path}
          score={scoreState.score}
          board={board}
          saved={saved}
          onSave={save}
          onPlayAgain={startSorter}
          onDone={resetToAttract}
        />
      )}
    </Stage>
  );
}

/* ---------------- Screens ---------------- */

function AttractScreen({ onStart }: { onStart: () => void }) {
  // Read the board at render time, gated on mounted so server HTML and the
  // hydration render agree (localStorage only exists on the client).
  const mounted = useMounted();
  const top = mounted ? getBoard()[0] : undefined;
  return (
    <div className="h-full w-full" onPointerDown={onStart}>
      <Shell ribbon="WHAT IT PATH ARE YOU?">
        <Kicker>ITeC FreshStart · booth game</Kicker>
        <h1 className="text-[74px] font-bold leading-[1.03] text-ink">
          What IT Path
          <br />
          are <span className="text-primary">you?</span>
        </h1>
        <p className="mt-4 max-w-[720px] text-[22px] text-dim">
          Four quick taps to find your path. Then squash some bugs for the top
          score.
        </p>
        <PrimaryButton className="mt-8">TAP TO START</PrimaryButton>
        <PrizeBadge className="mt-[22px]">
          {top ? (
            <>
              🏆 Today&apos;s top: {top.name} · {top.score.toLocaleString()}
            </>
          ) : (
            <>🏆 Be the first today</>
          )}
        </PrizeBadge>
      </Shell>
    </div>
  );
}

function SorterScreen({
  qIndex,
  onChoose,
}: {
  qIndex: number;
  onChoose: (choice: number) => void;
}) {
  const q = SORTER_QUESTIONS[qIndex];
  return (
    <Shell ribbon={`SORTER · QUESTION ${qIndex + 1} OF ${SORTER_QUESTIONS.length}`}>
      <Kicker>What IT path are you?</Kicker>
      <div className="mb-6 flex gap-[10px]">
        {SORTER_QUESTIONS.map((_, i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-full ${i <= qIndex ? "bg-primary" : "bg-dot"}`}
          />
        ))}
      </div>
      <h1 className="text-[74px] font-bold leading-[1.03] text-ink">
        {q.pre}
        <span className="text-primary">{q.accent}</span>
        {q.post}
      </h1>
      <div className="mt-11 flex gap-[26px]">
        <ChoiceCard {...q.options[0]} onClick={() => onChoose(0)} />
        <ChoiceCard {...q.options[1]} onClick={() => onChoose(1)} />
      </div>
      <div className="mt-9 font-mono text-[14px] text-dim-2">
        No wrong answer. Tap your gut.
      </div>
    </Shell>
  );
}

function RevealScreen({
  path,
  onPlay,
}: {
  path: PathId;
  onPlay: () => void;
}) {
  const meta = PATHS[path];
  return (
    <Shell ribbon="YOUR PATH">
      <Kicker>You are</Kicker>
      <div className="pop mb-2 grid h-[172px] w-[172px] place-items-center rounded-full border-[3px] border-avatar-border bg-surface text-[86px] shadow-[0_12px_34px_rgba(37,99,235,0.14)]">
        {meta.emoji}
      </div>
      <h1 className="text-[74px] font-bold leading-[1.03] text-ink">
        The <span className="text-primary">{meta.word}</span>
      </h1>
      <p className="mt-4 max-w-[720px] text-[22px] text-dim">{meta.blurb}</p>
      <PrizeBadge className="mt-[22px]">
        🎟 Play prize · {meta.playPrize}
      </PrizeBadge>
      <PrimaryButton className="mt-8" onClick={onPlay}>
        PLAY FOR THE GRAND PRIZE →
      </PrimaryButton>
    </Shell>
  );
}

function DebugScreen({
  round,
  scoreState,
  wrongFlashId,
  board,
  onTap,
}: {
  round: Round;
  scoreState: ScoreState;
  wrongFlashId: string | null;
  board: ScoreEntry[];
  onTap: (tokenId: string) => void;
}) {
  return (
    <Shell ribbon="DEBUG SPRINT · NO TIMER">
      <Kicker>Find the bugs · precision scored</Kicker>
      <Hud
        score={scoreState.score}
        found={scoreState.found.size}
        total={round.bugCount}
        nextBugValue={scoreState.nextBugValue}
      />
      <h1 className="mb-4 text-[40px] font-bold text-ink">
        Tap the <span className="text-primary">bugs</span>
      </h1>
      <CodePanel
        round={round}
        found={scoreState.found}
        wrongFlashId={wrongFlashId}
        onTap={onTap}
      />
      <div className="mt-9 font-mono text-[14px] text-dim-2">
        Correct tap adds points. A wrong tap shrinks what every remaining bug
        is worth.
      </div>
      <Leaderboard board={board} className="absolute right-11 top-8" />
    </Shell>
  );
}

function ScoreScreen({
  path,
  score,
  board,
  saved,
  onSave,
  onPlayAgain,
  onDone,
}: {
  path: PathId;
  score: number;
  board: ScoreEntry[];
  saved: { rank: number | null; ts: number } | null;
  onSave: (name: string) => void;
  onPlayAgain: () => void;
  onDone: () => void;
}) {
  const meta = PATHS[path];
  const top = board[0];
  const prospective = board.filter((e) => e.score >= score).length + 1;

  return (
    <Shell ribbon="FINAL SCORE">
      <Kicker>{meta.label} · nice work</Kicker>
      <div className="pop text-[96px] font-bold leading-none text-primary">
        {score.toLocaleString()}
      </div>
      {!saved ? (
        <>
          <p className="mt-3 max-w-[720px] text-[22px] text-dim">
            {!top || score >= top.score
              ? "Top of the board today. Save it to claim the lead."
              : `Rank #${prospective} today. Beat ${top.score.toLocaleString()} to take the grand prize.`}
          </p>
          <NameEntry onSave={onSave} />
        </>
      ) : (
        <>
          <p className="mt-3 max-w-[720px] text-[22px] text-dim">
            {saved.rank
              ? `Saved — rank #${saved.rank} today.`
              : "Saved — outside today's top 10. Try another run!"}
          </p>
          <Leaderboard board={board} highlightTs={saved.ts} className="mt-5" />
          <div className="mt-6 flex items-center gap-4">
            <PrimaryButton onClick={onPlayAgain} className="px-[26px] py-[14px] text-[18px]">
              PLAY AGAIN
            </PrimaryButton>
            <button
              onClick={onDone}
              className="min-h-16 rounded-[14px] border border-border bg-surface px-[26px] py-[14px] text-[18px] font-bold text-slate-ink transition-transform active:scale-95"
            >
              DONE
            </button>
          </div>
        </>
      )}
      <PrizeBadge className="mt-[22px]">
        🎟 Show this screen to claim your play prize
      </PrizeBadge>
    </Shell>
  );
}
