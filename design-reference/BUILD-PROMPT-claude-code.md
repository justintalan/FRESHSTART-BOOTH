# Build Prompt — ITeC FreshStart Booth Game
Paste everything below the line into Claude Code, run from an empty folder.

---

## IMPLEMENTATION — ITeC FreshStart Booth Game (single web app, 6 mini-games)

### CONTEXT
- Stack: Next.js (App Router) + React + TypeScript + Tailwind CSS. Client-only, no backend. Deploy target: Vercel (one-click from GitHub).
- Agent target: Claude Code.
- Project type: greenfield (empty repo).
- Scores/leaderboard: local only. Use `localStorage`, keyed per game and per calendar day (so the daily leaderboard resets each day and each booth machine keeps its own board). No database, no auth.
- Visual source of truth: static HTML mockups already exist in `./design-reference/` (copy the 11 files from `booth-game-prototypes/` into a `design-reference/` folder in the repo). Match their colors, type, spacing, and layout closely. Do NOT redesign. Fonts: Space Grotesk (display) + JetBrains Mono (code/terminal), loaded from Google Fonts. Palette: bg `#0a0e17`, ink `#e8edf7`, dim `#7c8aa5`, panel `#111827`, border `#1f2a3d`, accents cyan `#22d3ee` / lime `#a3e635` / rose `#fb7185` / green `#34d399` / violet `#c084fc`.
- Target device: landscape desktop / booth monitor, ~1280x800. Big touch targets (min 64px). Also usable with mouse. Not optimized for phones.

### OBJECTIVE
A walk-up booth web app for ITeC FreshStart: an attract/home screen with a menu that launches any of six self-contained mini-games. Each game is understandable in one glance and finished in under a minute. Scored games save to a local daily leaderboard. The app auto-returns to the attract screen after 30s idle.

### PHASE 0 — ORIENT (read only)
Greenfield, so no recon. Instead:
1. Read every file in `./design-reference/` (especially `index.html` and each screen). These define the exact look of each game and the concept names.
2. Report the shared visual system you extracted (colors, fonts, card/tile/terminal styles) and the six concepts you found.
3. Confirm the plan below before Phase 1.

### PHASE 1 — INFRASTRUCTURE & DESIGN
Establish and report before writing game logic:
- [ ] Scaffold: `create-next-app` (TypeScript, Tailwind, App Router, `src/` dir).
- [ ] Routing: `/` = attract/home menu. Each game at `/play/[game]` OR a single-page state machine on `/` — pick one and justify. Home shows an "Enter fullscreen" control.
- [ ] Shared design tokens in `globals.css` / `tailwind.config.ts` from the palette above. Build reusable primitives: `GameShell` (topbar with ITeC mark + concept ribbon + footer), `Hud` (timer/score/combo pills), `Card`, `Tile`, `Terminal`, `Leaderboard`, `NameEntry`, `PrizeBadge`.
- [ ] Data model (TS types): `GameId`, `PathId` ('builder'|'guardian'|'analyst'|'architect'), `ScoreEntry {name, score, ts}`. 
- [ ] Leaderboard util: `getBoard(gameId)`, `addScore(gameId, entry)` reading/writing `localStorage` under key `itec:<gameId>:<YYYY-MM-DD>`, sorted desc, top 10.
- [ ] Idle manager: any game returns to `/` after 30s of no input; attract screen loops.
- [ ] State approach: local React state per game; no global store needed.
Report these decisions, then proceed.

