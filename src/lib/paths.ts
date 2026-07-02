import type { PathId } from "./types";
export type { PathId } from "./types";

// Metadata for each IT path (used by sorter / quiz reveal screens).
export interface PathMeta {
  id: PathId;
  label: string; // "THE BUILDER"
  word: string; // the gradient-highlighted word: "BUILDER"
  emoji: string;
  blurb: string;
  playPrize: string;
  accent: string; // hex accent for the reveal
}

export const PATHS: Record<PathId, PathMeta> = {
  builder: {
    id: "builder",
    label: "THE BUILDER",
    word: "BUILDER",
    emoji: "🔨",
    blurb: "You turn ideas into working software. Developers live here.",
    playPrize: "ITeC sticker pack",
    accent: "#22d3ee",
  },
  guardian: {
    id: "guardian",
    label: "THE GUARDIAN",
    word: "GUARDIAN",
    emoji: "🛡",
    blurb: "You keep the systems safe. Cybersecurity is calling.",
    playPrize: "ITeC enamel pin",
    accent: "#34d399",
  },
  analyst: {
    id: "analyst",
    label: "THE ANALYST",
    word: "ANALYST",
    emoji: "📊",
    blurb: "You find the story in the data. Analytics is your turf.",
    playPrize: "ITeC notebook",
    accent: "#c084fc",
  },
  architect: {
    id: "architect",
    label: "THE ARCHITECT",
    word: "ARCHITECT",
    emoji: "🏗",
    blurb: "You design how it all fits together. Systems are your canvas.",
    playPrize: "ITeC keychain",
    accent: "#fb7185",
  },
};

export const PATH_LIST: PathMeta[] = [
  PATHS.builder,
  PATHS.guardian,
  PATHS.analyst,
  PATHS.architect,
];
