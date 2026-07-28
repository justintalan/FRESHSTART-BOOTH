// The state machine. Owns position, counters, score easing, idle timeout and
// mode transitions. No React, no DOM, no localStorage.

import {
  ATTRACT_HOLD_FRAMES,
  CANVAS_SIZE,
  CARVE_STEPS_ATTRACT,
  CARVE_STEPS_PLAY,
  FLASH_FRAMES,
  FORFEIT_HOLD_FRAMES,
  FORFEIT_INPUT_AFTER,
  GRID_SIZE,
  IDLE_MS,
  KEY_MAP,
  READY_FRAMES,
  SEED_MODE,
  SOLVER_SPEED,
  STEER_REPEAT_FRAMES,
  TIME_LIMIT_SECONDS,
  WIN_HOLD_FRAMES,
  WIN_INPUT_AFTER,
} from "./config";
import { geometry, Maze } from "./maze";
import { fnv1a } from "./rng";
import { DEFAULT_POOL, REVISIT_COST, score } from "./scoring";
import { Solver } from "./solver";
import {
  E_DIR,
  INITIAL_HUD,
  N_DIR,
  S_DIR,
  W_DIR,
  type HudState,
  type Mode,
  type Point,
} from "./types";

export type EngineOptions = {
  reducedMotion?: boolean;
  gridSize?: number;
  size?: number;
  solverSpeed?: number;
  seedMode?: "daily" | "random";
  scorePool?: number;
  /** YYYYMMDD. Injectable so the daily seed can be exercised in tests. */
  today?: string;
};

type HitEdge = { c: number; dir: number };
type Flash = { text: string; until: number; c: number };

/** INSERT COIN cycles amber -> mint -> magenta -> bone, one frame each. */
const COIN_TONES = ["player", "goal", "rec", "bone"] as const;

export class RecurseEngine {
  mode: Mode = "attract";
  frame = 0;
  maze: Maze;

  /** Player cell, null outside a run. */
  pos: number | null = null;
  start = 0;
  goal: number | null = null;

  steps = 0;
  hits = 0;
  revisits = 0;
  usedSolve = false;
  /** Per-cell entry count, capped at 9. 1 renders dithered, 2+ solid. */
  visits: Uint16Array;
  /** Every cell entered this run, in order, backtracks and all — the actual
   *  route walked, as opposed to the BFS shortest path. Feeds the win sweep. */
  path: number[] = [0];

  /** Cells the solver abandoned. Rendered as ghost hatching. */
  ghosts = new Set<number>();
  solver: Solver | null = null;

  hitEdge: HitEdge | null = null;
  hitUntil = -1;
  flash: Flash | null = null;

  winPath: number[] | null = null;
  winFrame = 0;
  sweep = 0;
  finalScore = 0;

  /** Eased score readout, chasing `target`. */
  disp = 0;
  target = 0;

  hud: HudState = { ...INITIAL_HUD };
  onHud: ((hud: HudState) => void) | null = null;

  readonly today: string;
  readonly pool: number;

  private readonly reduced: boolean;
  private readonly gridSize: number;
  private readonly size: number;
  private readonly solverSpeed: number;
  private readonly seedMode: "daily" | "random";
  /** Carve direction this session favors. Rolled once per engine (i.e. per
   *  booth session) so every maze it generates leans the same way. */
  private readonly sessionBias: number;

  private elapsed = 0;
  private t0: number | null = null;
  private lastInput = Date.now();
  private lastMoveFrame = -99;
  private readyUntil: number | null = null;
  private attractHold = 0;
  private holdFrames = 0;
  private pointer: Point | null = null;
  private forfeitCause: "solve" | "time" = "solve";
  private repeatAt = 0;

