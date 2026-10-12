import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True when the Supabase credentials were provided at build time. Without
 * them, the daily game shows a notice and Game Session uses only the bundled
 * supplemental cases.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const client: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

export class BackendNotConfiguredError extends Error {
  constructor() {
    super(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (see README.md).'
    );
    this.name = 'BackendNotConfiguredError';
  }
}

/**
 * Read-only access to the shared Radiordle database. This site only reads the
 * puzzle library and community stats, so the wrapper exposes `select` and
 * nothing else — there is no code path that can insert, update or delete rows.
 */
export function db() {
  if (!client) throw new BackendNotConfiguredError();
  return {
    from: (table: string) => ({
      // Column list is passed through as-is; typed as '*' so rows stay untyped
      select: (columns = '*', options?: { count?: 'exact'; head?: boolean }) =>
        client.from(table).select(columns as '*', options),
    }),
  };
}

export interface Puzzle {
  id: string;
  puzzle_number: number;
  image_url: string;
  answer: string;
  difficulty: string;
  is_active: boolean;
  status: 'active' | 'retired' | 'draft';
  last_shown_day: number;
  hint_1: string | null;
  hint_2: string | null;
  hint_3: string | null;
  hint_4: string | null;
  citation?: string | null;
  learn_link?: string | null;
  annotated_image_url?: string | null;
  /** Plain-language blurb shown after a case is answered. */
  condition_description?: string | null;
  created_at?: string;
}

export interface Hint {
  id: string;
  puzzle_id: string;
  hint_order: number;
  content_type: string;
  hint_text: string | null;
  image_url: string | null;
  image_caption: string | null;
  created_at?: string;
}

export interface Condition {
  id: string;
  name: string;
  category: string;
  aliases: string[] | null;
  created_at?: string;
}

export function getHintsFromPuzzle(puzzle: Puzzle): Hint[] {
  const texts = [puzzle.hint_1, puzzle.hint_2, puzzle.hint_3, puzzle.hint_4];
  const hints: Hint[] = [];
  texts.forEach((text, i) => {
    if (!text) return;
    hints.push({
      id: `${puzzle.id}-hint-${i + 1}`,
      puzzle_id: puzzle.id,
      hint_order: i + 1,
      content_type: 'text',
      hint_text: text,
      image_url: null,
      image_caption: null,
    });
  });
  return hints;
}

// ============================================
// Daily puzzle (read-only)
// ============================================

/**
 * Fetches the scheduled puzzle for a specific day number.
 * Returns null if no schedule entry exists for that day.
 */
export async function getScheduledPuzzle(dayNumber: number): Promise<Puzzle | null> {
  const { data, error } = await db()
    .from('puzzle_schedule')
    .select('puzzle_id')
    .eq('day_number', dayNumber)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - schedule doesn't exist for this day
      return null;
    }
    console.error('Error getting scheduled puzzle:', error);
    throw error;
  }

  if (!data?.puzzle_id) {
    return null;
  }

  // Fetch the actual puzzle
  const { data: puzzle, error: puzzleError } = await db()
    .from('puzzles')
    .select('*')
    .eq('id', data.puzzle_id)
    .single();

  if (puzzleError) {
    console.error('Error getting puzzle by id:', puzzleError);
    throw puzzleError;
  }

  return puzzle;
}

/**
 * Picks the next puzzle to schedule using the selection algorithm:
 * 1. Never-shown puzzles first (last_shown_day = -1), sorted by puzzle_number
 * 2. Then previously-shown puzzles, sorted by last_shown_day ASC (least recent first)
 * 3. Only considers puzzles with status = 'active'
 */
export async function getNextPuzzleToSchedule(): Promise<Puzzle> {
  // First, try to get a never-shown puzzle
  const { data: neverShown, error: neverShownError } = await db()
    .from('puzzles')
    .select('*')
    .eq('status', 'active')
    .eq('last_shown_day', -1)
    .order('puzzle_number', { ascending: true })
    .limit(1)
    .single();

  if (neverShown && !neverShownError) {
    return neverShown;
  }

  // If no never-shown puzzles, get the least recently shown
  const { data: leastRecent, error: leastRecentError } = await db()
    .from('puzzles')
    .select('*')
    .eq('status', 'active')
    .order('last_shown_day', { ascending: true })
    .limit(1)
    .single();

  if (leastRecentError) {
    console.error('Error getting next puzzle to schedule:', leastRecentError);
    throw leastRecentError;
  }

  return leastRecent;
}

/**
 * Gets the puzzle for a specific day: the scheduled one if radiordle.org has
 * already scheduled it, otherwise the one its selection algorithm would pick.
 * Read-only — this site never writes the schedule.
 */
export async function getPuzzleForDay(dayNumber: number): Promise<Puzzle> {
  const scheduled = await getScheduledPuzzle(dayNumber);
  if (scheduled) {
    return scheduled;
  }
  return getNextPuzzleToSchedule();
}

// ============================================
// Community stats (read-only views)
// ============================================

export interface GlobalStats {
  totalGames: number;
  totalWins: number;
  winRate: number;
  avgGuesses: number;
  guessDistribution: { [key: number]: number };
}

/**
 * Fetches global statistics from all players.
 * Used to compare individual performance against the community.
 */
