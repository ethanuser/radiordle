# Radiordle (fork with Game Sessions)

A fork of [Radiordle](https://www.radiordle.org) (by Kishan Asokan and Tanmay Singh). It shows the same daily puzzle and archive, and adds instructor-configured **Game Sessions** for teaching. It reads the Radiordle library **read-only**: results and stats stay in the player's browser.

Live: **https://ethanuser.github.io/radiordle**

## Deployment

- `.github/workflows/pages.yml` builds a static export on every push to `main` and publishes it to GitHub Pages (Settings → Pages → Source: GitHub Actions). The site is served under `/radiordle` (`NEXT_PUBLIC_BASE_PATH`).
- Case data is read from Supabase in the browser. Credentials come from the repository secrets `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; after changing them, re-run the "Deploy to GitHub Pages" workflow. Without them, the daily page shows a notice and sessions use only the bundled supplemental cases.
- The app only reads from the database (`lib/supabase.ts` exposes `select` only): no result submission, feedback or schedule writes.

## Development

```bash
pnpm install      # or: corepack pnpm install
pnpm dev          # http://localhost:3000
pnpm test
pnpm build
```

Optional `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` to load the library locally.

## Game Session (teaching mode)

`/session` lets an instructor configure a run of cases: diagnoses and case counts, which specific cases to include or exclude, repeats, order (random / grouped / interleaved), answer format (typed or multiple choice), attempts per case, how findings (hints) are revealed, and whether the start screen hides what's coming. Every setting is encoded in the URL, so a session can be bookmarked or shared:

```
https://ethanuser.github.io/radiordle/session/play/?dx=Pneumonia:1&dx=Pleural%20effusion:1&dx=Empyema:1&dx=Lung%20abscess:1&order=random&repeats=0&tries=3&hints=progressive&answer=typed&hide=1
```

The BiCEP pulmonary infiltrate patterns learning issue uses this session: seven multiple-choice cases, with lung cancer, emphysema and COPD as extra answer choices (count 0); the cases shown on the slides are excluded, and the fixed seed gives everyone the same order:

```
https://ethanuser.github.io/radiordle/session/play/?dx=Pneumonia%3A2&dx=Pulmonary+edema%3A1&dx=Atelectasis%3A1&dx=Lung+abscess%3A1&dx=Empyema%3A1&dx=Pleural+effusion%3A1&dx=Lung+cancer%3A0&dx=Emphysema%3A0&dx=COPD%3A0&order=random&repeats=0&tries=3&hints=progressive&answer=choice&seed=infiltrates&exc=S5%2CS6%2CS7%2CS10%2CS11&hide=1
```

| Param | Values | Meaning |
|---|---|---|
| `dx` | `Name:count` (repeatable) | Diagnosis and number of cases |
| `order` | `random` · `grouped` · `interleaved` | Case order |
| `repeats` | `0` · `1` | Allow a case to be reused to reach the count |
| `tries` | `1`–`5` | Attempts per case |
| `hints` | `progressive` · `upfront` · `off` | When findings are shown |
| `answer` | `typed` · `choice` | Typed search over all diagnoses (default) or multiple choice |
| `hide` | `1` · `0` | Hide diagnoses and counts on the start screen (default `1`) |
| `inc` / `exc` | `L80,S1` | Always include / exclude specific cases (`L` = library puzzle number, `S` = supplemental) |
| `seed` | short string | Same shuffled order for everyone with the link |
| `related` | `1` | Also match library answers containing the diagnosis (e.g. "Lobar pneumonia") |
| `unreleased` | `1` | Include library puzzles not yet shown as a daily puzzle |
| `supplemental` | `0` | Exclude the bundled supplemental cases |

Cases come from the Supabase `puzzles` table plus the supplemental cases in `lib/supplementalCases.ts` (images in `public/cases/`, openly licensed from Radiopaedia and Wikimedia Commons and credited on each case). Nothing is written back to the database.

