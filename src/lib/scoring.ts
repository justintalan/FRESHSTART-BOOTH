import type { Round } from "./types";

// Precision scoring for the Debug Sprint. Untimed: the only pressure is
// accuracy. Each correct tap banks the current nextBugValue; each wrong tap
// shrinks what every remaining bug is worth (floored) and costs a little.

export const START_BUG_VALUE = 150;
export const WRONG_TAP_DECAY = 0.7;
export const MIN_BUG_VALUE = 30;
export const WRONG_TAP_PENALTY = 20;

export interface ScoreState {
  score: number;
  nextBugValue: number;
  found: Set<string>; // tokenIds of bugs already found
}

export type TapResult = "hit" | "miss" | "already-found";

export function createScoreState(): ScoreState {
  return { score: 0, nextBugValue: START_BUG_VALUE, found: new Set() };
}

export function applyTap(
  state: ScoreState,
  round: Round,
  tokenId: string,
): { state: ScoreState; result: TapResult; done: boolean } {
  if (state.found.has(tokenId)) {
    return { state, result: "already-found", done: isDone(state, round) };
  }
  if (round.bugTokenIds.has(tokenId)) {
    const found = new Set(state.found);
    found.add(tokenId);
    const next: ScoreState = {
      score: state.score + state.nextBugValue,
      nextBugValue: state.nextBugValue,
      found,
    };
    return { state: next, result: "hit", done: isDone(next, round) };
  }
  const next: ScoreState = {
    score: Math.max(0, state.score - WRONG_TAP_PENALTY),
    nextBugValue: Math.max(
      MIN_BUG_VALUE,
      Math.round(state.nextBugValue * WRONG_TAP_DECAY),
    ),
    found: state.found,
  };
  return { state: next, result: "miss", done: false };
}

export function isDone(state: ScoreState, round: Round): boolean {
  return state.found.size >= round.bugCount;
}
