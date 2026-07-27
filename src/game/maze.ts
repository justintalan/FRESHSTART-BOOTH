// The maze model: carve, braid, analyze, shortest path. Knows nothing about
// score, canvas, React or storage. Ported from the approved design source.

import { BRAID_CHANCE } from "./config";
import { mulberry32 } from "./rng";
import { E_DIR, N_DIR, S_DIR, W_DIR, type Geometry } from "./types";

/**
 * Cell pitch and inset for a grid of `gridSize` cells across a `size` px
 * canvas. On the default 16 / 616 this is P=38, pass=30, off=8.
 */
export function geometry(gridSize: number, size: number): Geometry {
  const N = Math.max(10, Math.min(24, Math.round(gridSize)));
  const P = Math.floor((size - 8) / N);
  const off = 8 + Math.floor((size - (N * P + 8)) / 2);
  return { N, P, pass: P - 8, off };
}

export class Maze {
  geo: Geometry;
  /** Wall bitmask per cell. A set bit means that side is closed. */
  walls: Uint8Array;
  /** 1 once the carve has reached a cell. Also gates rendering. */
  seen: Uint8Array;
  /** Quartile of BFS distance from the start, 0-3. Null until analyze(). */
  band: Uint8Array | null = null;
  /** 1 = junction (3+ open sides), 2 = dead end (exactly 1). */
  marks: Uint8Array | null = null;
  /** Carve frontier. Also drawn as the magenta carve head. */
  stack: number[];
  carving = true;
  /** BFS shortest path length start -> goal. -1 until the carve completes. */
  par = -1;
  parReady = false;

  private rand: () => number;

  constructor(gridSize: number, size: number, seed: number) {
    this.geo = geometry(gridSize, size);
    const n = this.geo.N * this.geo.N;
    this.walls = new Uint8Array(n).fill(15);
    this.seen = new Uint8Array(n);
    this.rand = mulberry32(seed);
    this.stack = [0];
    this.seen[0] = 1;
  }

  get cellCount(): number {
    return this.geo.N * this.geo.N;
  }

  /**
   * One step of iterative recursive backtracking. Returns whether work
   * remains, so the carve can be animated a few steps per logic frame.
   */
  carveStep(): boolean {
    const { N } = this.geo;
    if (!this.stack.length) {
      this.carving = false;
      this.afterCarve();
      return false;
    }
    const cur = this.stack[this.stack.length - 1];
    const x = cur % N;
    const y = (cur / N) | 0;

    // [wall bit to clear on cur, neighbour cell, wall bit to clear on it]
    const opts: [number, number, number][] = [];
    if (y > 0 && !this.seen[cur - N]) opts.push([N_DIR, cur - N, S_DIR]);
    if (x < N - 1 && !this.seen[cur + 1]) opts.push([E_DIR, cur + 1, W_DIR]);
    if (y < N - 1 && !this.seen[cur + N]) opts.push([S_DIR, cur + N, N_DIR]);
    if (x > 0 && !this.seen[cur - 1]) opts.push([W_DIR, cur - 1, E_DIR]);

    if (opts.length) {
      const p = opts[(this.rand() * opts.length) | 0];
      this.walls[cur] &= ~p[0];
      this.walls[p[1]] &= ~p[2];
      this.seen[p[1]] = 1;
      this.stack.push(p[1]);
    } else {
      this.stack.pop();
    }
    return true;
  }

  /** Run the carve to completion in one go (reduced motion, and SOLVE IT
   *  pressed straight from attract). */
  finishCarve(): void {
    let guard = 0;
    while (this.carving && guard++ < 80_000) this.carveStep();
  }

  private afterCarve(): void {
    this.braid();
    this.analyze();
    this.par = this.shortest(0, this.cellCount - 1).length - 1;
    this.parReady = true;
  }