### PHASE 2 — IMPLEMENTATION (file by file)
1. Scaffold + config: `tailwind.config.ts`, `src/app/globals.css` (tokens, fonts), `src/app/layout.tsx` (fonts, fullscreen-friendly body).
2. Shared lib: `src/lib/types.ts`, `src/lib/leaderboard.ts`, `src/lib/paths.ts` (path metadata: id, label, emoji, blurb, playPrize), `src/hooks/useIdleReset.ts`, `src/hooks/useCountdown.ts`.
3. Primitives: `src/components/GameShell.tsx`, `Hud.tsx`, `Leaderboard.tsx`, `NameEntry.tsx`, `PrizeBadge.tsx`.
4. Attract/home: `src/app/page.tsx` — ITeC title, "Play to win. Tap a game to start", a grid of 6 game tiles (name + one-line hook), and a "Today's Top" teaser pulling the best score across scored games.
5. Games (one folder each, self-contained):
   - `path-sorter/` — 4 this-or-that questions (each choice adds to path tallies), reveal screen (winning path + PrizeBadge + "Play for the grand prize"), then Debug Sprint: render a code snippet with buggy tokens; 20s countdown; tapping a bug = +100 x combo, combo++; wrong tap = combo reset; end → score + NameEntry + Leaderboard.
   - `terminal-reveal/` — typewriter terminal, 3 prompts (keys 1/2/3 or tap), maps to a role, reveal role + prize. No score.
   - `debug-arcade/` — 30s reflex: bugs spawn on a 6-col grid at intervals, tap before they despawn, score + combo, end → NameEntry + Leaderboard.
   - `this-or-that/` — 6 preference cards, tap left/right (and support arrow keys + swipe), tally to a result label + path, reveal + prize.
   - `build-setup/` — grid of gadget tiles, multi-select, "Reveal my path" maps the selection to a path, reveal + prize.
   - `spot-phish/` — 3 rounds, each shows two messages (one legit, one phishing), 8s each, tap the scam = +100, end → NameEntry + Leaderboard. Include the sample content from the mockup and 2 more rounds.
For each file state its path, what it does, key signatures/prop shapes, and what it must NOT do (no backend calls, no analytics, no auth).

### PHASE 3 — UI / UX VALIDATION
- [ ] First load: attract/home menu with 6 game tiles + Today's Top teaser, ITeC branding, fullscreen control.
- [ ] Interactive elements: game tiles, this-or-that/sorter choices, tappable bugs, terminal options, gadget tiles, phish message cards, name-entry field + submit, "play again" / "back to menu".
- [ ] Success: scored games show final score, rank, and updated daily leaderboard; sorter/quiz games show path/result + play-prize badge.
- [ ] Error/empty: empty leaderboard shows a friendly "Be the first today" state; name entry defaults to "GUEST" if blank; invalid route redirects to `/`.
- [ ] Loading: none needed (client-only); ensure no hydration flashes for time/random values (generate on client after mount).
- [ ] Responsive: fixed landscape ~1280x800, scale to fit the viewport; large touch targets. Phones not required.

### CONSTRAINTS
- Do not add a backend, database, auth, or analytics.
- Do not redesign the visual language — match `./design-reference/`.
- Keep each game fully self-contained; no cross-game imports except shared primitives and lib.
- Keep it deployable to Vercel with zero config (`next build` must pass, no env vars required).

### ACCEPTANCE CRITERIA (binary)
- [ ] `npm run dev` runs; `/` shows the attract menu with all 6 games.
- [ ] Each of the 6 games launches, plays start to finish, and returns to the menu.
- [ ] Path Sorter maps 4 answers to one of 4 paths and shows its reveal + play prize.
- [ ] Debug Sprint (in path-sorter) and Debug Arcade both count down, score with combo, and end cleanly.
- [ ] A scored run saves to the daily leaderboard and appears ranked on reload the same day.
- [ ] The leaderboard is empty again on a simulated next day (different date key).
- [ ] Blank name defaults to GUEST; unknown route redirects to `/`.
- [ ] 30s idle in any game returns to the attract screen.
- [ ] `next build` passes with no type errors. App deploys to Vercel with no env setup.

### REPORT BACK
When done, tell Kevin: every file created and why; the routing decision (per-route vs single-page) and rationale; any game mechanics you had to define beyond the mockups; anything deferred; and the exact commands to run locally and to deploy to Vercel.
