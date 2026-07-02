"use client";

import { useEffect, useRef, useState } from "react";
import { GameShell } from "../../components/GameShell";
import { Kicker, PrizeBadge, Avatar, Sub } from "../../components/Bits";
import { EndActions } from "../../components/EndActions";
import { useMounted } from "../../hooks/useMounted";

// ---- Content -------------------------------------------------------------

type Option = {
  emoji: string;
  label: string;
  trait: string;
  hint: string; // short word for the swipe-direction hints
};

type Question = { a: Option; b: Option };

// 6 preference cards. optionA = first/top/left, optionB = second/bottom/right.
const QUESTIONS: readonly Question[] = [
  {
    a: { emoji: "🌙", label: "DARK MODE", trait: "night", hint: "dark" },
    b: { emoji: "☀️", label: "LIGHT MODE", trait: "day", hint: "light" },
  },
  {
    a: { emoji: "⌨️", label: "KEYBOARD", trait: "precise", hint: "keyboard" },
    b: { emoji: "🖱️", label: "MOUSE", trait: "visual", hint: "mouse" },
  },
  {
    a: { emoji: "🐍", label: "PYTHON", trait: "pragmatic", hint: "python" },
    b: { emoji: "🦀", label: "RUST", trait: "rigorous", hint: "rust" },
  },
  {
    a: { emoji: "☕", label: "COFFEE", trait: "grind", hint: "coffee" },
    b: { emoji: "🧋", label: "BOBA", trait: "chill", hint: "boba" },
  },
  {
    a: { emoji: "📱", label: "MOBILE", trait: "ship", hint: "mobile" },
    b: { emoji: "🖥️", label: "DESKTOP", trait: "build", hint: "desktop" },
  },
  {
    a: { emoji: "🚀", label: "MOVE FAST", trait: "bold", hint: "fast" },
    b: { emoji: "🧪", label: "TEST FIRST", trait: "careful", hint: "test" },
  },
];

type Result = {
  key: string;
  lead: string; // heading text before the gradient word
  grad: string; // final word rendered with the gradient
  emoji: string;
  blurb: string;
  playPrize: string;
  traits: readonly string[]; // traits that count toward this result
};

const RESULTS: readonly Result[] = [
  {
    key: "night-owl",
    lead: "NIGHT-OWL",
    grad: "DEV",
    emoji: "🌙",
    blurb:
      "Dark themes, deep focus, ships at 2am. You'd vibe with ITeC's dev circle.",
    playPrize: "🎟 PLAY PRIZE · spin the wheel",
    traits: ["night", "grind", "bold"],
  },
  {
    key: "sunrise",
    lead: "SUNRISE",
    grad: "SHIPPER",
    emoji: "☀️",
    blurb:
      "Calm, balanced, consistent — you ship clean work in daylight and log off happy.",
    playPrize: "🎟 PLAY PRIZE · spin the wheel",
    traits: ["day", "chill", "careful"],
  },
  {
    key: "pixel",
    lead: "PIXEL",
    grad: "PERFECTIONIST",
    emoji: "🎨",
    blurb:
      "Visual, tactile, detail-obsessed. Every pixel and interaction gets your full attention.",
    playPrize: "🎟 PLAY PRIZE · spin the wheel",
    traits: ["visual", "ship", "pragmatic"],
  },
  {
    key: "systems",
    lead: "SYSTEMS",
    grad: "TINKERER",
    emoji: "🛠️",
    blurb:
      "Precise, rigorous, low-level. You love building solid foundations others rely on.",
    playPrize: "🎟 PLAY PRIZE · spin the wheel",
    traits: ["precise", "rigorous", "build"],
  },
];

function pickResult(traits: readonly string[]): Result {
  const tally = new Map<string, number>();
  for (const t of traits) tally.set(t, (tally.get(t) ?? 0) + 1);

  let best = RESULTS[0];
  let bestScore = -1;
  for (const r of RESULTS) {
    let score = 0;
    for (const t of r.traits) score += tally.get(t) ?? 0;
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }
  return best;
}

const SWIPE_THRESHOLD = 60; // px of horizontal travel that counts as a swipe

// ---- Component -----------------------------------------------------------