  /**
   * Knock a wall out of some dead ends so the maze has loops rather than a
   * single forced route. Only ever removes walls, so connectivity is kept.
   */
  braid(): void {
    const { N } = this.geo;
    for (let c = 0; c < N * N; c++) {
      if (this.openCount(c) !== 1) continue;
      if (this.rand() >= BRAID_CHANCE) continue;
      const x = c % N;
      const y = (c / N) | 0;
      const closed: [number, number, number][] = [];
      if (y > 0 && this.walls[c] & N_DIR) closed.push([N_DIR, c - N, S_DIR]);
      if (x < N - 1 && this.walls[c] & E_DIR) closed.push([E_DIR, c + 1, W_DIR]);
      if (y < N - 1 && this.walls[c] & S_DIR) closed.push([S_DIR, c + N, N_DIR]);
      if (x > 0 && this.walls[c] & W_DIR) closed.push([W_DIR, c - 1, E_DIR]);
      if (!closed.length) continue;
      const p = closed[(this.rand() * closed.length) | 0];
      this.walls[c] &= ~p[0];
      this.walls[p[1]] &= ~p[2];
    }
  }

  /** BFS from cell 0, filling the wall-colour bands and the junction /
   *  dead-end marks. */
  analyze(): void {
    const n = this.cellCount;
    const dist = new Int32Array(n).fill(-1);
    dist[0] = 0;
    const q = [0];
    let max = 0;
    for (let i = 0; i < q.length; i++) {
      const c = q[i];
      const nb = this.neighbors(c);
      for (let k = 0; k < nb.length; k++) {
        if (dist[nb[k]] < 0) {
          dist[nb[k]] = dist[c] + 1;
          if (dist[nb[k]] > max) max = dist[nb[k]];
          q.push(nb[k]);
        }
      }
    }
    this.band = new Uint8Array(n);
    this.marks = new Uint8Array(n);
    for (let c = 0; c < n; c++) {
      const d = dist[c] < 0 ? max : dist[c];
      this.band[c] = Math.min(3, Math.floor((d / (max + 1)) * 4));
      const oc = this.openCount(c);
      this.marks[c] = oc >= 3 ? 1 : oc === 1 ? 2 : 0;
    }
  }

  /** True if the given side of cell `a` is passable. */
  open(a: number, dir: number): boolean {
    return (this.walls[a] & dir) === 0;
  }

  openCount(c: number): number {
    const { N } = this.geo;
    const x = c % N;
    const y = (c / N) | 0;
    let n = 0;
    if (y > 0 && !(this.walls[c] & N_DIR)) n++;
    if (x < N - 1 && !(this.walls[c] & E_DIR)) n++;
    if (y < N - 1 && !(this.walls[c] & S_DIR)) n++;
    if (x > 0 && !(this.walls[c] & W_DIR)) n++;
    return n;
  }

  neighbors(c: number): number[] {
    const { N } = this.geo;
    const x = c % N;
    const y = (c / N) | 0;
    const out: number[] = [];
    if (y > 0 && this.open(c, N_DIR)) out.push(c - N);
    if (x < N - 1 && this.open(c, E_DIR)) out.push(c + 1);
    if (y < N - 1 && this.open(c, S_DIR)) out.push(c + N);
    if (x > 0 && this.open(c, W_DIR)) out.push(c - 1);
    return out;
  }

  /** BFS shortest path as a cell array, inclusive of both ends. */
  shortest(from: number, to: number): number[] {
    const n = this.cellCount;
    const prev = new Int32Array(n).fill(-1);
    const q = [from];
    prev[from] = from;
    for (let i = 0; i < q.length; i++) {
      const c = q[i];
      if (c === to) break;
      const nb = this.neighbors(c);
      for (let k = 0; k < nb.length; k++) {
        if (prev[nb[k]] === -1) {
          prev[nb[k]] = c;
          q.push(nb[k]);
        }
      }
    }
    const path: number[] = [];
    let c = to;
    let guard = 0;
    while (c !== from && guard++ < n) {
      path.push(c);
      c = prev[c];
      if (c < 0) return [from];
    }
    path.push(from);
    path.reverse();
    return path;
  }
}
