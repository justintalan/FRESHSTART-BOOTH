// Shared shapes. No `enum` and no constructor parameter properties anywhere in
// src/game — that keeps these modules runnable under Node's type-stripping.

export type Mode =
  | "attract"
  | "play"
  | "solving"
  | "forfeit"
  | "won"
  | "initials"
  | "board";

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

export type BoardEntry = {
  name: string;
  score: number;
  steps: number;
  at: number;
};

/** How the engine reaches storage without importing it. */
export type BoardPort = {
  load: () => BoardEntry[];
  save: (entry: BoardEntry) => void;
};

export type BoardRow = {
  rank: string;
  name: string;
  detail: string;
  score: string;
};

/** Everything React renders. Strings only — no per-frame numbers. */
export type HudState = {
  score: string;
  par: string;
  steps: string;
  time: string;
  revisitStr: string;
  leader: string;
  seedStr: string;
  winScore: string;
  winMsg: string;
  forfeitStat: string;
  statusLine: string;
  i0: string;
  i1: string;
  i2: string;
  boardRows: BoardRow[];
  isAttract: boolean;
  isReady: boolean;
  isWin: boolean;
  isInitials: boolean;
  isBoard: boolean;
  isSolving: boolean;
  isForfeit: boolean;
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
  /** TOUCH TO CONTINUE on the board screen, blinking at 2Hz. */
  boardCueOn: boolean;
};

export const INITIAL_HUD: HudState = {
  score: "100000",
  par: "--",
  steps: "000",
  time: "00:00",
  revisitStr: "000",
  leader: "--- ------",
  seedStr: "--------",
  winScore: "000000",
  winMsg: "",
  forfeitStat: "",
  statusLine: "DEMO",
  i0: "A",
  i1: "A",
  i2: "A",
  boardRows: [],
  isAttract: true,
  isReady: false,
  isWin: false,
  isInitials: false,
  isBoard: false,
  isSolving: false,
  isForfeit: false,
  isPlaying: false,
  coinTone: "player",
  oneUpOn: true,
  boardCueOn: true,
};

export type Point = { x: number; y: number };
