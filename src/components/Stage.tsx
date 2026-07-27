"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

// The fixed 1280x800 booth cabinet, scaled to fit whatever viewport it runs on
// and centred. The divisors carry headroom for the 17px bezel drawn by the
// box-shadow, matching the approved source.
export function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fit = () => {
      setScale(Math.min(window.innerWidth / 1310, window.innerHeight / 830));
      setReady(true);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const style: CSSProperties = {
    position: "relative",
    flex: "0 0 auto",
    width: 1280,
    height: 800,
    overflow: "hidden",
    borderRadius: 22,
    background: "var(--color-screen)",
    transform: `scale(${scale})`,
    transformOrigin: "center center",
    boxShadow:
      "0 0 0 14px var(--color-cabinet),0 0 0 17px var(--color-band-3),0 24px 80px rgba(0,0,0,.8)",
    opacity: ready ? 1 : 0,
  };

  return (
    <div className="fixed inset-0 grid place-items-center overflow-hidden bg-cabinet">
      <div style={style}>{children}</div>
    </div>
  );
}
