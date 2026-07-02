// Shared data model for the ITeC FreshStart booth game.

export type GameId =
  | "path-sorter"
  | "terminal-reveal"
  | "debug-arcade"
  | "this-or-that"
  | "build-setup"
  | "spot-phish";

export const GAME_IDS: GameId[] = [
  "path-sorter",
  "terminal-reveal",
  "debug-arcade",
  "this-or-that",
  "build-setup",
  "spot-phish",
];

export function isGameId(value: string): value is GameId {
  return (GAME_IDS as string[]).includes(value);
}

// The four IT identities a sorter/quiz game can land you on.
export type PathId = "builder" | "guardian" | "analyst" | "architect";

// A single leaderboard row for a scored game, stored in localStorage.
export interface ScoreEntry {
  name: string;
  score: number;
  ts: number;
}

// Which games post a numeric score to a daily leaderboard.
export const SCORED_GAMES: GameId[] = [
  "path-sorter",
  "debug-arcade",
  "spot-phish",
];

export function isScoredGame(id: GameId): boolean {
  return SCORED_GAMES.includes(id);
}
