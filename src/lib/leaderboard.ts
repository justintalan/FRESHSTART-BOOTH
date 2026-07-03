import type { ScoreEntry } from "./types";

// Local-only daily leaderboard. Key: itec:pathsorter:<YYYY-MM-DD> — a new
// calendar day starts an empty board. Top 10, sorted high -> low.

const MAX_ENTRIES = 10;
const GAME_KEY = "pathsorter";

export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function boardStorageKey(day: string = todayKey()): string {
  return `itec:${GAME_KEY}:${day}`;
}

// Read today's board, sorted high -> low, capped at top 10.
export function getBoard(day: string = todayKey()): ScoreEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(boardStorageKey(day));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScoreEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e) =>
          e &&
          typeof e.name === "string" &&
          typeof e.score === "number" &&
          typeof e.ts === "number",
      )
      .sort((a, b) => b.score - a.score || a.ts - b.ts)
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

// Add a score to today's board. Blank names save as GUEST. Returns the
// updated board plus the entry's 1-based rank (null if outside the top 10).
export function addScore(
  entry: ScoreEntry,
  day: string = todayKey(),
): { board: ScoreEntry[]; rank: number | null } {
  const name = entry.name.trim()
    ? entry.name.trim().slice(0, 12).toUpperCase()
    : "GUEST";
  const clean: ScoreEntry = { name, score: entry.score, ts: entry.ts };
  if (typeof window === "undefined") return { board: [clean], rank: 1 };

  const existing = getBoardRaw(day);
  const combined = [...existing, clean].sort(
    (a, b) => b.score - a.score || a.ts - b.ts,
  );
  const rankIndex = combined.indexOf(clean);
  const rank = rankIndex >= 0 && rankIndex < MAX_ENTRIES ? rankIndex + 1 : null;
  const trimmed = combined.slice(0, MAX_ENTRIES);

  try {
    window.localStorage.setItem(boardStorageKey(day), JSON.stringify(trimmed));
  } catch {
    /* storage full / disabled — degrade silently */
  }
  return { board: trimmed, rank };
}

// The rank this score WOULD get if saved now (for the score screen headline).
export function prospectiveRank(score: number, day: string = todayKey()): number {
  const board = getBoard(day);
  return board.filter((e) => e.score >= score).length + 1;
}

function getBoardRaw(day: string): ScoreEntry[] {
  try {
    const raw = window.localStorage.getItem(boardStorageKey(day));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScoreEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