  constructor(opts: EngineOptions) {
    this.reduced = opts.reducedMotion ?? false;
    this.gridSize = opts.gridSize ?? GRID_SIZE;
    this.size = opts.size ?? CANVAS_SIZE;
    this.solverSpeed = Math.max(1, Math.round(opts.solverSpeed ?? SOLVER_SPEED));
    this.seedMode = opts.seedMode ?? SEED_MODE;
    this.pool = Math.max(1000, Math.round(opts.scorePool ?? DEFAULT_POOL));
    this.sessionBias = [N_DIR, E_DIR, S_DIR, W_DIR][(Math.random() * 4) | 0];

    if (opts.today) {
      this.today = opts.today;
    } else {
      const d = new Date();
      this.today =
        String(d.getFullYear()) +
        String(d.getMonth() + 1).padStart(2, "0") +
        String(d.getDate()).padStart(2, "0");
    }

    // Placeholders replaced immediately by startAttract().
    this.maze = new Maze(this.gridSize, this.size, 1);
    this.visits = new Uint16Array(this.maze.cellCount);
    this.disp = this.pool;
    this.target = this.pool;
    this.startAttract();
  }

  // ---------- frame timing helpers ----------

  /** Frames since the last move, used for the sprite walk cycle. */
  framesSinceMove(): number {
    return this.frame - this.lastMoveFrame;
  }

  locked(): boolean {
    return (
      this.maze.carving ||
      (this.readyUntil !== null && this.frame < this.readyUntil)
    );
  }

  // ---------- modes ----------

  startAttract(): void {
    this.mode = "attract";
    this.newMaze((Math.random() * 1e9) | 0);
    this.pos = null;
    this.goal = null;
    if (this.reduced) this.maze.finishCarve();
    this.attractHold = 0;
    this.elapsed = 0;
    this.t0 = null;
    this.push({ statusLine: "DEMO", winMsg: "", forfeitStat: "" });
  }

  startPlay(): void {
    this.mode = "play";
    const seed =
      this.seedMode === "daily"
        ? fnv1a(
            "recurse-" + this.today + "-" + geometry(this.gridSize, this.size).N,
          )
        : (Math.random() * 1e9) | 0;
    this.newMaze(seed);
    if (this.reduced) this.maze.finishCarve();

    const N = this.maze.geo.N;
    this.start = 0;
    this.goal = N * N - 1;
    this.pos = 0;
    this.visits[0] = 1;
    this.path = [0];
    this.steps = 0;
    this.hits = 0;
    this.revisits = 0;
    this.usedSolve = false;
    this.t0 = null;
    this.elapsed = 0;
    this.readyUntil = null;
    this.lastMoveFrame = -99;
    this.disp = this.pool;
    this.target = this.pool;
    this.push({ statusLine: "PLAYER 1", winMsg: "", forfeitStat: "" });
  }

  private newMaze(seed: number): void {
    this.maze = new Maze(this.gridSize, this.size, seed, this.sessionBias);
    this.visits = new Uint16Array(this.maze.cellCount);
    this.ghosts = new Set();
    this.solver = null;
    this.winPath = null;
    this.hitEdge = null;
    this.hitUntil = -1;
    this.flash = null;
  }

  beginSolve(): void {
    if (this.mode !== "play" || this.maze.carving) return;
    this.usedSolve = true;
    this.mode = "solving";
    this.ghosts.clear();
    this.solver = new Solver(
      this.maze,
      this.start,
      this.goal as number,
      this.ghosts,
    );
    this.push({ statusLine: "AUTO SOLVE" });
    if (this.reduced) {
      // Three bulk chunks rather than an animated descent.
      for (let i = 0; i < 3; i++) {
        let n = 0;
        while (this.mode === "solving" && n++ < 4000) this.solverStep();
      }
    }
  }

  private solverStep(): void {
    if (!this.solver) return;
    this.solver.step();
    if (this.solver.done) this.finishSolve();
  }

  private finishSolve(): void {
    this.mode = "forfeit";
    this.holdFrames = 0;
    this.forfeitCause = "solve";
    const onPath = this.solver ? this.solver.stack.length : 0;
    this.push({
      statusLine: "GAME OVER",
      isForfeit: true,
      isTimeUp: false,
      forfeitStat:
        this.ghosts.size + " dead ends abandoned / " + onPath + " on path",
    });
  }

  private timeUp(): void {
    this.mode = "forfeit";
    this.holdFrames = 0;
    this.forfeitCause = "time";
    this.push({
      statusLine: "TIME'S UP",
      isForfeit: true,
      isTimeUp: true,
      forfeitStat: this.steps + " steps taken / out of time",
    });
  }