export default function ThisOrThat() {
  const mounted = useMounted();
  const [phase, setPhase] = useState<"quiz" | "result">("quiz");
  const [traits, setTraits] = useState<readonly string[]>([]);
  const [result, setResult] = useState<Result | null>(null);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const index = traits.length;
  const question = QUESTIONS[Math.min(index, QUESTIONS.length - 1)];

  function choose(which: 0 | 1) {
    setTraits((prev) => {
      if (prev.length >= QUESTIONS.length) return prev;
      const q = QUESTIONS[prev.length];
      const trait = which === 0 ? q.a.trait : q.b.trait;
      const next = [...prev, trait];
      if (next.length === QUESTIONS.length) {
        setResult(pickResult(next));
        setPhase("result");
      }
      return next;
    });
  }

  // Keyboard: ArrowLeft = first/top option, ArrowRight = second/bottom option.
  useEffect(() => {
    if (phase !== "quiz") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        choose(0);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        choose(1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    startRef.current = { x: e.clientX, y: e.clientY };
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const start = startRef.current;
    startRef.current = null;
    const el = cardRef.current;
    if (!start || !el) return;

    const dx = e.clientX - start.x;
    if (Math.abs(dx) >= SWIPE_THRESHOLD) {
      // Horizontal swipe: left → first option, right → second option.
      choose(dx < 0 ? 0 : 1);
      return;
    }
    // Otherwise treat as a tap: top half → first option, bottom half → second.
    const rect = el.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    choose(relY < rect.height / 2 ? 0 : 1);
  }

  function restart() {
    setTraits([]);
    setResult(null);
    setPhase("quiz");
  }

  // ---- Result screen ----
  if (phase === "result" && result) {
    return (
      <GameShell ribbon="04 · THIS OR THAT" accent="#c084fc">
        <Kicker>Your result</Kicker>
        <Avatar emoji={result.emoji} />
        <h1 className="mt-4 text-[64px] font-extrabold leading-none tracking-tight">
          {result.lead} <span className="grad">{result.grad}</span>
        </h1>
        <Sub>{result.blurb}</Sub>
        <PrizeBadge>{result.playPrize}</PrizeBadge>
        <EndActions onPlayAgain={restart} />
      </GameShell>
    );
  }

  // ---- Quiz screen ----
  return (
    <GameShell ribbon="04 · THIS OR THAT" accent="#c084fc">
      <Kicker>
        Swipe your vibe · {Math.min(index + 1, QUESTIONS.length)} of{" "}
        {QUESTIONS.length}
      </Kicker>

      <div
        ref={cardRef}
        key={index}
        onPointerDown={mounted ? handlePointerDown : undefined}
        onPointerUp={mounted ? handlePointerUp : undefined}
        role="group"
        aria-label="Pick your vibe: tap the top or bottom option, or swipe left or right"
        className="pop flex cursor-pointer select-none flex-col items-center justify-center gap-[18px] rounded-[26px] border border-border"
        style={{
          width: 440,
          height: 400,
          background: "linear-gradient(180deg,#121a2c,#0d1424)",
          touchAction: "none",
        }}
      >
        {/* Top / first option */}
        <div className="flex min-h-[64px] flex-1 flex-col items-center justify-center px-6 transition-transform active:scale-95">
          <div className="text-[40px] font-bold not-italic leading-tight">
            {question.a.emoji} {question.a.label}
          </div>
          <div className="mt-2 font-mono text-[12px] tracking-[2px] text-dim">
            tap here · ◀ swipe left
          </div>
        </div>

        {/* Divider */}
        <div className="font-mono text-[15px] tracking-[3px] text-dim">
          — OR —
        </div>

        {/* Bottom / second option */}
        <div className="flex min-h-[64px] flex-1 flex-col items-center justify-center px-6 transition-transform active:scale-95">
          <div className="text-[40px] font-bold not-italic leading-tight">
            {question.b.emoji} {question.b.label}
          </div>
          <div className="mt-2 font-mono text-[12px] tracking-[2px] text-dim">
            tap here · swipe right ▶
          </div>
        </div>
      </div>

      {/* Directional hint row (.ar) */}
      <div className="mt-6 flex gap-[60px] font-mono text-[15px] text-dim">
        <span>
          ◀ <b className="text-ink">swipe left</b> for {question.a.hint}
        </span>
        <span>
          <b className="text-ink">swipe right</b> for {question.b.hint} ▶
        </span>
      </div>
    </GameShell>
  );
}
