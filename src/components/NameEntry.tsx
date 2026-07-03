"use client";

import { useState } from "react";
import { PrimaryButton } from "./Bits";

// Name field + SAVE SCORE (mockup 5). Blank saves as GUEST upstream.
export function NameEntry({ onSave }: { onSave: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <div className="mt-[6px] flex items-center gap-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value.toUpperCase().slice(0, 12))}
        placeholder="YOUR NAME"
        autoFocus
        className="w-[280px] rounded-xl border border-border-input bg-surface px-[18px] py-[14px] font-mono text-[20px] text-ink outline-none placeholder:text-dim-2 focus:border-primary-3"
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(name);
        }}
      />
      <PrimaryButton
        onClick={() => onSave(name)}
        className="px-[26px] py-[14px] text-[18px]"
      >
        SAVE SCORE
      </PrimaryButton>
    </div>
  );
}
