import type { GameId } from "./types";

// Presentation metadata for each game — used by the attract menu tiles and by
// each game's GameShell ribbon. Pure data, safe to import from server code.
export interface GameMeta {
  id: GameId;
  title: string;
  hook: string; // one-line menu hook
  ribbon: string; // topbar concept ribbon
  accent: string; // per-game --a accent
  emoji: string;
  scored: boolean;
}

export const GAME_META: Record<GameId, GameMeta> = {
  "path-sorter": {
    id: "path-sorter",
    title: "Path Sorter",
    hook: "4 taps to your IT path, then a 20s bug-tapping sprint.",
    ribbon: "01 · PATH SORTER + DEBUG SPRINT",
    accent: "#22d3ee",
    emoji: "🧭",
    scored: true,
  },
  "terminal-reveal": {
    id: "terminal-reveal",
    title: "Terminal Reveal",
    hook: "A fake terminal reads you and assigns your IT role.",
    ribbon: "02 · TERMINAL REVEAL",
    accent: "#34d399",
    emoji: "💻",
    scored: false,
  },
  "debug-arcade": {
    id: "debug-arcade",
    title: "Debug Sprint Arcade",
    hook: "30s reflex test — squash every bug before time runs out.",
    ribbon: "03 · DEBUG SPRINT ARCADE",
    accent: "#fb7185",
    emoji: "🐛",
    scored: true,
  },
  "this-or-that": {
    id: "this-or-that",
    title: "This or That",
    hook: "6 quick tech preferences reveal your dev vibe.",
    ribbon: "04 · THIS OR THAT",
    accent: "#c084fc",
    emoji: "🔀",
    scored: false,
  },
  "build-setup": {
    id: "build-setup",
    title: "Build Your Setup",
    hook: "Tap the gadgets on your desk — your rig reveals your path.",
    ribbon: "05 · BUILD YOUR SETUP",
    accent: "#22d3ee",
    emoji: "🖥️",
    scored: false,
  },
  "spot-phish": {
    id: "spot-phish",
    title: "Spot the Phish",
    hook: "3 rounds — tap the scam before the timer ends.",
    ribbon: "06 · SPOT THE PHISH",
    accent: "#fb7185",
    emoji: "🎣",
    scored: true,
  },
};

export const GAME_LIST: GameMeta[] = [
  GAME_META["path-sorter"],
  GAME_META["terminal-reveal"],
  GAME_META["debug-arcade"],
  GAME_META["this-or-that"],
  GAME_META["build-setup"],
  GAME_META["spot-phish"],
];
