"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Logo } from "@/components/Logo";
import { Stage } from "@/components/Stage";
import {
  CANVAS_BACKING,
  CANVAS_SIZE,
  KEY_MAP,
  MAX_CATCHUP_STEPS,
  MAX_FRAME_DELTA_MS,
  STEP_MS,
} from "@/game/config";
import { RecurseEngine } from "@/game/engine";
import { makeGrainDataUrl } from "@/game/grain";
import { draw, setDisplayFont } from "@/game/render";
import { INITIAL_HUD, type HudState } from "@/game/types";
import { pressStart2P } from "./fonts";

const DISPLAY = "var(--font-display)";
const MONO = "var(--font-mono)";

const TONE: Record<HudState["coinTone"], string> = {
  player: "var(--color-player)",
  goal: "var(--color-goal)",
  rec: "var(--color-rec)",
  bone: "var(--color-bone)",
};

const label = (size = 10, extra: CSSProperties = {}): CSSProperties => ({
  fontFamily: DISPLAY,
  fontSize: size,
  color: "var(--color-label)",
  letterSpacing: 2,
  ...extra,
});

const rule: CSSProperties = { height: 2, background: "var(--color-band-1)" };

const checker: CSSProperties = {
  flex: "1 1 auto",
  height: 24,
  backgroundImage:
    "repeating-conic-gradient(var(--color-band-1) 0% 25%,var(--color-cabinet) 0% 50%)",
  backgroundSize: "16px 16px",
};

const panel = (border: string, extra: CSSProperties = {}): CSSProperties => ({
  background: "var(--color-screen)",
  border: `2px solid ${border}`,
  ...extra,
});

const overlayCentre: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
};

const dpadKey: CSSProperties = { width: 72, height: 72, fontSize: 22 };

