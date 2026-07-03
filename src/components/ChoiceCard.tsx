"use client";

// One of the two big tappable sorter options (mockup 2). 330x280 — far
// beyond the 64px touch-target minimum.
export function ChoiceCard({
  emoji,
  title,
  sub,
  onClick,
}: {
  emoji: string;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="pop flex h-[280px] w-[330px] flex-col items-center justify-center gap-3 rounded-[22px] border border-card-active bg-surface shadow-[0_10px_30px_rgba(30,41,59,0.06)] transition-transform active:scale-95"
    >
      <span className="text-[70px] leading-none">{emoji}</span>
      <span className="text-[29px] font-bold text-ink">{title}</span>
      <span className="text-[16px] text-dim">{sub}</span>
    </button>
  );
}
