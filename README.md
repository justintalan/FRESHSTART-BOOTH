# ITeC FreshStart — Booth Game

A walk-up booth web app for the ITeC FreshStart plaza booth. An attract/home
screen launches any of **six self-contained mini-games**, each understandable in
one glance and finished in under a minute. Scored games save to a **local daily
leaderboard**; the app auto-returns to the attract screen after 30s idle.

Client-only. No backend, no database, no auth, no analytics. Deploys to Vercel
with zero config.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (CSS-first `@theme` tokens in `src/app/globals.css`)
- Fonts: Space Grotesk (display) + JetBrains Mono (mono), via `next/font/google`
- State: local React state per game. Leaderboards in `localStorage`.

## The six games

| Game | Route | Scored | What it is |
| --- | --- | --- | --- |
| Path Sorter + Debug Sprint | `/play/path-sorter` | ✓ | 4 taps → IT path, then a 20s bug-tapping sprint |
| Terminal Reveal | `/play/terminal-reveal` | — | Fake terminal assigns you an IT role |
| Debug Sprint Arcade | `/play/debug-arcade` | ✓ | 30s reflex — tap bugs on a 6-col grid |
| This or That | `/play/this-or-that` | — | 6 preference swipes → a dev-vibe result |
| Build Your Setup | `/play/build-setup` | — | Pick desk gadgets → your IT path |
| Spot the Phish | `/play/spot-phish` | ✓ | 3 rounds — tap the scam before the timer |

## Architecture

- **Routing:** `/` is the attract menu; each game lives at `/play/[game]`. The
  `[game]` page is a server component that validates the id and calls
  `notFound()` for anything unknown; `src/app/not-found.tsx` redirects to `/`.
- **Shared design system:** `src/components/` holds the reusable primitives
  (`GameShell`, `Stage`, `Hud`, `Leaderboard`, `NameEntry`, `PathReveal`,
  `EndActions`, `Bits`). The 1280×800 booth canvas is scaled to fit any viewport
  by `Stage`.
- **Leaderboard:** `src/lib/leaderboard.ts` reads/writes `localStorage` under
  `itec:<gameId>:<YYYY-MM-DD>` — top 10, sorted desc. The date key makes the
  board reset each calendar day, per booth machine.
- **Idle reset:** `useIdleReset` (armed by every `GameShell`) returns to `/`
  after 30s of no input.
- **Design source of truth:** the original static mockups live in
  `design-reference/`. Colors, type, and layout match them; do not redesign.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build + type check
npm start        # serve the production build
```

Target device: landscape desktop / booth monitor (~1280×800). Big touch targets.
Phones are not a target.

## Deploy to Vercel

Push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new)
— no environment variables, no configuration. Vercel auto-detects Next.js.
