"use client";

import type { PathMeta } from "../lib/paths";
import { Avatar, PrizeBadge, Sub } from "./Bits";

// Shared reveal card: avatar + "THE <WORD>" gradient headline + blurb +
// play-prize badge. Optional CTA slot (e.g. sorter's "play for grand prize").
export function PathReveal({
  path,
  kicker = "Your path",
  cta,
}: {
  path: PathMeta;
  kicker?: string;
  cta?: React.ReactNode;
}) {
  return (
    <>
      <div className="mb-4 font-mono text-[15px] uppercase tracking-[3px] text-dim">
        {kicker}
      </div>
      <Avatar emoji={path.emoji} />
      <h1 className="text-[76px] font-bold leading-[1.02]">
        THE <span className="grad">{path.word}</span>
      </h1>
      <Sub>{path.blurb}</Sub>
      <PrizeBadge>🎟 PLAY PRIZE · {path.playPrize}</PrizeBadge>
      {cta}
    </>
  );
}
