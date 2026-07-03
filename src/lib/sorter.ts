import type { PathId } from "./types";
import { PATH_ORDER } from "./paths";

// The 4-question tap sorter. Each option adds weight to one or two paths;
// scoreSorter picks the highest-weighted path (ties broken by PATH_ORDER).

export interface SorterOption {
  emoji: string;
  title: string; // "BUILD IT"
  sub: string; // "Make things from scratch"
  weights: Partial<Record<PathId, number>>;
}

export interface SorterQuestion {
  // Headline split so the blue accent word renders like the mockup:
  // "Build it <or> break it?"
  pre: string;
  accent: string;
  post: string;
  options: [SorterOption, SorterOption];
}

export const SORTER_QUESTIONS: SorterQuestion[] = [
  {
    pre: "Build it ",
    accent: "or",
    post: " break it?",
    options: [
      {
        emoji: "🔨",
        title: "BUILD IT",
        sub: "Make things from scratch",
        weights: { builder: 2, architect: 1 },
      },
      {
        emoji: "🔍",
        title: "BREAK IT",
        sub: "Find what's wrong",
        weights: { guardian: 2, analyst: 1 },
      },
    ],
  },
  {
    pre: "Big picture ",
    accent: "or",
    post: " fine detail?",
    options: [
      {
        emoji: "🗺️",
        title: "BIG PICTURE",
        sub: "How it all connects",
        weights: { architect: 2, analyst: 1 },
      },
      {
        emoji: "🔬",
        title: "FINE DETAIL",
        sub: "Get every piece exact",
        weights: { builder: 1, guardian: 1 },
      },
    ],
  },
  {
    pre: "Chase the ",
    accent: "clue",
    post: " or ship the thing?",
    options: [
      {
        emoji: "🕵️",
        title: "CHASE THE CLUE",
        sub: "Dig until it makes sense",
        weights: { analyst: 2, guardian: 1 },
      },
      {
        emoji: "🚀",
        title: "SHIP THE THING",
        sub: "Get it out into the world",
        weights: { builder: 2, architect: 1 },
      },
    ],
  },
  {
    pre: "Guard the ",
    accent: "gate",
    post: " or draw the map?",
    options: [
      {
        emoji: "🛡️",
        title: "GUARD THE GATE",
        sub: "Nothing gets past you",
        weights: { guardian: 2, builder: 1 },
      },
      {
        emoji: "📐",
        title: "DRAW THE MAP",
        sub: "Plan before anyone builds",
        weights: { architect: 2, analyst: 1 },
      },
    ],
  },
];

// answers[i] is the chosen option index (0 | 1) for SORTER_QUESTIONS[i].
export function scoreSorter(answers: number[]): PathId {
  const totals: Record<PathId, number> = {
    builder: 0,
    guardian: 0,
    analyst: 0,
    architect: 0,
  };
  answers.forEach((choice, i) => {
    const option = SORTER_QUESTIONS[i]?.options[choice];
    if (!option) return;
    for (const [path, w] of Object.entries(option.weights)) {
      totals[path as PathId] += w ?? 0;
    }
  });
  let best: PathId = PATH_ORDER[0];
  for (const path of PATH_ORDER) {
    if (totals[path] > totals[best]) best = path;
  }
  return best;
}
