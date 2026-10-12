# Radiordle — teaching edition

A teaching adaptation of [Radiordle](https://www.radiordle.org) (by Kishan Asokan and Tanmay Singh). It reads cases from the Radiordle library **read-only** and runs them as instructor-configured Game Sessions. There is no daily game in this fork.

Live: **https://ethanuser.github.io/radiordle**

## Deployment

- `.github/workflows/pages.yml` builds a static export on every push to `main` and publishes it to GitHub Pages (Settings → Pages → Source: GitHub Actions). The site is served under `/radiordle` (`NEXT_PUBLIC_BASE_PATH`).
- Case data is read from Supabase in the browser. Credentials come from the repository secrets `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; after changing them, re-run the "Deploy to GitHub Pages" workflow. Without them, sessions use only the bundled supplemental cases.
- The app only ever reads `puzzles` and `conditions` (`lib/supabase.ts` exposes `select` only) and stores nothing in the browser.

## Development

```bash
pnpm install      # or: corepack pnpm install
pnpm dev          # http://localhost:3000
pnpm test
pnpm build
```

Optional `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` to load the library locally.

## Game Session (teaching mode)

`/session` lets an instructor configure a run of cases: diagnoses and case counts, repeats, order (random / grouped / interleaved), answer format (multiple choice or typed), attempts per case, and how findings (hints) are revealed. Every setting is encoded in the URL, so a session can be bookmarked or shared:

```
https://ethanuser.github.io/radiordle/session/play/?dx=Pneumonia:1&dx=Pleural%20effusion:1&dx=Empyema:1&dx=Lung%20abscess:1&order=random&repeats=0&tries=2&hints=progressive&answer=choice
```

| Param | Values | Meaning |
|---|---|---|
| `dx` | `Name:count` (repeatable) | Diagnosis and number of cases. Count `0` = answer choice only. |
| `order` | `random` · `grouped` · `interleaved` | Case order |
| `repeats` | `0` · `1` | Allow a case to be reused to reach the count |
| `tries` | `1`–`5` | Attempts per case |
| `hints` | `progressive` · `upfront` · `off` | When findings are shown |
| `answer` | `choice` · `typed` | Multiple choice or typed (autocomplete) |
| `seed` | short string | Same shuffled order for everyone with the link |
| `related` | `1` | Also match library answers containing the diagnosis (e.g. "Lobar pneumonia") |
| `unreleased` | `1` | Include library puzzles not yet shown as a daily puzzle |
| `supplemental` | `0` | Exclude the bundled supplemental cases |

Cases come from the Supabase `puzzles` table plus the supplemental cases in `lib/supplementalCases.ts` (images in `public/cases/`, openly licensed from Wikimedia Commons and credited on each case). Nothing is written back to the database.