  private win(): void {
    this.mode = "won";
    this.winFrame = 0;
    this.finalScore = this.target;
    this.sweep = 0;
    this.winPath = this.path;
    this.disp = 0;
    this.push({ statusLine: "STAGE CLEAR" });
  }

  // ---------- input ----------

  private wake(): void {
    this.lastInput = Date.now();
  }

  /** Shared front door: any input at all wakes, and in some modes advances. */
  anyInput(): boolean {
    this.wake();
    if (this.mode === "attract") {
      this.startPlay();
      return true;
    }
    if (this.mode === "forfeit" && this.holdFrames > FORFEIT_INPUT_AFTER) {
      this.startAttract();
      return true;
    }
    if (this.mode === "won" && this.winFrame > WIN_INPUT_AFTER) {
      this.startAttract();
      return true;
    }
    return false;
  }

  /** `key` is an already-lowercased KeyboardEvent.key. */
  handleKey(key: string): void {
    if (this.anyInput()) return;
    const d = KEY_MAP[key];
    if (d) this.move(d[0], d[1]);
  }

  /** `p` is in logical canvas units, converted by the React layer. */
  pointerDown(p: Point): void {
    if (this.anyInput()) return;
    this.pointer = p;
    this.repeatAt = this.frame;
    this.steer(true);
  }

  pointerMove(p: Point): void {
    if (!this.pointer) return;
    this.pointer = p;
  }

  pointerUp(): void {
    this.pointer = null;
  }

  private steer(force: boolean): void {
    if (this.mode !== "play" || !this.pointer || this.locked()) return;
    if (this.pos === null) return;
    const g = this.maze.geo;
    const N = g.N;
    const cx = g.off + (this.pos % N) * g.P + g.pass / 2;
    const cy = g.off + ((this.pos / N) | 0) * g.P + g.pass / 2;
    const dx = this.pointer.x - cx;
    const dy = this.pointer.y - cy;
    // Inside the current cell with no drag intent yet — hold position.
    if (!force && Math.abs(dx) < g.P * 0.45 && Math.abs(dy) < g.P * 0.45) return;
    if (Math.abs(dx) >= Math.abs(dy)) this.move(dx > 0 ? 1 : -1, 0);
    else this.move(0, dy > 0 ? 1 : -1);
  }

  move(dx: number, dy: number): void {
    this.wake();
    if (this.mode !== "play" || this.locked()) return;
    if (this.pos === null) return;
    const N = this.maze.geo.N;
    const x = this.pos % N;
    const y = (this.pos / N) | 0;
    const nx = x + dx;
    const ny = y + dy;
    const dir =
      dx === 1 ? E_DIR : dx === -1 ? W_DIR : dy === 1 ? S_DIR : N_DIR;

    if (
      nx < 0 ||
      ny < 0 ||
      nx >= N ||
      ny >= N ||
      !this.maze.open(this.pos, dir)
    ) {
      this.hitEdge = { c: this.pos, dir };
      this.hitUntil = this.frame + FLASH_FRAMES;
      this.hits++;
      return;
    }

    if (this.t0 === null) this.t0 = Date.now();
    this.pos = ny * N + nx;
    this.path.push(this.pos);
    this.steps++;
    this.lastMoveFrame = this.frame;
    if (this.visits[this.pos] >= 1) {
      this.revisits++;
      this.flash = {
        text: "-" + REVISIT_COST,
        until: this.frame + FLASH_FRAMES,
        c: this.pos,
      };
    }
    this.visits[this.pos] = Math.min(9, this.visits[this.pos] + 1);
    if (this.pos === this.goal) this.win();
  }

  /** SOLVE IT. From attract it starts a run and skips straight to the maze. */
  solve(): void {
    this.wake();
    if (this.mode === "attract") {
      this.startPlay();
      this.maze.finishCarve();
    }
    this.beginSolve();
  }

  // ---------- one logic frame ----------

