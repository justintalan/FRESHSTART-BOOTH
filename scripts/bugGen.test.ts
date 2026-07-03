// Sanity + variety tests for the Debug Sprint generator.
// Run: npx -y tsx scripts/bugGen.test.ts
import { generateRound } from "../src/lib/bugGen";
import { SNIPPET_TEMPLATES } from "../src/lib/snippets";

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    failures++;
    console.error(`FAIL: ${msg}`);
  }
}

// --- Template bank invariants ---
assert(SNIPPET_TEMPLATES.length >= 20, "at least 20 templates");
for (const t of SNIPPET_TEMPLATES) {
  const sites = t.lines.flat().filter((tok) => typeof tok !== "string");
  assert(
    t.lines.length >= 5 && t.lines.length <= 9,
    `${t.id}: 5-9 lines (got ${t.lines.length})`,
  );
  assert(sites.length >= 6, `${t.id}: >=6 bug sites (got ${sites.length})`);
  for (const s of sites) {
    assert(s.clean !== s.buggy, `${t.id}: clean != buggy for "${s.clean}"`);
    assert(s.buggy.trim() !== "", `${t.id}: buggy form "${s.buggy}" is tappable`);
  }
}

// --- Every generated round is solvable, with 4-6 bugs by default ---
for (let i = 0; i < 200; i++) {
  const r = generateRound();
  assert(r.bugCount >= 4 && r.bugCount <= 6, `round ${i}: 4-6 bugs (got ${r.bugCount})`);
  assert(r.bugTokenIds.size === r.bugCount, `round ${i}: bugTokenIds matches bugCount`);
  const rendered = new Map(
    r.lines.flatMap((l) => l.tokens.map((tok) => [tok.tokenId, tok] as const)),
  );
  for (const id of r.bugTokenIds) {
    const tok = rendered.get(id);
    assert(!!tok && tok.isBug, `round ${i}: bug ${id} is a rendered token`);
    assert(!!tok && tok.text.trim() !== "", `round ${i}: bug ${id} is visible/tappable`);
  }
}

// --- Variety: 20 unseeded runs almost never repeat template+bug-set ---
const combos = new Set<string>();
for (let i = 0; i < 20; i++) {
  const r = generateRound();
  combos.add(`${r.templateId}|${[...r.bugTokenIds].sort().join(",")}`);
}
console.log(`variety: ${combos.size}/20 distinct template+bug-set combos`);
assert(combos.size >= 15, `>=15/20 distinct combos (got ${combos.size})`);

// --- Determinism with a seed ---
const a = generateRound({ seed: 42 });
const b = generateRound({ seed: 42 });
assert(
  a.templateId === b.templateId &&
    [...a.bugTokenIds].sort().join() === [...b.bugTokenIds].sort().join(),
  "same seed -> identical round",
);
const c = generateRound({ seed: 43 });
assert(
  !(
    a.templateId === c.templateId &&
    [...a.bugTokenIds].sort().join() === [...c.bugTokenIds].sort().join()
  ),
  "different seed -> different round (seed 42 vs 43)",
);

if (failures === 0) {
  console.log("ALL TESTS PASSED");
} else {
  console.error(`${failures} assertion(s) failed`);
  process.exit(1);
}
