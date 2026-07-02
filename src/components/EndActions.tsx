"use client";

import { useRouter } from "next/navigation";

// The play-again / back-to-menu row shown at the end of every game.
export function EndActions({
  onPlayAgain,
  playAgainLabel = "PLAY AGAIN",
}: {
  onPlayAgain: () => void;
  playAgainLabel?: string;
}) {
  const router = useRouter();
  return (
    <div className="mt-8 flex items-center gap-4">
      <button
        onClick={onPlayAgain}
        className="rounded-[14px] grad-fill px-9 py-4 text-[20px] font-bold text-[#04121a] transition-transform active:scale-95"
      >
        ↻ {playAgainLabel}
      </button>
      <button
        onClick={() => router.push("/")}
        className="rounded-[14px] border border-border bg-panel px-9 py-4 text-[20px] font-bold text-ink transition-colors hover:border-[color:var(--a)] active:scale-95"
      >
        BACK TO MENU
      </button>
    </div>
  );
}
