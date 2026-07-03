"use client";

import type { Round } from "../lib/types";

// The tappable code snippet (mockup 4). Every non-whitespace token is a tap
// target. Found bugs flip to their CLEAN text with the green "fixed" style;
// a wrong tap flashes the tapped token red and shakes it. Unfound bugs render
// as plain text — nothing gives them away.
export function CodePanel({
  round,
  found,
  wrongFlashId,
  onTap,
}: {
  round: Round;
  found: Set<string>;
  wrongFlashId: string | null;
  onTap: (tokenId: string) => void;
}) {
  return (
    <div className="w-[700px] rounded-2xl border border-border bg-surface px-7 py-6 text-left font-mono text-[20px] leading-[1.95] text-body shadow-[0_12px_34px_rgba(30,41,59,0.07)]">
      {round.lines.map((line) => (
        <div key={line.num} className="whitespace-pre">
          <span className="mr-4 text-dim-2">{line.num}</span>
          {line.tokens.map((tok) => {
            if (tok.text.trim() === "") {
              return <span key={tok.tokenId}>{tok.text}</span>;
            }
            const isFound = tok.isBug && found.has(tok.tokenId);
            const isFlash = wrongFlashId === tok.tokenId;
            let cls = "cursor-pointer rounded-lg py-[2px] transition-colors";
            if (isFound) {
              cls +=
                " pop border border-fix-border bg-fix-bg px-2 text-fix";
            } else if (isFlash) {
              cls +=
                " shake border border-bug-border bg-bug-bg px-2 text-bug";
            }
            return (
              <span
                key={tok.tokenId}
                className={cls}
                onPointerDown={() => onTap(tok.tokenId)}
              >
                {isFound && tok.fix !== undefined ? tok.fix : tok.text}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
