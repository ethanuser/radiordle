# RadWordle

A medical diagnosis guessing game where players identify radiological conditions from X-ray images. Built with Next.js and Supabase.

## About

RadWordle is an educational game that challenges medical professionals and students to identify diagnoses from radiological images. Each day features a new puzzle with progressive hints to help narrow down the answer.

## Live site & deployment

Deployed as a static site on GitHub Pages: **https://ethanuser.github.io/radiordle**

- `.github/workflows/pages.yml` builds a static export (`next build` with `output: "export"`) on every push to `main` and publishes `out/`.
- The site is served under `/radiordle`; the workflow sets `NEXT_PUBLIC_BASE_PATH=/radiordle`. Local dev leaves it empty.
- All data is fetched from Supabase **in the browser** (there is no server on Pages). The Pages build treats the backend as read-only for puzzle scheduling.
- Supabase credentials come from the repository secrets `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Settings → Secrets and variables → Actions). Without them the site still deploys: the daily puzzle shows a "backend not configured" notice and Game Session uses only the bundled supplemental cases.

One-time setup: Settings → Pages → Source: **GitHub Actions**.

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

Cases come from the Supabase `puzzles` table plus the supplemental cases in `lib/supplementalCases.ts` (images in `public/cases/`, openly licensed from Wikimedia Commons and credited on each case). Session plays are not submitted to the global stats.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

### Prerequisites

- **Node.js 18+**: Download and install from [nodejs.org](https://nodejs.org/)
- **pnpm** (recommended): Install globally with `npm install -g pnpm`
  - Alternatively, you can use npm (comes with Node.js)

To verify your installations:
```bash
node --version  # Should show v18 or higher
pnpm --version  # If using pnpm
```

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd radwordle
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory. Contact the repository owner (Tanmay) for the required credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=<ask-owner>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ask-owner>
```

4. Run the development server (if `pnpm` isn't installed, prefix commands with `corepack`, e.g. `corepack pnpm dev`):
```bash
pnpm dev
# or
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) (or the port shown in terminal) to see the application.

## Project Structure

```
radwordle/
├── app/                  # Next.js app directory
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home/test page
│   └── globals.css      # Global styles
├── lib/                 # Utility functions and configs
│   ├── supabase.ts      # Supabase client and database functions
│   ├── gameLogic.ts     # Game logic utilities
│   ├── localStorage.ts  # Local storage helpers
│   └── constants.ts     # App constants
├── components/          # React components
└── types/              # TypeScript type definitions
```

## Database Schema

The application uses three main tables in Supabase:

### `conditions`
- `id`: UUID (Primary Key)
- `name`: Text - Diagnosis name
- `category`: Text - Medical category
- `aliases`: Text[] - Alternative names

### `puzzles`
- `id`: UUID (Primary Key)
- `puzzle_number`: Integer - Sequential puzzle number
- `image_url`: Text - URL to X-ray image
- `answer`: Text - Correct diagnosis
- `difficulty`: Text - easy, medium, hard
- `is_active`: Boolean - Whether puzzle is active

### `hints`
- `id`: UUID (Primary Key)
- `puzzle_id`: UUID (Foreign Key to puzzles)
- `hint_order`: Integer - Order of hint reveal
- `content_type`: Text - text or image
- `hint_text`: Text - Hint content (nullable)
- `image_url`: Text - Hint image URL (nullable)
- `image_caption`: Text - Image caption (nullable)

## Game Logic

- **Daily Puzzles**: The game cycles through puzzles based on days since the game epoch (January 1, 2025)
- **Max Guesses**: Players get 6 attempts per puzzle
- **Progressive Hints**: Hints are revealed in order to help players

## Development

### Key Files

- [lib/supabase.ts](lib/supabase.ts) - Database queries and type definitions
- [lib/gameLogic.ts](lib/gameLogic.ts) - Core game mechanics
- [app/page.tsx](app/page.tsx) - Main test page showing database connection

### Testing the Database Connection

The homepage serves as a test page that displays:
- Connection status
- Database statistics
- Today's puzzle details
- All hints for the current puzzle
- Available conditions

If you see the green "Supabase Connected" message, everything is working correctly.

## Testing

### Unit & Integration Tests (Vitest)

```bash
pnpm test                 # Run all 154 tests
pnpm test:watch           # Run in watch mode (re-runs on file changes)
pnpm test:coverage        # Run with coverage report
```

### End-to-End Tests (Playwright)

E2E tests run against the real app in a Chromium browser. The dev server starts automatically.

```bash
pnpm e2e                  # Run all 55 E2E tests (headless)
pnpm e2e:headed           # Run with browser visible (watch tests execute)
pnpm e2e:ui               # Open Playwright's interactive test picker UI
```

**Run a single test by name:**
```bash
pnpm e2e --headed --grep "should complete first-time user journey"
```

**Run a specific test file:**
```bash
pnpm e2e e2e/tests/mobile-responsive.spec.ts
```

**Fun tests to watch in headed mode:**
| Command | What it does |
|---|---|
| `--grep "should complete first-time user journey"` | Accepts cookies, makes a wrong guess, then wins |
| `--grep "should show game over after 5 incorrect"` | Makes 5 wrong guesses with hints revealing each time |
| `--grep "should complete a full game on mobile"` | Plays a full game on a 390x844 iPhone viewport |
| `--grep "should simulate multi-day play"` | Wins today's game, then plays an archive game |
| `--grep "should show WON badge"` | Wins an archive game, goes back to verify WON badge |

**E2E test coverage (10 spec files):**
- First-time user journey (cookie consent, win flow, persistence, stats)
- Losing game flow (5 wrong guesses, hints, game over)
- Archive mode (browsing, separate stats, WON badge)
- Autocomplete & validation (dropdown, keyboard nav, error messages)
- Toast notifications (correct/incorrect/partial feedback)
- Mobile responsiveness (iPhone 12 viewport)
- Stats recovery (localStorage cleared, cookie/IndexedDB backup)
- Network failure handling (Supabase down, graceful degradation)
- Multi-day progression (per-day state, streaks, guess distribution)
- Guess time tracking (timing in localStorage)

## Building for Production

```bash
pnpm build
pnpm start
```

## Contributing

Contact the repository owner for contribution guidelines and access to environment variables.

## License

Private repository - All rights reserved.

## Stuff to do 
- some stats are still wrong
- feedback form
- currently able to submit free text answers, make them from bank only for simplicity 