export default function Page() {
  const [hud, setHud] = useState<HudState>(INITIAL_HUD);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const grainRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<RecurseEngine | null>(null);

  useEffect(() => {
    setDisplayFont(pressStart2P.style.fontFamily);

    if (grainRef.current) {
      grainRef.current.style.backgroundImage = `url(${makeGrainDataUrl()})`;
      grainRef.current.style.backgroundSize = "96px 96px";
    }

    const engine = new RecurseEngine({
      reducedMotion:
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
    // No sync setState here: the first logic frame (<=83ms away) pushes the
    // full HUD from the rAF callback.
    engine.onHud = setHud;
    engineRef.current = engine;

    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (KEY_MAP[k] || k === " " || k === "enter") e.preventDefault();
      engine.handleKey(k);
    };
    window.addEventListener("keydown", onKey);

    // Fixed 12fps logic on an accumulator, rendering every rAF. The 250ms
    // delta clamp and the 4-step catch-up cap together are what stop a
    // backgrounded tab from unwinding thousands of frames on return.
    const ctx = canvasRef.current?.getContext("2d") ?? null;
    let last = performance.now();
    let acc = 0;
    let raf = 0;

    const tick = (t: number) => {
      acc += Math.min(MAX_FRAME_DELTA_MS, t - last);
      last = t;
      let guard = 0;
      while (acc >= STEP_MS && guard++ < MAX_CATCHUP_STEPS) {
        acc -= STEP_MS;
        engine.step();
      }
      if (ctx) draw(ctx, engine);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      engine.onHud = null;
      engineRef.current = null;
    };
  }, []);

  const local = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (CANVAS_SIZE / r.width),
      y: (e.clientY - r.top) * (CANVAS_SIZE / r.height),
    };
  };

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      engineRef.current?.pointerDown(local(e));
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* capture is a nicety, not a requirement */
      }
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      engineRef.current?.pointerMove(local(e));
    },
    [],
  );

  const onPointerUp = useCallback(() => {
    engineRef.current?.pointerUp();
  }, []);

  const move = (dx: number, dy: number) => engineRef.current?.move(dx, dy);

  return (
    <Stage>
      {/* marquee */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 40,
          background: "var(--color-cabinet)",
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "0 18px",
        }}
      >
        <div style={checker} />
        <span
          style={{
            fontFamily: DISPLAY,
            fontSize: 18,
            color: "var(--color-bone)",
            letterSpacing: 4,
          }}
        >
          RECURSE
        </span>
        <div style={checker} />
      </div>

      {/* top HUD */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 0,
          right: 0,
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          borderBottom: "2px solid var(--color-band-1)",
        }}
      >
        <span style={label()}>ITEC FRESHSTART</span>
        <span style={label()}>{hud.seedStr}</span>
      </div>

      {/* middle row */}
      <div
        style={{
          position: "absolute",
          top: 104,
          bottom: 64,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "stretch",
        }}
      >
        {/* left rail */}
        <div
          style={{
            width: 332,
            flex: "0 0 332px",
            padding: "22px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: DISPLAY,
                fontSize: 11,
                letterSpacing: 2,
                marginBottom: 14,
                color: hud.isPlaying
                  ? "var(--color-player)"
                  : "var(--color-label)",
                visibility: hud.isPlaying && !hud.oneUpOn ? "hidden" : "visible",
              }}
            >
              1UP
            </div>
            <div
              style={{
                fontFamily: DISPLAY,
                fontSize: 42,
                lineHeight: 1,
                letterSpacing: 1,
                color: "var(--color-bone)",
              }}
            >
              {hud.score}
            </div>
            <div style={{ ...rule, margin: "22px 0" }} />
            <div style={{ display: "flex", gap: 36 }}>
              <div>
                <div style={label(10, { marginBottom: 10 })}>PAR</div>
                <div
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: 22,
                    color: "var(--color-goal)",
                  }}
                >
                  {hud.par}
                </div>
              </div>
              <div>
                <div style={label(10, { marginBottom: 10 })}>STEPS</div>
                <div
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: 22,
                    color: "var(--color-player)",
                  }}
                >
                  {hud.steps}
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginTop: 26,
              }}
            >
              <span style={label(13, { letterSpacing: 1 })}>MADE BY</span>
              <Logo size={76} className="text-bone rc-logo" />
            </div>
          </div>
          <div>
            <div style={{ ...rule, marginBottom: 16 }} />
            <div style={label(11)}>{hud.statusLine}</div>
          </div>
        </div>

        {/* centre: canvas + overlays */}
        <div
          style={{
            flex: "1 1 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE * CANVAS_BACKING}
            height={CANVAS_SIZE * CANVAS_BACKING}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{
              width: CANVAS_SIZE,
              height: CANVAS_SIZE,
              display: "block",
              imageRendering: "pixelated",
              touchAction: "none",
            }}
          />

          {hud.isAttract && (
            <div style={{ ...overlayCentre, gap: 18 }}>
              <div
                style={panel("var(--color-band-1)", { padding: "18px 26px" })}
              >
                <span
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: 24,
                    letterSpacing: 2,
                    color: TONE[hud.coinTone],
                  }}
                >
                  LEFT CLICK TO PLAY
                </span>
              </div>
              <div
                style={{
                  background: "var(--color-screen)",
                  padding: "6px 10px",
                  fontFamily: MONO,
                  fontSize: 12,
                  letterSpacing: ".24em",
                  color: "var(--color-label)",
                }}
              >
                touch anywhere or press WASD to start
              </div>
            </div>
          )}

          {hud.isReady && (
            <div style={{ ...overlayCentre, flexDirection: "row" }}>
              <div
                style={panel("var(--color-player)", { padding: "20px 30px" })}
              >
                <span
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: 28,
                    color: "var(--color-player)",
                    letterSpacing: 3,
                  }}
                >
                  READY?
                </span>
              </div>
            </div>
          )}

          {hud.isSolving && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                display: "flex",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  background: "var(--color-screen)",
                  borderBottom: "2px solid var(--color-rec)",
                  padding: "10px 18px",
                  fontFamily: DISPLAY,
                  fontSize: 11,
                  letterSpacing: 2,
                  color: "var(--color-rec)",
                }}
              >
                AUTO SOLVE
              </div>
            </div>
          )}

          {hud.isWin && (
            <div style={overlayCentre}>
              <div
                style={panel("var(--color-goal)", {
                  padding: "32px 38px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 20,
                  minWidth: 470,
                })}
              >
                <div
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: 28,
                    color: "var(--color-goal)",
                    letterSpacing: 3,
                  }}
                >
                  STAGE CLEAR
                </div>
                <div
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: 52,
                    lineHeight: 1,
                    color: "var(--color-bone)",
                    letterSpacing: 2,
                  }}
                >
                  {hud.winScore}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 26,
                    fontFamily: DISPLAY,
                    fontSize: 11,
                    letterSpacing: 1,
                    color: "var(--color-label)",
                  }}
                >
                  <span>STEPS {hud.steps}</span>
                  <span>PAR {hud.par}</span>
                  <span>TIME {hud.time}</span>
                </div>
                <div style={{ ...rule, width: "100%" }} />
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 13,
                    letterSpacing: ".14em",
                    color: "var(--color-bone)",
                    textAlign: "center",
                    maxWidth: 400,
                  }}
                >
                  {hud.winMsg}
                </div>
              </div>
            </div>
          )}

          {hud.isForfeit && (
            <div style={overlayCentre}>
              <div
                style={panel("var(--color-rec)", {
                  padding: "24px 30px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 14,
                })}
              >
                <span
                  style={{
                    fontFamily: DISPLAY,
                    fontSize: 30,
                    color: "var(--color-rec)",
                    letterSpacing: 3,
                  }}
                >
                  {hud.isTimeUp ? "TIME'S UP" : "GAME OVER"}
                </span>
                <span style={label(11)}>
                  {hud.isTimeUp ? "OUT OF TIME" : "SOLVED BY RECURSION"}
                </span>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 12,
                    letterSpacing: ".14em",
                    color: "var(--color-label)",
                  }}
                >
                  {hud.forfeitStat}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* right rail */}
        <div
          style={{
            width: 332,
            flex: "0 0 332px",
            padding: "22px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div style={{ textAlign: "right", width: "100%" }}>
            <div style={label(10, { marginBottom: 14 })}>TIME</div>
            <div
              style={{
                fontFamily: DISPLAY,
                fontSize: 34,
                color: "var(--color-bone)",
                letterSpacing: 1,
              }}
            >
              {hud.time}
            </div>
            <div style={{ ...rule, margin: "22px 0 14px" }} />
            <div style={label(10, { lineHeight: 1.9 })}>
              REVISIT {hud.revisitStr}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 14,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,72px)",
                gridTemplateRows: "repeat(2,72px)",
                gap: 6,
              }}
            >
              <button
                className="rc-btn rc-btn--dpad"
                onClick={() => move(0, -1)}
                style={{ ...dpadKey, gridColumn: 2, gridRow: 1 }}
              >
                ▲
              </button>
              <button
                className="rc-btn rc-btn--dpad"
                onClick={() => move(-1, 0)}
                style={{ ...dpadKey, gridColumn: 1, gridRow: 2 }}
              >
                ◀
              </button>
              <button
                className="rc-btn rc-btn--dpad"
                onClick={() => move(0, 1)}
                style={{ ...dpadKey, gridColumn: 2, gridRow: 2 }}
              >
                ▼
              </button>
              <button
                className="rc-btn rc-btn--dpad"
                onClick={() => move(1, 0)}
                style={{ ...dpadKey, gridColumn: 3, gridRow: 2 }}
              >
                ▶
              </button>
            </div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: ".18em",
                color: "var(--color-label)",
                textAlign: "right",
              }}
            >
              drag on the maze or use WASD
            </div>
          </div>
        </div>
      </div>

      {/* bottom HUD */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          borderTop: "2px solid var(--color-band-1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            className="rc-btn rc-btn--solve"
            onClick={() => engineRef.current?.solve()}
            style={{
              height: 56,
              padding: "0 22px",
              fontSize: 13,
              letterSpacing: 1,
            }}
          >
            SOLVE IT
          </button>
          <span style={label(10, { letterSpacing: 1 })}>FORFEITS RUN</span>
        </div>
        <div style={label(11, { letterSpacing: 3 })}>STAGE 01</div>
        <span style={label(10, { letterSpacing: 1 })}>CREDITS 01</span>
      </div>

      {/* CRT overlays, in order: grain, scanlines, vignette, inset shadow */}
      <div
        ref={grainRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.05,
          mixBlendMode: "screen",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "repeating-linear-gradient(to bottom,rgba(0,0,0,.26) 0px,rgba(0,0,0,.26) 1px,rgba(0,0,0,0) 1px,rgba(0,0,0,0) 3px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(120% 100% at 50% 50%,rgba(0,0,0,0) 52%,rgba(0,0,0,.40) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          borderRadius: 22,
          boxShadow:
            "inset 0 0 44px rgba(0,0,0,.55),inset 0 0 2px rgba(242,239,230,.14)",
        }}
      />
    </Stage>
  );
}
