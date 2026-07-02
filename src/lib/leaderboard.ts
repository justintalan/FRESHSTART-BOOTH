import type { GameId, ScoreEntry } from "./types";

// Leaderboards are local-only and reset per calendar day, per booth machine.
// Key: itec:<gameId>:<YYYY-MM-DD>

const MAX_ENTRIES = 10;

export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function boardStorageKey(gameId: GameId, day: string = todayKey()): string {
  return `itec:${gameId}:${day}`;
}

// Read today's board for a game, sorted high→low, capped at top 10.
export function getBoard(gameId: GameId, day: string = todayKey()): ScoreEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(boardStorageKey(gameId, day));
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

// Add a score to today's board. Returns the updated board plus the entry's
// 1-based rank (or null if it fell outside the top 10).
export function addScore(
  gameId: GameId,
  entry: ScoreEntry,
  day: string = todayKey(),
): { board: ScoreEntry[]; rank: number | null } {
  if (typeof window === "undefined") return { board: [entry], rank: 1 };
  const name = entry.name.trim() ? entry.name.trim().slice(0, 12) : "GUEST";
  const clean: ScoreEntry = { name, score: entry.score, ts: entry.ts };

  const existing = getBoardRaw(gameId, day);
  const combined = [...existing, clean].sort(
    (a, b) => b.score - a.score || a.ts - b.ts,
  );
  const rankIndex = combined.findIndex((e) => e === clean);
  const rank = rankIndex >= 0 && rankIndex < MAX_ENTRIES ? rankIndex + 1 : null;
  const trimmed = combined.slice(0, MAX_ENTRIES);

  try {
    window.localStorage.setItem(
      boardStorageKey(gameId, day),
      JSON.stringify(trimmed),
    );
  } catch {
    /* storage full / disabled — degrade silently */
  }
  return { board: trimmed, rank };
}

// Internal: unsorted, unfiltered read used before re-inserting.
function getBoardRaw(gameId: GameId, day: string): ScoreEntry[] {
  try {
    const raw = window.localStorage.getItem(boardStorageKey(gameId, day));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScoreEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Best single score across all scored games today (for the "Today's Top" teaser).
export function getTopToday(
  gameIds: GameId[],
  day: string = todayKey(),
): { gameId: GameId; entry: ScoreEntry } | null {
  let best: { gameId: GameId; entry: ScoreEntry } | null = null;
  for (const id of gameIds) {
    const board = getBoard(id, day);
    if (board.length && (!best || board[0].score > best.entry.score)) {
      best = { gameId: id, entry: board[0] };
    }
  }
  return best;
}
