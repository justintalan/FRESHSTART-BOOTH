# IMPLEMENTATION — RECURSE booth game

Paste into Claude Code, run from the repo root.

## CONTEXT

- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 (CSS-first `@theme` in `src/app/globals.css`), fonts via `next/font/google`. Client only. No backend, no DB, no auth, no analytics. Deploys to Vercel with zero config.
- **Agent target:** Claude Code terminal.
- **Project type:** existing repo, `freshstart-booth`, branch `main`, remote `github.com/KevKujo23/freshstart-booth`.
- **Hard deadline:** the booth runs Wednesday July 29 2026. Working beats complete.
- **`AGENTS.md` in this repo says the installed Next.js differs from your training data.** Read `node_modules/next/dist/docs/` before writing App Router code. Heed deprecation notices.

### Recon findings (already done, do not repeat)

Current `main` is commit `8207ffe`, "Rebuild as single What IT Path Are You booth game (light theme)". That concept is dead and is being replaced wholesale.

What exists today:

| Path | Status |
| --- | --- |
| `src/app/page.tsx` | 5-phase state machine ATTRACT → SORTER → REVEAL → DEBUG → SCORE. **Replace entirely.** |
| `src/app/layout.tsx`, `globals.css` | Light theme, Space Grotesk + JetBrains Mono. **Rewrite.** |
| `src/app/not-found.tsx` | Redirects to `/`. Keep. |
| `src/components/Stage.tsx` | 1280x800 canvas scaled to fit. **Keep and reuse.** |
| `src/lib/leaderboard.ts` | localStorage daily board, `itec:<gameId>:<YYYY-MM-DD>`, top 10. **Keep, adapt the key.** |
| `src/components/{Shell,ChoiceCard,CodePanel,Hud,NameEntry,Leaderboard,Bits}.tsx` | Dead concept. **Delete.** |
| `src/lib/{sorter,paths,bugGen,snippets,scoring,types}.ts` | Dead concept. **Delete.** |
| `src/hooks/{useIdleReset,useMounted}.ts` | Still useful. Keep. |
| `README.md` | **Stale.** Describes six games at `/play/[game]` routes that were deleted in `8207ffe`. Rewrite it in Phase 4. |

### Design source of truth

`design-reference/RECURSE-approved.dc.html` is the **approved** Claude Design output. It is a Claude Design component (a `DCLogic` class plus templated markup), not runnable React. Every constant in it is final: palette hexes, geometry math, the 12fps loop, scoring coefficients, the draw order, the sprite bitmap, the Bayer dither matrix.

**Port it. Do not redesign it. Do not "improve" the numbers.** If something in it looks wrong, report it in the final summary rather than silently changing it.

---

## OBJECTIVE

The repo serves a single-page booth game called RECURSE: a braided maze that carves itself in with recursive backtracking, is solved by the player with touch or WASD, scored against BFS par, with a `SOLVE IT` button that runs DFS and forfeits the run, and a daily localStorage leaderboard. Rendered on a canvas at a locked 12fps.

---

## PHASE 0 — ORIENT (read only)

1. Read `AGENTS.md`, `package.json`, `next.config.ts`, `tsconfig.json`, `src/app/globals.css`, `src/app/layout.tsx`.
2. Read `src/components/Stage.tsx` and `src/lib/leaderboard.ts` in full. These two survive.
3. Read `design-reference/RECURSE-approved.dc.html` in full. It is about 43KB. Read all of it before writing anything.
4. Report: the exact Next.js and React versions, whether Tailwind v4 `@theme` is in use, and the current `Stage.tsx` scaling approach.

Confirm before Phase 1.

---

## PHASE 1 — INFRASTRUCTURE & DESIGN

Establish, then report back before writing feature code:

- [ ] **File structure.** Proposed below in Phase 2. Confirm or propose better, but keep the game logic out of the React component.
- [ ] **Fonts.** Swap to `Press Start 2P` (display and short labels) and `IBM Plex Mono` (long lines only) via `next/font/google`. Space Grotesk and JetBrains Mono go away.
- [ ] **Theme.** Rewrite `globals.css` `@theme` tokens to the RECURSE palette. Exact values in Phase 2.1. The app is dark only. Remove every light-theme token.
- [ ] **Routing.** Single route, `/`. No `/play/*`. `not-found.tsx` keeps redirecting to `/`.
- [ ] **State.** The game is a canvas render loop, not React state. Game state lives in a plain TypeScript class instance held in a ref. React re-renders only for HUD text, and only when a value actually changes. Do not put per-frame values in `useState`.
- [ ] **The 12fps loop.** `requestAnimationFrame` drives an accumulator that steps logic at exactly `1000/12` ms and caps catch-up at 4 steps per frame. Rendering happens every rAF. Do not use CSS transitions or `setInterval`.

