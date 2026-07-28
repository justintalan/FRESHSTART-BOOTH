"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

// The fixed 1280x800 booth cabinet, scaled to fit whatever viewport it runs on
// and centred. The divisors carry headroom for the 17px bezel drawn by the
// box-shadow, matching the approved source.
//
// The outer wrapper stays `position:fixed;inset:0` on purpose — that's what
// makes its measured size always exactly the viewport, independent of the
// cabinet's own size, avoiding a measure-resize feedback loop.
//
// The cabinet itself is a two-box pattern: `outerBox` is sized to its real,
// post-scale visual footprint (1280*scale x 800*scale), and `innerBox` is
// the fixed 1280x800 content with the actual `transform: scale`. This is
// deliberate: CSS transforms are paint-only and never change an element's
// *layout* size, so if the scaled box were the one directly measured for
// centering/overflow, the browser would still see it as a full 1280x800 box
// no matter how small it's drawn — "safe center" would trigger its overflow
// fallback (and any scrollable area would be sized) against that phantom
// unscaled box, not the real one, producing exactly the kind of
// off-centre/clipped layout this component exists to prevent.
export function Stage({ children }: { children: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const fit = () => {
      const { width, height } = el.getBoundingClientRect();
      setScale(Math.min(width / 1310, height / 830));
      setReady(true);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, []);

  const outerStyle: CSSProperties = {
    flex: "0 0 auto",
    width: 1280 * scale,
    height: 800 * scale,
    opacity: ready ? 1 : 0,
  };

  const innerStyle: CSSProperties = {
    position: "relative",
    width: 1280,
    height: 800,
    overflow: "hidden",
    borderRadius: 22,
    background: "var(--color-screen)",
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    boxShadow:
      "0 0 0 14px var(--color-cabinet),0 0 0 17px var(--color-band-3),0 24px 80px rgba(0,0,0,.8)",
  };

  return (
    <div
      ref={wrapRef}
      className="fixed inset-0 bg-cabinet"
      style={{
        display: "flex",
        alignItems: "safe center",
        justifyContent: "safe center",
        overflow: "auto",
      }}
    >
      <div style={outerStyle}>
        <div style={innerStyle}>{children}</div>
      </div>
    </div>
  );
}
