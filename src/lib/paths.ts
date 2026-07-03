import type { PathId } from "./types";
export type { PathId } from "./types";

// Metadata for each IT path (reveal + score screens).
export interface PathMeta {
  id: PathId;
  label: string; // "The Builder"
  word: string; // the blue-highlighted word: "Builder"
  emoji: string;
  blurb: string;
  playPrize: string;
}

export const PATHS: Record<PathId, PathMeta> = {
  builder: {
    id: "builder",
    label: "The Builder",
    word: "Builder",
    emoji: "🔨",
    blurb: "You turn ideas into working software. This is where developers start.",
    playPrize: "ITeC sticker pack",
  },
  guardian: {
    id: "guardian",
    label: "The Guardian",
    word: "Guardian",
    emoji: "🛡️",
    blurb: "You keep systems safe and attackers out. Cybersecurity is calling.",
    playPrize: "ITeC enamel pin",
  },
  analyst: {
    id: "analyst",
    label: "The Analyst",
    word: "Analyst",
    emoji: "📊",
    blurb: "You find the story hiding in the data. Analytics is your turf.",
    playPrize: "ITeC notebook",
  },
  architect: {
    id: "architect",
    label: "The Architect",
    word: "Architect",
    emoji: "🏗️",
    blurb: "You design how all the pieces fit together. Systems are your canvas.",
    playPrize: "ITeC keychain",
  },
};

// Fixed order — also the sorter's tie-break order.
export const PATH_ORDER: PathId[] = [
  "builder",
  "guardian",
  "analyst",
  "architect",
];