---

## PHASE 2 — IMPLEMENTATION

Build in this order. Each file has a stated job and a stated non-job.

### 2.1 Theme and shell

**`src/app/globals.css`** — rewrite the `@theme` block. Exact palette, no substitutions:

```
--color-screen:   #17132B   /* stage background */
--color-cabinet:  #0E0B1C   /* outer bezel, marquee */
--color-band-0:   #4C3F73   /* wall, nearest quarter to start */
--color-band-1:   #3A3159
--color-band-2:   #2E2749
--color-band-3:   #241E3C   /* wall, deepest quarter */
--color-player:   #FFD23F
--color-goal:     #3DF5C0
--color-rec:      #FF3E8A   /* recursion / solver / wall hit */
--color-ghost:    #8B6BC4   /* labels, dead-end marks, abandoned trails */
--color-bone:     #F2EFE6   /* primary text */
--color-node:     #5FD3FF   /* junction dot */
```

Must NOT: keep any light-mode token, keep Space Grotesk or JetBrains Mono, add a color outside this list.

**`src/app/layout.tsx`** — load `Press Start 2P` (weight 400) and `IBM Plex Mono` (weight 400) via `next/font/google`, expose both as CSS variables, set `<body>` to the cabinet color. Set the page title to `RECURSE`. Must NOT: add a header, nav, footer, or any chrome. The stage is the entire page.

**`src/components/Stage.tsx`** — keep, but confirm it scales by `min(innerWidth / 1310, innerHeight / 830)` with `transform-origin: center` as the approved source does. Adjust if it differs.

### 2.2 Game logic, framework-free

Everything here is plain TypeScript with no React import. Port directly from the approved source.

**`src/game/rng.ts`**
- `mulberry32(seed: number): () => number` — the exact PRNG in the approved source, do not swap in `Math.random`.
- `fnv1a(str: string): number` — the string-to-seed hash.

**`src/game/maze.ts`** — the maze model. No rendering, no DOM.
- `geometry(gridSize: number, size: number)` returning `{ N, P, pass, off }`. `N` clamps to `[10, 24]`, default 16. `size` is the canvas logical size, 616.
- `carveStep()` — one step of iterative recursive backtracking over a `Uint8Array` wall bitmask where `1=N 2=E 4=S 8=W`. Returns whether work remains. Must stay stepwise so the carve can be animated.
- `braid(rand)` — after carving, for each cell with exactly one open side, with probability **0.45**, knock out one randomly chosen closed interior wall. This is what creates multiple routes. Only ever removes walls, never adds.
- `analyze()` — BFS from cell 0. Fills `band: Uint8Array` (0–3, quartile of distance, used for wall color) and `marks: Uint8Array` (`1` = junction, 3 or more open sides; `2` = dead end, exactly 1 open side).
- `shortest(from, to)` — BFS shortest path, returns the cell array. `par = shortest(0, N*N-1).length - 1`.
- `neighbors(c)`, `open(c, dir)`, `openCount(c)`.

Must NOT: know about score, canvas, React, or localStorage.

**`src/game/scoring.ts`**
```
score = clamp(0, 999999,
  pool
  - max(0, steps - par) * 500
  - revisits * 1200
  - floor(elapsedSeconds) * 120
  - wallHits * 900
)
```
`pool` defaults to 100000. Export the coefficients as named constants so they are tunable in one place. Also export `isEligible(usedSolve, steps, par)` returning `!usedSolve && steps <= par + 10`.

**`src/game/solver.ts`**
- `solveStep()` — one step of iterative DFS from the start. On a dead end, pop and record the popped cell in a `ghosts: Set<number>`. Runs `solverSpeed` steps per logic frame, default 2.

**`src/game/engine.ts`** — the state machine. Modes: `attract | play | solving | forfeit | won | initials | board`.
- Owns position, steps, revisits, wall hits, elapsed, the displayed-vs-target score easing, idle timeout, and mode transitions.
- Transitions to port exactly: any input during `attract` starts a play. 30 seconds without input from any non-attract mode returns to attract. After the carve completes in `play`, input stays locked for 12 frames while `READY?` shows. Reaching the goal enters `won`. `won` auto-returns to attract after 400 logic frames. `forfeit` auto-returns after 110.
- **Daily seed:** `fnv1a('recurse-' + YYYYMMDD + '-' + N)`. Everyone at the booth gets the same maze that day. A `seedMode` option of `'random'` exists for testing.
- **Revisit tracking:** a `visits: Uint16Array`. Entering a cell whose count is already 1 or more increments `revisits` and triggers a 2-frame `-1200` flash at that cell.

Must NOT: import React, touch the DOM, or call `localStorage` directly.

### 2.3 Rendering

