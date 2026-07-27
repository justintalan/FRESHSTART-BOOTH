// Local-only daily leaderboard. Key: recurse.board.<YYYYMMDD> — a new calendar
// day starts an empty board. Top 10, sorted high -> low. Every access is
// guarded so a blocked or full localStorage degrades instead of throwing.

import type { BoardEntry, BoardPort } from "@/game/types";

const MAX_ENTRIES = 10;

/** YYYYMMDD, matching the daily seed string. */
export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export function boardStorageKey(day: string = todayKey()): string {
  return `recurse.board.${day}`;
}

function readRaw(day: string): BoardEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(boardStorageKey(day));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BoardEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e) =>
        e &&
        typeof e.name === "string" &&
        typeof e.score === "number" &&
        typeof e.steps === "number" &&
        typeof e.at === "number",
    );
  } catch {
    return [];
  }
}

/** Today's board, sorted high -> low, capped at ten. */
export function getBoard(day: string = todayKey()): BoardEntry[] {
  return readRaw(day)
    .sort((a, b) => b.score - a.score || a.at - b.at)
    .slice(0, MAX_ENTRIES);
}

/** Add one entry and persist the trimmed board. Returns the new board. */
export function addScore(
  entry: BoardEntry,
  day: string = todayKey(),
): BoardEntry[] {
  const clean: BoardEntry = {
    name: entry.name.trim().slice(0, 3).toUpperCase() || "AAA",
    score: entry.score,
    steps: entry.steps,
    at: entry.at,
  };
  const merged = [...readRaw(day), clean]
    .sort((a, b) => b.score - a.score || a.at - b.at)
    .slice(0, MAX_ENTRIES);
  if (typeof window === "undefined") return merged;
  try {
    window.localStorage.setItem(boardStorageKey(day), JSON.stringify(merged));
  } catch {
    /* storage full or disabled — degrade silently */
  }
  return merged;
}

/** The engine reaches storage only through this. */
export function createBoardPort(day: string = todayKey()): BoardPort {
  return {
    load: () => getBoard(day),
    save: (entry) => {
      addScore(entry, day);
    },
  };
}