export async function getGlobalStats(): Promise<GlobalStats | null> {
  if (!isSupabaseConfigured) return null;
  try {
    // Get overall stats
    const { data: overall, error: overallError } = await db()
      .from('game_stats_overall')
      .select('*')
      .single();

    if (overallError) {
      console.error('Error fetching global stats:', overallError);
      return null;
    }

    // Get guess distribution
    const { data: distribution, error: distError } = await db()
      .from('game_stats_guess_distribution')
      .select('*');

    if (distError) {
      console.error('Error fetching guess distribution:', distError);
      return null;
    }

    // Convert distribution array to object
    const guessDistribution: { [key: number]: number } = {};
    distribution?.forEach((row: { guess_count: number; wins: number }) => {
      guessDistribution[row.guess_count] = row.wins;
    });

    return {
      totalGames: overall?.total_games || 0,
      totalWins: overall?.total_wins || 0,
      winRate: Number(overall?.win_rate) || 0,
      avgGuesses: Number(overall?.avg_guesses) || 0,
      guessDistribution,
    };
  } catch (error) {
    console.error('Error fetching global stats:', error);
    return null;
  }
}

/**
 * Calculates what percentage of players you beat based on your average guess count.
 * If you win in fewer guesses, you beat more players.
 */
export function calculatePercentileBeat(
  userGuessDistribution: { [key: number]: number },
  globalGuessDistribution: { [key: number]: number }
): number | null {
  // Calculate user's total wins and weighted average
  let userTotalWins = 0;
  let userWeightedSum = 0;
  for (const [guess, count] of Object.entries(userGuessDistribution)) {
    userTotalWins += count;
    userWeightedSum += Number(guess) * count;
  }

  if (userTotalWins === 0) return null;

  const userAvgGuesses = userWeightedSum / userTotalWins;

  // Calculate global total wins
  let globalTotalWins = 0;
  for (const count of Object.values(globalGuessDistribution)) {
    globalTotalWins += count;
  }

  if (globalTotalWins === 0) return null;

  // Count how many global wins took MORE guesses than user's average
  let worseThanUser = 0;
  for (const [guess, count] of Object.entries(globalGuessDistribution)) {
    if (Number(guess) > userAvgGuesses) {
      worseThanUser += count;
    }
  }

  // Percentage of players the user beat
  return Math.round((worseThanUser / globalTotalWins) * 100);
}

/**
 * Fetches the guess distribution for a specific puzzle from the database,
 * along with the total number of attempts (including losses).
 */
export async function getPuzzleGuessDistribution(
  puzzleNumber: number
): Promise<{ distribution: { [key: number]: number }; totalAttempts: number } | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const [distResult, statsResult] = await Promise.all([
      db()
        .from('game_stats_guess_distribution_by_puzzle')
        .select('guess_count, wins')
        .eq('puzzle_number', puzzleNumber),
      db()
        .from('game_stats_by_puzzle')
        .select('times_played')
        .eq('puzzle_number', puzzleNumber)
        .single(),
    ]);

    if (distResult.error) {
      console.error('Error fetching puzzle guess distribution:', distResult.error);
      return null;
    }

    const distribution: { [key: number]: number } = {};
    distResult.data?.forEach((row: { guess_count: number; wins: number }) => {
      distribution[row.guess_count] = row.wins;
    });

    const totalAttempts = Number(statsResult.data?.times_played) || 0;

    return { distribution, totalAttempts };
  } catch (error) {
    console.error('Error fetching puzzle guess distribution:', error);
    return null;
  }
}

/**
 * Calculates what percentage of players you beat on a specific puzzle,
 * based on your actual guess count vs the puzzle's global distribution.
 * Includes players who lost (failed to solve) as "worse than user".
 */
export function calculatePuzzlePercentile(
  userGuessCount: number,
  puzzleGuessDistribution: { [key: number]: number },
  totalAttempts?: number
): number | null {
  let totalWins = 0;
  for (const count of Object.values(puzzleGuessDistribution)) {
    totalWins += count;
  }

  if (totalWins === 0) return null;

  const totalPlayers = totalAttempts && totalAttempts > totalWins ? totalAttempts : totalWins;
  const losers = totalPlayers - totalWins;

  // Count winners who took MORE guesses + all players who lost
  let worseThanUser = losers;
  for (const [guess, count] of Object.entries(puzzleGuessDistribution)) {
    if (Number(guess) > userGuessCount) {
      worseThanUser += count;
    }
  }

  return Math.round((worseThanUser / totalPlayers) * 100);
}

// ============================================
// Case library
// ============================================

/** All diagnoses in the library, alphabetically (answer list for typed mode). */
export async function getAllConditions(): Promise<Condition[]> {
  const { data, error } = await db().from('conditions').select('*').order('name', { ascending: true });

  if (error) {
    console.error('Error getting conditions:', error);
    throw error;
  }

  return data || [];
}

/**
 * Every non-draft puzzle in the library. Game Session filters these
 * client-side by diagnosis and release status.
 */
export async function getSessionPuzzles(): Promise<Puzzle[]> {
  const { data, error } = await db()
    .from('puzzles')
    .select('*')
    .neq('status', 'draft')
    .order('puzzle_number', { ascending: true });

  if (error) {
    console.error('Error getting session puzzles:', error);
    throw error;
  }

  return data || [];
}