  step(): void {
    this.frame++;

    if (this.mode !== "attract" && Date.now() - this.lastInput > IDLE_MS) {
      this.startAttract();
    }

    if (this.mode === "attract") {
      if (this.maze.carving) {
        for (let i = 0; i < CARVE_STEPS_ATTRACT; i++) {
          if (this.maze.carving) this.maze.carveStep();
        }
      } else {
        this.attractHold++;
        if (this.attractHold > ATTRACT_HOLD_FRAMES) this.startAttract();
      }
    } else if (this.maze.carving) {
      for (let i = 0; i < CARVE_STEPS_PLAY; i++) {
        if (this.maze.carving) this.maze.carveStep();
      }
      if (!this.maze.carving) this.readyUntil = this.frame + READY_FRAMES;
    } else if (this.mode === "play") {
      if (this.pointer && this.frame - this.repeatAt >= STEER_REPEAT_FRAMES) {
        this.repeatAt = this.frame;
        this.steer(false);
      }
      if (this.t0) this.elapsed = (Date.now() - this.t0) / 1000;
      if (this.elapsed >= TIME_LIMIT_SECONDS) {
        this.timeUp();
      } else {
        this.target = score({
          pool: this.pool,
          steps: this.steps,
          par: this.maze.par,
          revisits: this.revisits,
          elapsedSeconds: this.elapsed,
          wallHits: this.hits,
        });
      }
    } else if (this.mode === "solving") {
      for (let i = 0; i < this.solverSpeed; i++) {
        if (this.mode === "solving") this.solverStep();
      }
    } else if (this.mode === "forfeit") {
      this.holdFrames++;
      if (this.holdFrames > FORFEIT_HOLD_FRAMES) this.startAttract();
    } else if (this.mode === "won") {
      this.winFrame++;
      if (this.winFrame > 3 && this.winPath) {
        this.sweep = Math.min(this.winPath.length, this.sweep + 3);
      }
      if (this.winFrame > 8) {
        this.disp = Math.min(
          this.finalScore,
          this.disp + Math.max(1, Math.ceil(this.finalScore / 22)),
        );
      }
      if (this.winFrame > WIN_HOLD_FRAMES) this.startAttract();
    }

    if (this.mode === "play" || this.mode === "solving") {
      const d = this.target - this.disp;
      this.disp += d === 0 ? 0 : d > 0 ? Math.ceil(d / 5) : Math.floor(d / 5);
    }

    this.pushHud();
  }

  private pushHud(): void {
    const live = this.mode !== "attract";
    const sc = live ? Math.round(this.disp) : this.pool;
    const remaining = Math.max(0, TIME_LIMIT_SECONDS - (this.elapsed || 0));
    const mm = Math.floor(remaining / 60);
    const ss = Math.floor(remaining % 60);
    const ready =
      this.mode === "play" &&
      this.readyUntil !== null &&
      this.frame < this.readyUntil;

    this.push({
      score: String(Math.max(0, sc)).padStart(6, "0"),
      winScore: String(Math.max(0, Math.round(this.disp || 0))).padStart(6, "0"),
      par: this.maze.parReady ? String(this.maze.par).padStart(2, "0") : "--",
      steps: String(live ? this.steps : 0).padStart(3, "0"),
      revisitStr: String(live ? this.revisits || 0 : 0).padStart(3, "0"),
      time: String(mm).padStart(2, "0") + ":" + String(ss).padStart(2, "0"),
      seedStr: this.seedMode === "daily" ? this.today : "RANDOM",
      isAttract: this.mode === "attract",
      isReady: ready,
      isPlaying: this.mode === "play" && !ready,
      isWin: this.mode === "won" && this.winFrame > 12,
      isSolving: this.mode === "solving",
      isForfeit: this.mode === "forfeit",
      isTimeUp: this.mode === "forfeit" && this.forfeitCause === "time",
      winMsg:
        this.mode === "won"
          ? "you made it out — claim your giveaway at the booth"
          : "",
      coinTone:
        this.mode === "attract" ? COIN_TONES[this.frame % 4] : "player",
      oneUpOn: this.mode === "play" ? this.frame % 12 < 6 : true,
    });
  }

  /**
   * Shallow-diff push. A per-frame setState with unchanged values would tank
   * the framerate, so React only hears about genuine changes.
   */
  private push(o: Partial<HudState>): void {
    let diff = false;
    for (const k in o) {
      const key = k as keyof HudState;
      if ((this.hud[key] as unknown) !== (o[key] as unknown)) {
        diff = true;
        break;
      }
    }
    if (!diff) return;
    this.hud = { ...this.hud, ...o };
    if (this.onHud) this.onHud(this.hud);
  }
}
