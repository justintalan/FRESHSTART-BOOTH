// Canvas renderer. One entry point, draw(ctx, engine). Draw order is load
// bearing — it is what produces the layering — and is ported verbatim from the
// approved design source. Never mutates engine state, never calls rAF.

import { CANVAS_BACKING, CANVAS_SIZE } from "./config";
import type { RecurseEngine } from "./engine";
import { E_DIR, S_DIR, W_DIR } from "./types";

/** Canvas hexes. These mirror the @theme tokens in globals.css. */
const PAL = {
  screen: "#17132B",
  wallBase: "#3A3159",
  bands: ["#4C3F73", "#3A3159", "#2E2749", "#241E3C"],
  player: "#FFD23F",
  goal: "#3DF5C0",
  rec: "#FF3E8A",
  ghost: "#8B6BC4",
  bone: "#F2EFE6",
  node: "#5FD3FF",
} as const;

/** 8x8 player, two frames alternating every 6 frames while moving. */
const SPRITE = [
  [
    "..####..",
    ".######.",
    "########",
    "########",
    "##.##.##",
    "########",
    ".#.##.#.",
    "#......#",
  ],
  [
    "..####..",
    ".######.",
    "########",
    "########",
    "##.##.##",
    "########",
    "#.####.#",
    ".#....#.",
  ],
] as const;

/** Bayer 4x4 ordered dither. A single visit renders as this pattern, never
 *  as a translucent fill. */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

let ditherSrc: HTMLCanvasElement | null = null;
let dither: CanvasPattern | null = null;

/**
 * next/font hashes family names, so the literal "Press Start 2P" will not
 * resolve in ctx.font. The React layer hands the generated family in once.
 */
let displayFont = "monospace";
export function setDisplayFont(family: string): void {
  displayFont = family;
}

function ensureDither(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (dither) return dither;
  if (!ditherSrc) {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 4;
    const x = c.getContext("2d");
    if (!x) return null;
    x.fillStyle = PAL.player;
    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < 4; i++) {
        if (BAYER[j][i] < 7) x.fillRect(i, j, 1, 1);
      }
    }
    ditherSrc = c;
  }
  dither = ctx.createPattern(ditherSrc, "repeat");
  return dither;
}

