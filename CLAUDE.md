# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A fork of Radiordle (the daily radiology puzzle game by Kishan Asokan and Tanmay Singh). It shows the same daily puzzle and archive as radiordle.org and adds instructor-configured **Game Sessions** for classes (e.g. BiCEP: pneumonia vs. pleural effusion vs. empyema vs. lung abscess). It reads the Radiordle Supabase library **read-only** — it never submits results, feedback or schedule entries.

Live: https://ethanuser.github.io/radiordle

## Development Commands

```bash
pnpm install              # (or: corepack pnpm install)
pnpm dev                  # http://localhost:3000
pnpm build                # Static export to out/
pnpm lint
pnpm test                 # Vitest
```

## Architecture

- **Static export** (`next.config.ts`: `output: 'export'`, `trailingSlash`, `basePath` from `NEXT_PUBLIC_BASE_PATH`). Deployed to GitHub Pages by `.github/workflows/pages.yml` with `NEXT_PUBLIC_BASE_PATH=/radiordle`. No server code, no API routes.
- **Routes**: `/` = today's daily puzzle (`components/DailyGame.tsx` → `GamePage`/`GameClient`); `/archive`, `/archive/play/?day=N`; `/session` = session setup; `/session/play` = play a session; `/about`; `/install`.
- **Read-only backend** (`lib/supabase.ts`): `db()` exposes only `.from(table).select(...)`. The app reads `puzzles`, `conditions`, `puzzle_schedule` and the `game_stats_*` views, and must never write to the shared database (no result submission, feedback or schedule writes). `getPuzzleForDay` returns the scheduled puzzle, or the one the selection algorithm would pick, without writing. Supabase is optional at build time (`isSupabaseConfigured`).
- **Daily game state** lives in localStorage (`lib/localStorage.ts`, keys `radiordle_*`) behind the consent banner (`CookieConsent`). Game Session progress is in memory only.
- Root-relative public assets used in `<Image>`/`<img>` must go through `withBasePath()` (`lib/paths.ts`).
- Answer sounds (`lib/sounds.ts`): synthesized with Web Audio (correct = two-tone chime, partial = single tone, incorrect = low buzz), played from `GameClient` and `SessionPlayer` on each graded guess; on by default, toggled by `SoundToggle` in the top bar (`radiordle_sound` in localStorage).
- Halloween (`lib/halloween.ts`, `components/ui/Halloween.tsx`): from Oct 15 to Nov 1 (visitor's local date) the wordmark crosshair becomes a skull, a small skeleton sways from the desktop top bar (art in `public/halloween/`), answer sounds switch to Halloween versions, and a music toggle plays Danse Macabre (Kevin MacLeod, CC BY 3.0, credited on About; `lib/music.ts`, never autoplays). Decided client-side only, never at build time.

### Game Session

- `lib/session.ts` (pure, unit-tested): settings ⇄ URL query (`settingsToQuery` / `settingsFromQuery`), case matching (`candidatesForDiagnosis`, `passesFilters`, `isCaseSelected`, `casesForDiagnosis`), seeded shuffling (`createRng`), `buildSession` (counts, repeats, order), `gradeGuess`.
- Cases have short keys (`L<puzzle_number>`, `S<n>`). The setup page's case picker (`CasePicker.tsx`) records per-case overrides in `inc` / `exc`.
- `lib/supplementalCases.ts`: bundled cases (images in `public/cases/`, credited per case with author, source and license).
- **New supplemental cases: prefer Radiopaedia** (cases are CC BY-NC-SA 3.0; cite as "Case courtesy of <author>, Radiopaedia.org, rID: <id>"). Choose clear, classic, unannotated images suitable for students. radiopaedia.org pages are behind a Cloudflare bot check, so open them in a browser; the image CDN (`prod-images-static.radiopaedia.org/images/<id>/<name>_jumbo.jpeg`) downloads with curl. Use the case's own history for the first hint and set `vignetteFromSource: true`.
- `components/session/`: `SessionSetup` (mirrors settings into the URL), `SessionPlayer` (intro → cases → summary), `SessionCaseView` (image + report panel; keys 1–9 and 0 choose, Enter/→ next), `useSessionLibrary` (loads library + supplemental).
- Library puzzles that have not yet run as a daily (`last_shown_day` < 0 or in the future, not `retired`) are excluded unless `unreleased=1`, so sessions don't spoil upcoming dailies.

URL params: `dx=Name:count` (repeatable), `order=random|grouped|interleaved`, `repeats=0|1`, `tries=1-5`, `hints=progressive|upfront|off`, `answer=typed|choice` (default typed), `hide=1|0` (hide diagnoses/counts on the start screen; default 1), `inc=L80,S1` / `exc=L10` (per-case overrides), `seed`, `related=1`, `unreleased=1`, `supplemental=0`.

### Visual style

Flat "radiology report" look: neutral near-black palette, IBM Plex Sans/Mono, square corners, no shadows/blur (enforced globally in `app/globals.css`), report-style section labels (`.report-label`). Avoid gradients, glows, emoji and rounded "game" UI. Desktop case view fills the viewport and is sized for projection.

## Database (read-only; owned by the Radiordle authors)

```
conditions:      id, name, category, aliases[]
puzzles:         id, puzzle_number, image_url, annotated_image_url, answer, status ('active'|'retired'|'draft'),
                 last_shown_day (-1 = never shown), hint_1..hint_4, citation, learn_link, condition_description
puzzle_schedule: day_number, puzzle_id, is_manual
game_stats_overall / game_stats_guess_distribution / game_stats_by_puzzle /
game_stats_guess_distribution_by_puzzle: community stats views
```

`lib/gameLogic.ts`: `getDayNumber()` (America/New_York, epoch Dec 29 2025 = day 0; shown as day + 1), `checkAnswer()` (correct / partial / incorrect), `MAX_GUESSES = 5`.

## Testing

Vitest + Testing Library (jsdom via `// @vitest-environment jsdom`). Tests in `__tests__/unit` (gameLogic, session, supabase pure helpers), `__tests__/integration` (localStorage) and `__tests__/component` (GameClient, ArchiveBrowser, CookieConsent, DiagnosisAutocomplete). GameClient renders desktop + mobile layouts, so use `getAllBy*` and index `[0]`. Supabase is mocked with `vi.mock('@supabase/supabase-js')`; set env vars in `vi.hoisted()`.