**`src/game/render.ts`** — one exported `draw(ctx, engine)`. Port the approved `draw()` method verbatim in structure and order. The order matters and produces the layering:

1. Fill everything with band-3.
2. Per carved cell, fill a `P`-sized block in its band color. This paints the walls.
3. Punch the passages back to screen color: the cell interior plus, where a wall is open, the 8px connector east and south.
4. Junction dots (6x6, node cyan) and dead-end crosses (ghost violet).
5. Wall-hit flash, 2 frames, in rec magenta on the blocked edge.
6. Ghost hatching on abandoned solver cells: diagonal 2px strokes, clipped per cell, ghost violet.
7. The live solver stack as a thick mitred magenta polyline with a 10px shadow blur, plus a filled head block.
8. Visit shading: 1 visit renders with the **Bayer 4x4 ordered dither pattern**, 2 or more renders solid player amber. Use `ctx.createPattern` on a 4x4 offscreen canvas. Do not substitute `globalAlpha`.
9. Win sweep: a 3-frame goal-green full-canvas wash, then the shortest path drawn progressively in amber, 3 cells per frame.
10. Goal cell: screen fill, 3px goal stroke, inner block blinking on a 12-frame cycle.
11. Player: an 8x8 bitmap sprite, 2 frames alternating every 6 frames while moving, holding frame 0 when idle, with a 12px amber shadow blur. Both frames are in the approved source, copy them exactly.
12. Revisit `-1200` flash text, clamped to stay inside the canvas.
13. During carve, the current carve head as a magenta block.

Canvas is `616` logical, backed at `2x` via `ctx.setTransform(2,0,0,2,0,0)` with `image-rendering: pixelated` on the element. Must NOT: use `requestAnimationFrame` inside this file, or mutate engine state.

### 2.4 React layer

**`src/app/page.tsx`** — `"use client"`. Thin. It:
- Creates the engine in a ref on mount, starts the rAF loop, tears it down on unmount.
- Holds one `useState` object of HUD strings. Updates it only via a shallow-diff push, exactly as the approved source's `push()` does. A per-frame `setState` with unchanged values will tank the framerate.
- Renders the layout described in 2.5.
- Wires `pointerdown`/`pointermove`/`pointerup` on the canvas for drag steering, a `keydown` listener on `window` for WASD and arrows, and click handlers for the D-pad, `SOLVE IT`, and the initials wheel.
- Respects `prefers-reduced-motion`: skip the carve animation and finish it instantly, and run the solver in 3 bulk chunks instead of animating.

**`src/lib/leaderboard.ts`** — adapt the existing file. Key becomes `recurse.board.<YYYYMMDD>`. Entry shape `{ name: string; score: number; steps: number; at: number }`. Sorted desc, sliced to 10. Keep the existing try/catch guards so a blocked localStorage never throws.

### 2.5 Layout

Port from the approved markup. 1280x800 stage, `border-radius: 22px`, with the layered cabinet box-shadow.

- **Marquee strip**, 40px, cabinet color, `RECURSE` centered in the bitmap face, flanked by a repeating 8px checkerboard in band-1.
- **Top HUD**, 64px: `1UP` blinking at 1Hz during play, `HI-SCORE` centered, seed/date right.
- **Left rail**, 316px: score in the bitmap face, `PAR`, `STEPS`, `REVISITS`, today's best.
- **Center**: the 616-logical canvas, displayed at 616 CSS px, with the overlay panels for `INSERT COIN`, `READY?`, `STAGE CLEAR`, `GAME OVER`, initials entry, and the board.
- **Right rail**, 316px: `TIME` as elapsed `MM:SS` starting on the first move, status line, and the 3x2 D-pad at 72px per key.
- **Bottom HUD**, 64px: `SOLVE IT` with `FORFEITS RUN` beside it, `STAGE 01` centered, and on the right a `MADE BY` label plus a 48x48 dashed-border placeholder reading `LOGO`.
- **Four overlays**, in this order, all `pointer-events: none`: grain at `.05` screen blend, scanlines `repeating-linear-gradient` at `rgba(0,0,0,.26)` 1px on 3px, vignette to `rgba(0,0,0,.40)`, inset shadow `inset 0 0 44px rgba(0,0,0,.55)`.

Every button has exactly two states, idle and pressed. Pressed inverts the fill and translates down 4px. **No hover states.** A touchscreen has no hover and a fake one looks wrong.

### 2.6 Deletions

Delete: `src/components/Shell.tsx`, `ChoiceCard.tsx`, `CodePanel.tsx`, `Hud.tsx`, `NameEntry.tsx`, `Bits.tsx`, `Leaderboard.tsx`, and `src/lib/sorter.ts`, `paths.ts`, `bugGen.ts`, `snippets.ts`, `scoring.ts`, `types.ts`.

