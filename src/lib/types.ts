// Shared data model for the ITeC FreshStart "What IT Path Are You" booth game.

// The four IT identities the sorter can land you on.
export type PathId = "builder" | "guardian" | "analyst" | "architect";

// A single leaderboard row, stored in localStorage (local-only, per day).
export interface ScoreEntry {
  name: string;
  score: number;
  ts: number;
}

/* ---------------- Bug generator ---------------- */

export type BugKind =
  | "assign-vs-equality" // == -> =
  | "off-by-one" // range(len(x)) -> range(1, len(x))
  | "wrong-case" // total -> Total
  | "colon" // missing / extra colon
  | "operator-swap" // + -> -, < -> <=
  | "index-error" // x[i] -> x[i+1]
  | "wrong-return" // return the wrong variable
  | "boolean-swap"; // and -> or

// A token in a template that MAY be rendered buggy. When the generator does
// not activate it, its `clean` form renders as a correct-looking decoy.
export interface BugSite {
  clean: string;
  buggy: string;
  kind: BugKind;
}

// A template line is an ordered list of plain strings and bug sites.
export type TemplateToken = string | BugSite;

export interface SnippetTemplate {
  id: string;
  lang: "python" | "js" | "pseudo";
  lines: TemplateToken[][];
}

// What the DEBUG screen actually renders and the player taps.
export interface RenderedToken {
  tokenId: string; // stable within a round, e.g. "L2T1"
  text: string;
  isBug: boolean; // true only for ACTIVATED bug sites
  fix?: string; // for activated sites: the clean text shown once found
}

export interface RenderedLine {
  num: number; // 1-based line number
  tokens: RenderedToken[];
}

export interface Round {
  templateId: string;
  lines: RenderedLine[];
  bugTokenIds: Set<string>;
  bugCount: number;
}
