import type { ReactNode } from "react";

// Shared screen chrome from the mockups: topbar (ITeC mark + ribbon pill),
// centered main area, footer strap.
export function Shell({
  ribbon,
  children,
}: {
  ribbon: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between px-11 py-[26px]">
        <div className="flex items-center gap-[11px] font-bold text-ink">
          <span className="brand-fill grid h-[34px] w-[34px] place-items-center rounded-[10px] font-extrabold text-white shadow-[0_6px_16px_rgba(59,130,246,0.25)]">
            i
          </span>
          ITeC
        </div>
        <div className="rounded-full border border-ribbon-border bg-surface px-[14px] py-2 font-mono text-[13px] tracking-[1px] text-primary">
          {ribbon}
        </div>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-[60px] text-center">
        {children}
      </div>

      <div className="border-t border-border-foot px-11 py-5 font-mono text-[12px] tracking-[1px] text-dim-2">
        ITeC FreshStart // What IT Path Are You // untimed, precision scored
      </div>
    </div>
  );
}
