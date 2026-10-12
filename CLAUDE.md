# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A teaching adaptation of Radiordle (the daily radiology puzzle game by Kishan Asokan and Tanmay Singh). This fork has **no daily game**: it reads cases from the Radiordle Supabase library (read-only) plus a few bundled supplemental cases, and runs them as instructor-configured **Game Sessions** for classes (e.g. BiCEP: pneumonia vs. pleural effusion vs. empyema vs. lung abscess).

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
- **Routes**: `/` and `/session` = session setup; `/session/play` = play a session; `/about`.
- **Read-only backend** (`lib/supabase.ts`): `db()` exposes only `.from(table).select('*')`. The app reads `puzzles` (non-draft) and `conditions`, and must never write to the shared database. Supabase is optional at build time (`isSupabaseConfigured`); without credentials only supplemental cases are used.
- **No browser storage**: nothing is written to localStorage, cookies or IndexedDB; session progress is in memory.
- Root-relative public assets used in `<Image>`/`<img>` must go through `withBasePath()` (`lib/paths.ts`).

### Game Session

- `lib/session.ts` (pure, unit-tested): settings ⇄ URL query (`settingsToQuery` / `settingsFromQuery`), case matching (`caseMatchesDiagnosis`, `casesForDiagnosis`), seeded shuffling (`createRng`), `buildSession` (counts, repeats, order), `gradeGuess`.
- `lib/supplementalCases.ts`: bundled cases (images in `public/cases/`, Wikimedia Commons, credited per case).
- `components/session/`: `SessionSetup` (mirrors settings into the URL), `SessionPlayer` (intro → cases → summary), `SessionCaseView` (image + report panel; keys 1–9 choose, Enter/→ next), `useSessionLibrary` (loads library + supplemental).
- Library puzzles that have not yet run as a daily (`last_shown_day` < 0 or in the future, not `retired`) are excluded unless `unreleased=1`, so sessions don't spoil upcoming dailies.

URL params: `dx=Name:count` (repeatable; count 0 = choice only), `order=random|grouped|interleaved`, `repeats=0|1`, `tries=1-5`, `hints=progressive|upfront|off`, `answer=choice|typed`, `seed`, `related=1`, `unreleased=1`, `supplemental=0`.

### Visual style

Flat "radiology report" look: neutral near-black palette, IBM Plex Sans/Mono, square corners, no shadows/blur (enforced globally in `app/globals.css`), report-style section labels (`.report-label`). Avoid gradients, glows, emoji and rounded "game" UI. Desktop case view fills the viewport and is sized for projection.

## Database (read-only; owned by the Radiordle authors)

```
conditions: id, name, category, aliases[]
puzzles:    id, puzzle_number, image_url, annotated_image_url, answer, status ('active'|'retired'|'draft'),
            last_shown_day (-1 = never shown), hint_1..hint_4, citation, learn_link, condition_description
```

`lib/gameLogic.ts` keeps `getDayNumber()` (EST, epoch Dec 29 2025) to decide which puzzles are already released, and `checkAnswer()` for typed answers.

## Testing

Vitest + Testing Library (jsdom via `// @vitest-environment jsdom`). Tests in `__tests__/unit` (gameLogic, session, supabase pure helpers) and `__tests__/component` (DiagnosisAutocomplete). Supabase is mocked with `vi.mock('@supabase/supabase-js')`; set env vars in `vi.hoisted()`.
