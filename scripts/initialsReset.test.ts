// Regression: two students in a row must not share initials.
//
// The engine instance outlives a run, so `initials` and the i0/i1/i2 HUD slots
// both have to be cleared when name entry opens. Without the reset, a student
// who just hits ENTER signs the board under the previous student's initials.
//
// Run: npx -y tsx scripts/initialsReset.test.ts

import { RecurseEngine } from "../src/game/engine";
import type { BoardEntry, BoardPort } from "../src/game/types";

let failures = 0;
const check = (label: string, actual: unknown, expected: unknown) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  const ok = a === e;
  if (!ok) failures++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${label}` +
      (ok ? "" : `\n        expected ${e}\n        actual   ${a}`),
  );
};

/** In-memory stand-in for the localStorage board. */
const rows: BoardEntry[] = [];
const board: BoardPort = {
  load: () => rows.slice(),
  save: (entry) => {
    rows.push(entry);
  },
};

const engine = new RecurseEngine({ board, reducedMotion: true });

// Reach the private-ish run state the same way the React layer does.
const e = engine as unknown as {
  openInitials(): void;
  bump(i: number, d: number): void;
  submitInitials(): void;
  finalScore: number;
  steps: number;
};
const wheels = () => [engine.hud.i0, engine.hud.i1, engine.hud.i2];
const names = () => rows.map((r) => r.name);

// --- student 1 dials in K E V and submits --------------------------------
e.finalScore = 5000;
e.steps = 100;
e.openInitials();
check("student 1 opens on AAA", wheels(), ["A", "A", "A"]);

e.bump(0, 10); // A -> K
e.bump(1, 4); //  A -> E
e.bump(2, 21); // A -> V
check("student 1 wheels show KEV", wheels(), ["K", "E", "V"]);
e.submitInitials();
check("student 1 saved as KEV", names(), ["KEV"]);

// --- student 2 wins, opens name entry, immediately hits ENTER ------------
e.finalScore = 4000;
e.steps = 120;
e.openInitials();
check("student 2 wheels reset to AAA", wheels(), ["A", "A", "A"]);
e.submitInitials();
check("student 2 does NOT inherit KEV", names(), ["KEV", "AAA"]);

// --- student 3 dials only the last wheel --------------------------------
e.finalScore = 3000;
e.steps = 140;
e.openInitials();
check("student 3 wheels reset to AAA", wheels(), ["A", "A", "A"]);
e.bump(2, 25); // A -> Z, first two untouched
check("student 3 shows AAZ", wheels(), ["A", "A", "Z"]);
e.submitInitials();
check("student 3 saved as AAZ", names(), ["KEV", "AAA", "AAZ"]);

console.log(
  failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`,
);
process.exit(failures === 0 ? 0 : 1);
