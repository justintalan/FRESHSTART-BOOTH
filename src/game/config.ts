// Every tunable in one place. Ported from the approved design source
// (design-reference/RECURSE-approved.dc.html) — the props block plus the
// literals baked into its update loop.

/** Cells per side. Clamped to [10, 24] by geometry(). */
export const GRID_SIZE = 16;

/** Logical canvas size. The element is backed at 2x (see CANVAS_BACKING). */
export const CANVAS_SIZE = 616;

/** Device-pixel multiplier. ctx.setTransform(2,0,0,2,0,0) matches this. */
export const CANVAS_BACKING = 2;

/** Locked logic rate. Never round this — 1000/12 is 83.333…ms. */
export const FPS = 12;
export const STEP_MS = 1000 / FPS;

/** Catch-up guards. Together these stop drift across a backgrounded tab. */
export const MAX_CATCHUP_STEPS = 4;
export const MAX_FRAME_DELTA_MS = 250;

// Carve pacing, in carveStep() calls per logic frame. Overridden from the
// approved source (12 / 14) per the build amendment: on the default 16x16
// these land at ~1.64s in attract and ~1.19s in play.
export const CARVE_STEPS_ATTRACT = 26;
export const CARVE_STEPS_PLAY = 36;

/** Chance a dead end gets a wall knocked out, creating loops. */
export const BRAID_CHANCE = 0.45;

/** Input stays locked while READY? shows, after the play carve completes. */
export const READY_FRAMES = 12;

/** Frames a finished attract maze holds before wiping and carving another. */
export const ATTRACT_HOLD_FRAMES = 60;

/** Auto-return-to-attract holds. */
export const FORFEIT_HOLD_FRAMES = 110;
export const WIN_HOLD_FRAMES = 400;

/** Frames after entering forfeit/win before input is accepted. */
export const FORFEIT_INPUT_AFTER = 12;
export const WIN_INPUT_AFTER = 40;

/** No input for this long from any non-attract mode returns to attract. */
export const IDLE_MS = 30_000;

/** DFS cells consumed per logic frame while SOLVE IT runs. */
export const SOLVER_SPEED = 2;

/** 'daily' gives everyone at the booth the same maze; 'random' is for testing. */
export const SEED_MODE: "daily" | "random" = "daily";

/** Frames between repeat moves while a pointer is held down. */
export const STEER_REPEAT_FRAMES = 2;

/** Frames a wall-hit flash and a revisit flash stay lit. */
export const FLASH_FRAMES = 2;

/** Keys that steer, mapped to a [dx, dy] delta. */
export const KEY_MAP: Record<string, readonly [number, number]> = {
  w: [0, -1],
  arrowup: [0, -1],
  s: [0, 1],
  arrowdown: [0, 1],
  a: [-1, 0],
  arrowleft: [-1, 0],
  d: [1, 0],
  arrowright: [1, 0],
};