export function draw(
  ctx: CanvasRenderingContext2D,
  engine: RecurseEngine,
): void {
  const maze = engine.maze;
  const g = maze.geo;
  const N = g.N;
  const P = g.P;
  const W = g.pass;
  const SIZE = CANVAS_SIZE;

  const pattern = ensureDither(ctx);
  ctx.setTransform(CANVAS_BACKING, 0, 0, CANVAS_BACKING, 0, 0);

  const cellX = (c: number) => g.off + (c % N) * P;
  const cellY = (c: number) => g.off + ((c / N) | 0) * P;

  // 1. Everything starts as the deepest wall band.
  ctx.fillStyle = PAL.bands[3];
  ctx.fillRect(0, 0, SIZE, SIZE);

  // 2. Paint each carved cell's block in its distance band. This is the wall.
  for (let c = 0; c < N * N; c++) {
    if (!maze.seen[c]) continue;
    ctx.fillStyle = maze.band ? PAL.bands[maze.band[c]] : PAL.wallBase;
    ctx.fillRect(cellX(c) - 4, cellY(c) - 4, P, P);
  }

  // 3. Punch the passages back out: cell interior plus the 8px connector
  //    east and south wherever a wall is open.
  ctx.fillStyle = PAL.screen;
  for (let c = 0; c < N * N; c++) {
    if (!maze.seen[c]) continue;
    const x = cellX(c);
    const y = cellY(c);
    ctx.fillRect(x, y, W, W);
    if (c % N < N - 1 && maze.open(c, E_DIR)) ctx.fillRect(x + W, y, 8, W);
    if (((c / N) | 0) < N - 1 && maze.open(c, S_DIR))
      ctx.fillRect(x, y + W, W, 8);
  }

  // 4. Junction dots and dead-end crosses.
  if (maze.marks) {
    const m = 6;
    const h = Math.floor((W - m) / 2);
    for (let c = 0; c < N * N; c++) {
      if (!maze.marks[c]) continue;
      const x = cellX(c) + h;
      const y = cellY(c) + h;
      if (maze.marks[c] === 1) {
        ctx.fillStyle = PAL.node;
        ctx.fillRect(x, y, m, m);
      } else {
        ctx.fillStyle = PAL.ghost;
        ctx.fillRect(x + 2, y, 2, m);
        ctx.fillRect(x, y + 2, m, 2);
      }
    }
  }

  // 5. Wall-hit flash on the blocked edge.
  if (engine.hitEdge && engine.frame <= engine.hitUntil) {
    const c = engine.hitEdge.c;
    const d = engine.hitEdge.dir;
    const x = cellX(c);
    const y = cellY(c);
    ctx.fillStyle = PAL.rec;
    if (d === E_DIR) ctx.fillRect(x + W, y, 8, W);
    else if (d === W_DIR) ctx.fillRect(x - 8, y, 8, W);
    else if (d === S_DIR) ctx.fillRect(x, y + W, W, 8);
    else ctx.fillRect(x, y - 8, W, 8);
  }

  // 6. Ghost hatching over cells the solver abandoned.
  if (engine.ghosts.size) {
    ctx.save();
    ctx.strokeStyle = PAL.ghost;
    ctx.lineWidth = 2;
    engine.ghosts.forEach((c) => {
      const x = cellX(c);
      const y = cellY(c);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, W, W);
      ctx.clip();
      ctx.beginPath();
      for (let k = -W; k < W; k += 7) {
        ctx.moveTo(x + k, y + W);
        ctx.lineTo(x + k + W, y);
      }
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }

  // 7. The live solver stack, mitred with a glow, plus a filled head.
  const sstack = engine.solver ? engine.solver.stack : null;
  if (
    sstack &&
    sstack.length &&
    (engine.mode === "solving" || engine.mode === "forfeit")
  ) {
    ctx.save();
    ctx.shadowColor = PAL.rec;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = PAL.rec;
    ctx.lineWidth = Math.max(4, W * 0.34);
    ctx.lineJoin = "miter";
    ctx.lineCap = "square";
    ctx.beginPath();
    for (let i = 0; i < sstack.length; i++) {
      const c = sstack[i];
      const x = cellX(c) + W / 2;
      const y = cellY(c) + W / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    const h = sstack[sstack.length - 1];
    ctx.fillStyle = PAL.rec;
    ctx.fillRect(cellX(h) + W * 0.18, cellY(h) + W * 0.18, W * 0.64, W * 0.64);
    ctx.restore();
  }

  // 8. Visit shading. One visit dithers, two or more goes solid.
  if (engine.mode !== "attract") {
    for (let c = 0; c < N * N; c++) {
      const v = engine.visits[c];
      if (!v) continue;
      const x = cellX(c);
      const y = cellY(c);
      if (v === 1 && pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(x, y, W, W);
      } else {
        ctx.fillStyle = PAL.player;
        ctx.fillRect(x, y, W, W);
      }
    }
  }

  // 9. Win sweep: a green wash, then the shortest path drawn progressively.
  if (engine.mode === "won" && engine.winPath) {
    if (engine.winFrame <= 3) {
      ctx.save();
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = PAL.goal;
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.restore();
    }
    ctx.save();
    ctx.shadowColor = PAL.player;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = PAL.player;
    ctx.lineWidth = Math.max(4, W * 0.36);
    ctx.lineCap = "square";
    ctx.lineJoin = "miter";
    ctx.beginPath();
    const n = Math.min(engine.sweep, engine.winPath.length);
    for (let i = 0; i < n; i++) {
      const c = engine.winPath[i];
      const x = cellX(c) + W / 2;
      const y = cellY(c) + W / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 10. Goal cell, with a blinking inner block.
  if (engine.goal !== null && !maze.carving) {
    const x = cellX(engine.goal);
    const y = cellY(engine.goal);
    ctx.save();
    ctx.shadowColor = PAL.goal;
    ctx.shadowBlur = 12;
    ctx.fillStyle = PAL.screen;
    ctx.fillRect(x, y, W, W);
    ctx.strokeStyle = PAL.goal;
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 2, y + 2, W - 4, W - 4);
    if (engine.frame % 12 < 7) {
      ctx.fillStyle = PAL.goal;
      ctx.fillRect(x + W * 0.34, y + W * 0.34, W * 0.32, W * 0.32);
    }
    ctx.restore();
  }

  // 11. Player sprite.
  if (engine.mode !== "attract" && engine.pos !== null && !maze.carving) {
    const x = cellX(engine.pos);
    const y = cellY(engine.pos);
    ctx.fillStyle = PAL.screen;
    ctx.fillRect(x, y, W, W);
    const px = Math.max(2, Math.floor((W * 0.75) / 8));
    const s = px * 8;
    const ox = x + Math.floor((W - s) / 2);
    const oy = y + Math.floor((W - s) / 2);
    const moving = engine.framesSinceMove() < 6;
    const rows = SPRITE[moving && Math.floor(engine.frame / 6) % 2 ? 1 : 0];
    ctx.save();
    ctx.shadowColor = PAL.player;
    ctx.shadowBlur = 12;
    ctx.fillStyle = PAL.player;
    for (let j = 0; j < 8; j++) {
      for (let i = 0; i < 8; i++) {
        if (rows[j][i] === "#") ctx.fillRect(ox + i * px, oy + j * px, px, px);
      }
    }
    ctx.restore();
  }

  // 12. Revisit cost flash, clamped inside the canvas.
  if (engine.flash && engine.frame <= engine.flash.until) {
    const x = cellX(engine.flash.c);
    const y = cellY(engine.flash.c);
    ctx.save();
    ctx.fillStyle = PAL.rec;
    ctx.font = `10px ${displayFont}`;
    ctx.textAlign = "center";
    ctx.fillText(
      engine.flash.text,
      Math.min(SIZE - 30, Math.max(30, x + W / 2)),
      Math.max(14, y - 6),
    );
    ctx.restore();
  }

  // 13. The carve head, while carving.
  if (maze.carving && maze.stack.length) {
    const h = maze.stack[maze.stack.length - 1];
    ctx.save();
    ctx.shadowColor = PAL.rec;
    ctx.shadowBlur = 10;
    ctx.fillStyle = PAL.rec;
    ctx.fillRect(cellX(h) + W * 0.2, cellY(h) + W * 0.2, W * 0.6, W * 0.6);
    ctx.restore();
  }
}
