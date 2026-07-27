// Iterative DFS from the start cell — the recursion the game is named for.
// Deterministic: neighbours are taken in N/E/S/W order, no PRNG involved.

import type { Maze } from "./maze";

export class Solver {
  /** The live descent. Drawn as the thick magenta polyline. */
  stack: number[];
  /** Cells popped on a dead end. Drawn as ghost hatching. */
  ghosts: Set<number>;
  done = false;

  private maze: Maze;
  private goal: number;
  private seen: Uint8Array;

  constructor(maze: Maze, start: number, goal: number, ghosts: Set<number>) {
    this.maze = maze;
    this.goal = goal;
    this.stack = [start];
    this.ghosts = ghosts;
    this.seen = new Uint8Array(maze.cellCount);
    this.seen[start] = 1;
  }

  /** One cell of descent, or one backtrack. */
  step(): void {
    if (this.done) return;
    const top = this.stack[this.stack.length - 1];
    if (top === this.goal) {
      this.done = true;
      return;
    }
    const nb = this.maze.neighbors(top).filter((c) => !this.seen[c]);
    if (nb.length) {
      const c = nb[0];
      this.seen[c] = 1;
      this.stack.push(c);
    } else {
      this.ghosts.add(this.stack.pop() as number);
      if (!this.stack.length) this.done = true;
    }
  }
}
