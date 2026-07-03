import type { RenderedLine, Round } from "./types";
import { SNIPPET_TEMPLATES } from "./snippets";

// Builds a fresh Debug Sprint round: pick a random template, activate a
// random subset of its bug sites, and render every token with a stable id.
// With 20 templates x C(6..8 sites, 4..6 active) subsets, two unseeded calls
// almost never produce the same template + bug-set combination.

export interface GenerateOpts {
  seed?: number;
  minBugs?: number;
  maxBugs?: number;
}

// mulberry32 — tiny deterministic PRNG so tests can pass a seed.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateRound(opts: GenerateOpts = {}): Round {
  const { seed, minBugs = 4, maxBugs = 6 } = opts;
  const rand =
    seed === undefined ? Math.random : mulberry32(seed);

  const template =
    SNIPPET_TEMPLATES[Math.floor(rand() * SNIPPET_TEMPLATES.length)];

  // Collect every bug site position in the template.
  const sitePositions: { line: number; tok: number }[] = [];
  template.lines.forEach((line, li) => {
    line.forEach((tok, ti) => {
      if (typeof tok !== "string") sitePositions.push({ line: li, tok: ti });
    });
  });

  // Fisher–Yates shuffle, then activate between minBugs and maxBugs sites
  // (clamped to what the template offers, never below 1).
  for (let i = sitePositions.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [sitePositions[i], sitePositions[j]] = [sitePositions[j], sitePositions[i]];
  }
  const lo = Math.max(1, Math.min(minBugs, sitePositions.length));
  const hi = Math.max(lo, Math.min(maxBugs, sitePositions.length));
  const bugCount = lo + Math.floor(rand() * (hi - lo + 1));
  const active = new Set(
    sitePositions
      .slice(0, bugCount)
      .map((p) => `${p.line}:${p.tok}`),
  );

  const bugTokenIds = new Set<string>();
  const lines: RenderedLine[] = template.lines.map((line, li) => ({
    num: li + 1,
    tokens: line.map((tok, ti) => {
      const tokenId = `L${li + 1}T${ti}`;
      if (typeof tok === "string") {
        return { tokenId, text: tok, isBug: false };
      }
      const isBug = active.has(`${li}:${ti}`);
      if (isBug) bugTokenIds.add(tokenId);
      return isBug
        ? { tokenId, text: tok.buggy, isBug, fix: tok.clean }
        : { tokenId, text: tok.clean, isBug };
    }),
  }));

  return { templateId: template.id, lines, bugTokenIds, bugCount };
}
