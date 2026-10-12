import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True when the Supabase credentials were provided at build time. Without
 * them, Game Session uses only the bundled supplemental cases.
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
 * case library, so the wrapper exposes `select('*')` and nothing else — there
 * is no code path that can insert, update or delete rows.
 */
export function db() {
  if (!client) throw new BackendNotConfiguredError();
  return {
    from: (table: string) => ({
      select: () => client.from(table).select('*'),
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

/** All diagnoses in the library, alphabetically (answer list for typed mode). */
export async function getAllConditions(): Promise<Condition[]> {
  const { data, error } = await db().from('conditions').select().order('name', { ascending: true });

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
    .select()
    .neq('status', 'draft')
    .order('puzzle_number', { ascending: true });

  if (error) {
    console.error('Error getting session puzzles:', error);
    throw error;
  }

  return data || [];
}
