"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Stage } from "./Stage";
import { useIdleReset } from "../hooks/useIdleReset";

// The chrome shared by every game screen: scaled stage, topbar (ITeC mark +
// concept ribbon + back-to-menu), a centered main region, and the footer.
// Mounting a GameShell also arms the 30s idle-reset that returns to /.
export function GameShell({
  ribbon,
  accent = "#22d3ee",
  children,
  center = true,
  idle = true,
  onIdle,
}: {
  ribbon: string;
  accent?: string;
  children: ReactNode;
  center?: boolean;
  idle?: boolean;
  onIdle?: () => void;
}) {
  const router = useRouter();

  useIdleReset(() => {
    if (!idle) return;
    if (onIdle) onIdle();
    else router.push("/");
  }, 30_000);

  return (
    <Stage accent={accent}>
      <div className="flex h-full w-full flex-col">
        {/* Topbar */}
        <div className="flex items-center justify-between px-10 py-6">
          <div className="flex items-center gap-3 font-bold">
            <span className="grid h-[34px] w-[34px] place-items-center rounded-[9px] grad-fill font-extrabold not-italic text-[#04121a]">
              i
            </span>
            <span>ITeC</span>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="rounded-full border border-border px-[14px] py-2 font-mono text-[13px] tracking-[1px]"
              style={{
                color: "var(--a)",
                background: "rgba(34,211,238,.06)",
              }}
            >
              {ribbon}
            </div>
            <button
              onClick={() => router.push("/")}
              className="rounded-full border border-border px-[14px] py-2 font-mono text-[13px] tracking-[1px] text-dim transition-colors hover:text-ink"
              aria-label="Back to menu"
            >
              ✕ MENU
            </button>
          </div>
        </div>

        {/* Main */}
        <div
          className={
            center
              ? "flex flex-1 flex-col items-center justify-center px-[60px] text-center"
              : "flex flex-1 flex-col"
          }
        >
          {children}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-10 py-5 font-mono text-[13px] tracking-[1px] text-dim">
          ITeC FreshStart booth game // play to win // tap to play
        </div>
      </div>
    </Stage>
  );
}
