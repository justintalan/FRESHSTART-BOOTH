"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

// The fixed 1280x800 booth canvas, scaled to fit whatever viewport it runs on
// and centered. Accent sets the per-screen --a CSS variable used throughout.
export function Stage({
  accent = "#22d3ee",
  glow = true,
  children,
}: {
  accent?: string;
  glow?: boolean;
  children: ReactNode;
}) {
  const [scale, setScale] = useState(1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fit = () => {
      setScale(Math.min(window.innerWidth / 1280, window.innerHeight / 800));
      setReady(true);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const style = {
    "--a": accent,
    width: 1280,
    height: 800,
    transform: `scale(${scale})`,
    opacity: ready ? 1 : 0,
  } as CSSProperties;

  return (
    <div className="fixed inset-0 grid place-items-center overflow-hidden bg-bg-deep">
      <div
        style={style}
        className={`shrink-0 origin-center ${glow ? "screen-glow" : "bg-bg"}`}
      >
        {children}
      </div>
    </div>
  );
}
