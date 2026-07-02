"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell } from "../../components/GameShell";
import { Hud, Pill, TimerBar, fmtClock } from "../../components/Hud";
import { Kicker, BigButton } from "../../components/Bits";
import { Leaderboard } from "../../components/Leaderboard";
import { NameEntry } from "../../components/NameEntry";
import { EndActions } from "../../components/EndActions";
import { addScore, getBoard } from "../../lib/leaderboard";
import type { ScoreEntry } from "../../lib/types";
import { useCountdown } from "../../hooks/useCountdown";
import { useMounted } from "../../hooks/useMounted";

type Phase = "intro" | "play" | "score" | "board";
type Tile = "empty" | "bug" | "dead";

const GAME_ID = "debug-arcade";
const TILES = 24;
const RUN_SECONDS = 30;
const SPAWN_MS = 600;
const LIFE_MIN = 1100;
const LIFE_MAX = 1700;
const LIVE_CAP = 8;
const DEAD_MS = 340;

function emptyGrid(): Tile[] {
  return Array<Tile>(TILES).fill("empty");
}

export default function DebugArcade() {
  const mounted = useMounted();

  const [phase, setPhaseState] = useState<Phase>("intro");
  const phaseRef = useRef<Phase>("intro");
  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const comboRef = useRef(1);

  const [tiles, setTilesState] = useState<Tile[]>(emptyGrid);
  const tilesRef = useRef<Tile[]>(tiles);
  const setTiles = useCallback(
    (updater: Tile[] | ((prev: Tile[]) => Tile[])) => {
      const next =
        typeof updater === "function" ? updater(tilesRef.current) : updater;
      tilesRef.current = next;
      setTilesState(next);
    },
    [],
  );

  const [board, setBoard] = useState<ScoreEntry[]>([]);
  const [meRank, setMeRank] = useState<number | null>(null);

  // Timer refs for spawns and per-tile lifespans.
  const spawnRef = useRef<number | null>(null);
  const despawnRef = useRef<Map<number, number>>(new Map());
  const deadRef = useRef<Map<number, number>>(new Map());

  const stopSpawns = useCallback(() => {
    if (spawnRef.current !== null) {
      window.clearInterval(spawnRef.current);
      spawnRef.current = null;
    }
    despawnRef.current.forEach((id) => window.clearTimeout(id));
    despawnRef.current.clear();
    deadRef.current.forEach((id) => window.clearTimeout(id));
    deadRef.current.clear();
  }, []);

  // A live bug that was never tapped expires: clear the tile, reset combo.
  const despawn = useCallback(
    (i: number) => {
      despawnRef.current.delete(i);
      if (tilesRef.current[i] !== "bug") return;
      setTiles((prev) => {
        const next = [...prev];
        next[i] = "empty";
        return next;
      });
      comboRef.current = 1;
      setCombo(1);
    },
    [setTiles],
  );

  const spawn = useCallback(() => {
    const cur = tilesRef.current;
    let live = 0;
    const empties: number[] = [];
    for (let i = 0; i < cur.length; i++) {
      if (cur[i] === "bug") live++;
      else if (cur[i] === "empty") empties.push(i);
    }
    if (live >= LIVE_CAP || empties.length === 0) return;

    const want = 1 + (Math.random() < 0.5 ? 1 : 0);
    const count = Math.min(want, empties.length, LIVE_CAP - live);
    const next = [...cur];
    for (let k = 0; k < count; k++) {
      const pick = empties.splice(
        Math.floor(Math.random() * empties.length),
        1,
      )[0];
      next[pick] = "bug";
      const life = LIFE_MIN + Math.random() * (LIFE_MAX - LIFE_MIN);
      const id = window.setTimeout(() => despawn(pick), life);
      despawnRef.current.set(pick, id);
    }
    setTiles(next);
  }, [despawn, setTiles]);

  const tap = useCallback(
    (i: number) => {
      if (phaseRef.current !== "play") return;
      if (tilesRef.current[i] !== "bug") return; // empty / dead → no-op

      const pending = despawnRef.current.get(i);
      if (pending !== undefined) {
        window.clearTimeout(pending);
        despawnRef.current.delete(i);
      }

      const gained = 100 * comboRef.current;
      setScore((s) => s + gained);
      comboRef.current += 1;
      setCombo(comboRef.current);

      setTiles((prev) => {
        const next = [...prev];
        next[i] = "dead";
        return next;
      });

      const id = window.setTimeout(() => {
        deadRef.current.delete(i);
        setTiles((prev) => {
          if (prev[i] !== "dead") return prev;
          const next = [...prev];
          next[i] = "empty";
          return next;
        });
      }, DEAD_MS);
      deadRef.current.set(i, id);
    },
    [setTiles],
  );

  const endGame = useCallback(() => {
    stopSpawns();
    setTiles(emptyGrid());
    setPhase("score");
  }, [setPhase, setTiles, stopSpawns]);

  const { remaining, start, reset } = useCountdown({
    seconds: RUN_SECONDS,
    autoStart: false,
    onDone: endGame,
  });

  const startGame = useCallback(() => {
    stopSpawns();
    setTiles(emptyGrid());
    setScore(0);
    comboRef.current = 1;
    setCombo(1);
    setMeRank(null);
    setPhase("play");
    start();
    spawnRef.current = window.setInterval(spawn, SPAWN_MS);
  }, [setPhase, setTiles, spawn, start, stopSpawns]);

  const save = useCallback(
    (name: string) => {
      const result = addScore(GAME_ID, { name, score, ts: Date.now() });
      setBoard(result.board);
      setMeRank(result.rank);
      setPhase("board");
    },
    [score, setPhase],
  );

  const restart = useCallback(() => {
    stopSpawns();
    setTiles(emptyGrid());
    setScore(0);
    comboRef.current = 1;
    setCombo(1);
    setMeRank(null);
    reset(RUN_SECONDS);
    setPhase("intro");
  }, [reset, setPhase, setTiles, stopSpawns]);

  // Keep the "today" strip fresh whenever the phase changes (and after saving).
  useEffect(() => {
    if (mounted) setBoard(getBoard(GAME_ID));
  }, [mounted, phase]);

  // Clean up every timer on unmount.
  useEffect(() => stopSpawns, [stopSpawns]);

  const top3 = board.slice(0, 3);
  const strip =
    !mounted || top3.length === 0
      ? "🏆 be the first today"
      : "🏆 TODAY: " +
        top3
          .map(
            (e, i) =>
              `${i + 1} ${meRank !== null && i + 1 === meRank ? "YOU" : e.name} ${e.score}`,
          )
          .join(" · ");

  return (
    <GameShell ribbon="03 · DEBUG SPRINT ARCADE" accent="#fb7185">
      {phase === "intro" && (
        <div className="flex flex-col items-center">
          <Kicker>Reflex Round</Kicker>
          <h1 className="pop text-[64px] font-bold leading-none">
            SQUASH THE <span className="grad">BUGS</span>
          </h1>
          <div className="mt-4 text-[22px] text-dim-2">
            Tap every 🐛 before the timer runs out.
          </div>
          <div className="mt-2 text-[17px] text-dim">
            30 seconds · chain hits to build your combo
          </div>
          <BigButton onClick={startGame}>START</BigButton>
          <div className="mt-8 rounded-xl border border-border bg-panel px-5 py-3 font-mono text-[15px] text-dim">
            {strip}
          </div>
        </div>
      )}

      {phase === "play" && (
        <div className="flex flex-col items-center">
          <Hud>
            <Pill label="⏱" value={fmtClock(remaining)} />
            <Pill label="SCORE" value={score} />
            <Pill label="COMBO" value={`x${combo}`} />
          </Hud>

          <h1 className="text-[50px] font-bold leading-none">
            SQUASH THE <span className="grad">BUGS</span>
          </h1>
          <div className="mt-[6px] mb-3 text-[18px] text-dim-2">
            Tap every 🐛 before the timer runs out
          </div>

          <div className="mb-4">
            <TimerBar progress={remaining / RUN_SECONDS} />
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 14,
              width: 720,
            }}
          >
            {tiles.map((t, i) => {
              const isBug = t === "bug";
              const isDead = t === "dead";
              return (
                <button
                  key={i}
                  onClick={() => tap(i)}
                  aria-label={isBug ? "bug" : "empty tile"}
                  className={`grid aspect-square place-items-center rounded-2xl border bg-panel transition-transform active:scale-95 ${
                    isBug ? "pop border-transparent" : "border-border"
                  }`}
                  style={{
                    fontSize: isDead ? 28 : 38,
                    opacity: isDead ? 0.28 : 1,
                    borderColor: isBug ? "#fb7185" : undefined,
                    boxShadow: isBug
                      ? "0 0 22px rgba(251,113,133,.35)"
                      : undefined,
                  }}
                >
                  {isBug ? (
                    "🐛"
                  ) : isDead ? (
                    "✔"
                  ) : (
                    <span className="text-dim-2">·</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl border border-border bg-panel px-5 py-3 font-mono text-[15px] text-dim">
            {strip}
          </div>
        </div>
      )}

      {phase === "score" && <NameEntry score={score} onSubmit={save} />}

      {phase === "board" && (
        <div className="flex flex-col items-center">
          <Leaderboard
            variant="panel"
            entries={board}
            meIndex={meRank !== null ? meRank - 1 : undefined}
            title="TODAY'S TOP"
          />
          <EndActions onPlayAgain={restart} />
        </div>
      )}
    </GameShell>
  );
}