Then grep the whole `src/` tree for `builder`, `guardian`, `analyst`, `architect`, `PATHS`, `SORTER`, `Debug Sprint`, and `IT path`. Zero hits when you are done.

---

## PHASE 3 — UI / UX VALIDATION

- [ ] **First load:** attract mode. A maze visibly carves itself in over roughly 1.5s, `INSERT COIN` cycles its color through amber, mint, magenta, bone on a 4-frame loop. After the carve it holds 60 frames, then wipes and carves a different maze. Loops forever.
- [ ] **Interactive elements present:** canvas drag steering, WASD and arrow keys, the 3x2 D-pad, `SOLVE IT`, three initials wheels with up and down buttons, `ENTER`.
- [ ] **Success:** reaching the goal shows a green flash, sweeps the shortest path in amber, counts the score up digit by digit, shows `STAGE CLEAR`. If eligible, touching anything opens initials entry, then the board.
- [ ] **Not eligible:** the win panel says the player made it out and can claim their giveaway. Touching anything returns to attract without an initials prompt.
- [ ] **Forfeit:** `SOLVE IT` runs DFS at 2 cells per logic frame, leaves ghost hatching on every abandoned cell, ends on `GAME OVER` with a dead-ends-abandoned count.
- [ ] **Empty leaderboard:** today's best reads `--- ------`. The board screen renders with zero rows and does not crash.
- [ ] **Loading:** none needed. No network calls exist.
- [ ] **Responsive:** landscape desktop and booth monitor only. Phones are not a target. The stage scales, it does not reflow.

---

## CONSTRAINTS

- Do not add a backend, a database, auth, analytics, or any network call.
- Do not add a dependency without saying why in the report. The game needs none.
- Do not use CSS transitions, `setInterval`, or easing curves for game motion. Everything steps at 12fps.
- Do not use `globalAlpha` where the design calls for dithering.
- Do not redesign. The approved source is final.
- Do not touch `.vercel/`, `.next/`, or `node_modules/`.
- Do not refactor anything outside this feature.

---

## ACCEPTANCE CRITERIA

Binary. Each one passes or it does not.

- [ ] `npm run build` completes with no TypeScript errors and no ESLint errors.
- [ ] Loading `/` shows attract mode with a visibly animating carve within 2 seconds.
- [ ] Touching or pressing any WASD key from attract starts a play with a fresh maze.
- [ ] The maze has **loops**: at least one cell in a generated 16x16 maze has 3 or more open sides. Assert it in a scratch script or a temporary console check, then remove the check.
- [ ] `par` equals the true BFS shortest path length after braiding, verified on at least 3 different seeds.
- [ ] BFS from start reaches the goal on 100 consecutive random seeds. No orphaned cells.
- [ ] Walking into a wall flashes magenta for 2 frames, increments the hit count, and does **not** move the player.
- [ ] Re-entering an already visited cell increments `REVISITS` and flashes `-1200`.
- [ ] A cell visited once renders as a dither pattern, not a flat translucent fill. Verify by zooming a screenshot.
- [ ] `SOLVE IT` from mid-play reaches the goal, leaves ghost trails, and marks the run ineligible for the board.
- [ ] Finishing at or under `par + 10` without `SOLVE IT` opens initials entry. Over `par + 10` does not.
- [ ] Submitting initials writes to `localStorage` under `recurse.board.<YYYYMMDD>` and the entry appears on the board screen.
- [ ] Two loads on the same calendar day produce the **identical** maze. Two different days do not.
- [ ] 30 seconds without input from any mode returns to attract.
- [ ] With `prefers-reduced-motion: reduce` forced in devtools, the maze appears instantly and the solver completes without animating.
- [ ] Every button responds to a plain click with no hover state defined anywhere in the CSS.
- [ ] Frame timing holds: the logic step is `1000/12` ms and does not drift when the tab is backgrounded and restored.
- [ ] Zero grep hits in `src/` for `builder`, `guardian`, `analyst`, `architect`, `PATHS`, `SORTER`, `IT path`.

---

## PHASE 4 — DOCS

Rewrite `README.md`. The current one describes six games at `/play/[game]` routes that no longer exist and has been wrong since commit `8207ffe`. The new one covers: what RECURSE is, the stack, the file map, the maze and braid algorithm, the scoring formula with its coefficients, the daily seed, the leaderboard key, how to run locally, and how it deploys.

---

## REPORT BACK

1. Every file created, changed, and deleted, and why.
2. What Phase 0 found that changed your approach, especially anything in `node_modules/next/dist/docs/` that differs from what you expected.
3. Any decision you made that this prompt did not specify.
4. Anything in the approved design source that looked wrong or unimplementable. **Report it, do not silently fix it.**
5. Deferred items and known gaps.
6. Whether anything beyond `npm run build` is needed before deploying.
