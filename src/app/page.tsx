"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Stage } from "../components/Stage";
import { GAME_LIST, GAME_META } from "../lib/games";
import { SCORED_GAMES } from "../lib/types";
import { getTopToday } from "../lib/leaderboard";
import { useMounted } from "../hooks/useMounted";

export default function Home() {
  const mounted = useMounted();
  const [top, setTop] = useState<ReturnType<typeof getTopToday>>(null);
  const [fs, setFs] = useState(false);

  useEffect(() => {
    setTop(getTopToday(SCORED_GAMES));
  }, [mounted]);

  useEffect(() => {
    const onChange = () => setFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  };

  return (
    <Stage accent="#22d3ee">
      <div className="flex h-full w-full flex-col">
        {/* Topbar */}
        <div className="flex items-center justify-between px-10 py-6">
          <div className="flex items-center gap-3 text-[20px] font-bold">
            <span className="grid h-[34px] w-[34px] place-items-center rounded-[9px] grad-fill font-extrabold not-italic text-[#04121a]">
              i
            </span>
            <span>ITeC FreshStart</span>
          </div>
          <button
            onClick={toggleFullscreen}
            className="rounded-full border border-border bg-panel px-[18px] py-2 font-mono text-[13px] tracking-[1px] text-dim transition-colors hover:text-ink"
          >
            {fs ? "⤢ EXIT FULLSCREEN" : "⛶ ENTER FULLSCREEN"}
          </button>
        </div>

        {/* Main */}
        <div className="flex flex-1 flex-col px-[52px] pb-4">
          <div className="mb-1 font-mono text-[14px] uppercase tracking-[3px] text-dim">
            ITeC FreshStart booth
          </div>
          <h1 className="text-[54px] font-bold leading-[1.02]">
            Play to win. <span className="grad">Tap a game</span> to start.
          </h1>
          <p className="mt-2 text-[19px] text-dim-2">
            Six quick games. A prize for everyone, a grand prize for the top
            score.
          </p>

          {/* Tile grid */}
          <div className="mt-6 grid grid-cols-3 grid-rows-2 gap-[18px]">
            {GAME_LIST.map((g) => (
              <Link
                key={g.id}
                href={`/play/${g.id}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-panel p-6 transition-all hover:-translate-y-1"
                style={{ minHeight: 148 }}
              >
                <span
                  className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
                  style={{
                    background: `linear-gradient(90deg, ${g.accent}, #a3e635)`,
                  }}
                />
                <div className="flex items-start justify-between">
                  <span className="text-[40px]">{g.emoji}</span>
                  {g.scored && (
                    <span className="rounded-full border border-border px-3 py-1 font-mono text-[11px] tracking-[1px] text-dim">
                      SCORED
                    </span>
                  )}
                </div>
                <div>
                  <div
                    className="text-[24px] font-bold"
                    style={{ color: g.accent }}
                  >
                    {g.title}
                  </div>
                  <div className="mt-1 text-[15px] leading-snug text-dim-2">
                    {g.hook}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Today's Top teaser / footer */}
        <div className="flex items-center justify-between border-t border-border px-10 py-4 font-mono text-[14px] tracking-[1px] text-dim">
          <span>ITeC FreshStart booth game // local daily leaderboard</span>
          <span>
            {mounted && top ? (
              <>
                🏆 TODAY&apos;S TOP ·{" "}
                <b className="text-ink">{top.entry.name}</b>{" "}
                <span style={{ color: GAME_META[top.gameId].accent }}>
                  {top.entry.score}
                </span>{" "}
                · {GAME_META[top.gameId].title}
              </>
            ) : (
              <>🏆 TODAY&apos;S TOP · be the first to score</>
            )}
          </span>
        </div>
      </div>
    </Stage>
  );
}
