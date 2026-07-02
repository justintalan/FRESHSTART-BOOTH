"use client";

import { useState } from "react";

// Score-entry for scored games. Physical keyboard works; an on-screen keypad
// makes it usable on a touch booth with no keyboard. Blank submits as GUEST.
const ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const MAX = 12;

export function NameEntry({
  score,
  onSubmit,
}: {
  score: number;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState("");

  const push = (ch: string) => setName((n) => (n + ch).slice(0, MAX));
  const back = () => setName((n) => n.slice(0, -1));
  const submit = () => onSubmit(name.trim() || "GUEST");

  return (
    <div className="flex flex-col items-center">
      <div className="mb-1 font-mono text-[15px] uppercase tracking-[3px] text-dim">
        Your score
      </div>
      <div className="mb-5 text-[64px] font-bold leading-none">
        <span className="grad">{score}</span>
      </div>

      <div className="mb-2 font-mono text-[14px] tracking-[2px] text-dim">
        ENTER YOUR INITIALS
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value.toUpperCase().slice(0, MAX))}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder="GUEST"
        autoFocus
        className="mb-4 w-[420px] rounded-xl border border-border bg-panel px-5 py-4 text-center font-mono text-[28px] uppercase tracking-[6px] text-ink outline-none focus:border-[color:var(--a)]"
      />

      {/* On-screen keypad (touch booth) */}
      <div className="mb-4 flex flex-col items-center gap-2">
        {ROWS.map((row) => (
          <div key={row} className="flex gap-2">
            {row.split("").map((ch) => (
              <button
                key={ch}
                onClick={() => push(ch)}
                className="h-[56px] w-[56px] rounded-xl border border-border bg-panel font-mono text-[22px] text-ink transition-colors hover:border-[color:var(--a)] active:scale-95"
              >
                {ch}
              </button>
            ))}
          </div>
        ))}
        <div className="flex gap-2">
          <button
            onClick={back}
            className="h-[56px] w-[120px] rounded-xl border border-border bg-panel font-mono text-[18px] text-dim transition-colors hover:text-ink active:scale-95"
          >
            ⌫ DEL
          </button>
        </div>
      </div>

      <button
        onClick={submit}
        className="rounded-[14px] grad-fill px-10 py-4 text-[22px] font-bold text-[#04121a] transition-transform active:scale-95"
      >
        SAVE SCORE →
      </button>
    </div>
  );
}
