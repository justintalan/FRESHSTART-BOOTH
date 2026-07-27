// Scoring coefficients, tunable in exactly one place.

export const DEFAULT_POOL = 100_000;
export const SCORE_MAX = 999_999;

/** Cost per step taken beyond par. */
export const OVER_PAR_COST = 500;
/** Cost per re-entry into an already visited cell. */
export const REVISIT_COST = 1200;
/** Cost per whole second elapsed since the first move. */
export const SECOND_COST = 120;
/** Cost per attempted move into a wall. */
export const WALL_HIT_COST = 900;

/** How far over par a run may finish and still reach the leaderboard. */
export const ELIGIBLE_SLACK = 10;

export type ScoreInput = {
  pool: number;
  steps: number;
  par: number;
  revisits: number;
  elapsedSeconds: number;
  wallHits: number;
};

export function score(input: ScoreInput): number {
  const over = Math.max(0, input.steps - input.par);
  const raw =
    input.pool -
    over * OVER_PAR_COST -
    input.revisits * REVISIT_COST -
    Math.floor(input.elapsedSeconds) * SECOND_COST -
    input.wallHits * WALL_HIT_COST;
  return Math.max(0, Math.min(SCORE_MAX, raw));
}

/** Only a clean run within par + 10 may sign the board. */
export function isEligible(
  usedSolve: boolean,
  steps: number,
  par: number,
): boolean {
  return !usedSolve && steps <= par + ELIGIBLE_SLACK;
}
