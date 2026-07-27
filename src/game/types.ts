// Shared shapes. No `enum` and no constructor parameter properties anywhere in
// src/game — that keeps these modules runnable under Node's type-stripping.

export type Mode = "attract" | "play" | "solving" | "forfeit" | "won";

/** Wall bitmask directions. 1=N 2=E 4=S 8=W. */
export const N_DIR = 1;
export const E_DIR = 2;
export const S_DIR = 4;
export const W_DIR = 8;

export type Geometry = {
  /** Cells per side, clamped to [10, 24]. */
  N: number;
  /** Pitch: logical px from one cell origin to the next. */
  P: number;
  /** Passage width: P - 8, the 8px remainder being the wall/connector. */
  pass: number;
  /** Logical px inset of the grid inside the canvas. */
  off: number;
};

/** Everything React renders. Strings only — no per-frame numbers. */
export type HudState = {
  score: string;
  par: string;
  steps: string;
  time: string;
  revisitStr: string;
  seedStr: string;
  winScore: string;
  winMsg: string;
  forfeitStat: string;
  statusLine: string;
  isAttract: boolean;
  isReady: boolean;
  isWin: boolean;
  isSolving: boolean;
  isForfeit: boolean;
  /** True when the current forfeit was caused by the clock, not SOLVE IT. */
  isTimeUp: boolean;
  isPlaying: boolean;
  // Blink and cycle states. The approved source expressed these as CSS
  // keyframes that it never defined; driving them off the 12fps frame counter
  // reproduces the stated timings exactly and keeps all motion on one clock.
  // Each is pinned to a constant outside the mode that shows it, so it never
  // churns React when nothing is looking.
  /** INSERT COIN colour, cycling every frame (4 frames = .3333s). */
  coinTone: "player" | "goal" | "rec" | "bone";
  /** 1UP, blinking at 1Hz during play. */
  oneUpOn: boolean;
};

export const INITIAL_HUD: HudState = {
  score: "100000",
  par: "--",
  steps: "000",
  time: "00:00",
  revisitStr: "000",
  seedStr: "--------",
  winScore: "000000",
  winMsg: "",
  forfeitStat: "",
  statusLine: "DEMO",
  isAttract: true,
  isReady: false,
  isWin: false,
  isSolving: false,
  isForfeit: false,
  isTimeUp: false,
  isPlaying: false,
  coinTone: "player",
  oneUpOn: true,
};

export type Point = { x: number; y: number };
