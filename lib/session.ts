/**
 * Game Session — instructor-configured runs of cases for teaching.
 *
 * A session is fully described by its settings, which round-trip through the
 * URL query string so a session can be bookmarked or shared with a class:
 *
 *   /session/play/?dx=Pneumonia:2&dx=Empyema:1&order=random&repeats=0&tries=3
 *                  &hints=progressive&answer=typed&hide=1&inc=L80&exc=L10
 *
 * Everything here is pure (no React, no network) so it can be unit tested.
 */
import type { Condition, Puzzle } from './supabase';
import { getHintsFromPuzzle } from './supabase';
import { checkAnswer, MAX_GUESSES } from './gameLogic';

// ============================================
// Settings
// ============================================

export type SessionOrder = 'random' | 'grouped' | 'interleaved';
export type HintMode = 'progressive' | 'upfront' | 'off';
export type AnswerMode = 'choice' | 'typed';

export interface SessionDiagnosis {
  /** Diagnosis name as shown to students (and used for matching cases). */
  name: string;
  /** Number of cases of this diagnosis. 0 keeps it as an answer choice only. */
  count: number;
}

export interface SessionSettings {
  diagnoses: SessionDiagnosis[];
  order: SessionOrder;
  /** Allow the same case to appear more than once to reach the requested count. */
  repeats: boolean;
  /** Attempts per case (1–5). */
  tries: number;
  hints: HintMode;
  answer: AnswerMode;
  /** Fixed shuffle seed — everyone opening the link gets the same order. */
  seed: string | null;
  /** Also match library answers that contain the diagnosis (e.g. "Lobar pneumonia"). */
  related: boolean;
  /** Include library puzzles that have not yet appeared as a daily puzzle. */
  unreleased: boolean;
  /** Include the bundled supplemental cases. */
  supplemental: boolean;
  /** Case keys (e.g. "L80", "S1") always used, overriding the source filters. */
  include: string[];
  /** Case keys never used. */
  exclude: string[];
  /** Hide the diagnoses and counts on the student-facing start screen. */
  hideContents: boolean;
}

export const DEFAULT_DIAGNOSES = ['Pneumonia', 'Pleural effusion', 'Empyema', 'Lung abscess'];

export const MAX_CASES_PER_DIAGNOSIS = 20;

export const DEFAULT_SETTINGS: SessionSettings = {
  diagnoses: DEFAULT_DIAGNOSES.map((name) => ({ name, count: 1 })),
  order: 'random',
  repeats: false,
  tries: 3,
  hints: 'progressive',
  answer: 'typed',
  seed: null,
  related: false,
  unreleased: false,
  supplemental: true,
  include: [],
  exclude: [],
  hideContents: true,
};

const ORDERS: SessionOrder[] = ['random', 'grouped', 'interleaved'];
const HINT_MODES: HintMode[] = ['progressive', 'upfront', 'off'];
const ANSWER_MODES: AnswerMode[] = ['choice', 'typed'];

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Serializes settings to a query string (without the leading "?"). */
export function settingsToQuery(settings: SessionSettings): string {
  const params = new URLSearchParams();
  for (const d of settings.diagnoses) {
    params.append('dx', `${d.name}:${d.count}`);
  }
  params.set('order', settings.order);
  params.set('repeats', settings.repeats ? '1' : '0');
  params.set('tries', String(settings.tries));
  params.set('hints', settings.hints);
  params.set('answer', settings.answer);
  if (settings.seed) params.set('seed', settings.seed);
  if (settings.related) params.set('related', '1');
  if (settings.unreleased) params.set('unreleased', '1');
  if (!settings.supplemental) params.set('supplemental', '0');
  if (settings.include.length) params.set('inc', settings.include.join(','));
  if (settings.exclude.length) params.set('exc', settings.exclude.join(','));
  params.set('hide', settings.hideContents ? '1' : '0');
  return params.toString();
}

/**
 * Parses settings from a query string, falling back to defaults for anything
 * missing or invalid. With no `dx` params the default diagnoses are used.
 */
export function settingsFromQuery(query: string | URLSearchParams): SessionSettings {
  const params = typeof query === 'string' ? new URLSearchParams(query) : query;

  const diagnoses: SessionDiagnosis[] = [];
  const seen = new Set<string>();
  for (const raw of params.getAll('dx')) {
    const sep = raw.lastIndexOf(':');
    const name = (sep === -1 ? raw : raw.slice(0, sep)).trim();
    const parsedCount = sep === -1 ? 1 : parseInt(raw.slice(sep + 1), 10);
    if (!name || name.length > 120) continue;
    const key = normalizeName(name);
    if (seen.has(key)) continue;
    seen.add(key);
    diagnoses.push({
      name,
      count: isNaN(parsedCount) ? 1 : clampInt(parsedCount, 0, MAX_CASES_PER_DIAGNOSIS),
    });
  }

  const pick = <T extends string>(value: string | null, allowed: T[], fallback: T): T =>
    allowed.includes(value as T) ? (value as T) : fallback;

  const tries = parseInt(params.get('tries') ?? '', 10);
  const seed = params.get('seed');

  return {
    diagnoses: diagnoses.length > 0 ? diagnoses : DEFAULT_SETTINGS.diagnoses.map((d) => ({ ...d })),
    order: pick(params.get('order'), ORDERS, DEFAULT_SETTINGS.order),
    repeats: params.get('repeats') === '1',
    tries: isNaN(tries) ? DEFAULT_SETTINGS.tries : clampInt(tries, 1, MAX_GUESSES),
    hints: pick(params.get('hints'), HINT_MODES, DEFAULT_SETTINGS.hints),
    answer: pick(params.get('answer'), ANSWER_MODES, DEFAULT_SETTINGS.answer),
    seed: seed && /^[a-z0-9-]{1,32}$/i.test(seed) ? seed : null,
    related: params.get('related') === '1',
    unreleased: params.get('unreleased') === '1',
    supplemental: params.get('supplemental') !== '0',
    include: parseKeys(params.get('inc')),
    exclude: parseKeys(params.get('exc')),
    hideContents: params.get('hide') !== '0',
  };
}

/** Parses a comma-separated list of case keys ("L80,S1"). */
function parseKeys(value: string | null): string[] {
  if (!value) return [];
  const keys = value
    .split(',')
    .map((k) => k.trim().toUpperCase())
    .filter((k) => /^[LS]\d{1,6}$/.test(k));
  return Array.from(new Set(keys));
}

// ============================================
// Cases
// ============================================

export interface SessionCase {
  id: string;
  /** Short stable key used in URLs: "L<puzzle_number>" or "S<n>". */
  key: string;
  source: 'library' | 'supplemental';
  /** Short reference shown on the case, e.g. "Library #142" or "Supplemental S2". */
  label: string;
  imageUrl: string;
  annotatedImageUrl: string | null;
  answer: string;
  hints: string[];
  description: string | null;
  citation: string | null;
  learnLink: string | null;
  /** Library puzzles only: whether the puzzle has already run as a daily puzzle. */
  released: boolean;
}

/** Converts a library puzzle into a session case. */
export function puzzleToSessionCase(puzzle: Puzzle, today: number): SessionCase {
  const released =
    puzzle.status === 'retired' || (puzzle.last_shown_day >= 0 && puzzle.last_shown_day <= today);
  return {
    id: `library-${puzzle.id}`,
    key: `L${puzzle.puzzle_number}`,
    source: 'library',
    label: `Library #${puzzle.puzzle_number}`,
    imageUrl: puzzle.image_url,
    annotatedImageUrl: puzzle.annotated_image_url?.startsWith('http') ? puzzle.annotated_image_url : null,
    answer: puzzle.answer,
    hints: getHintsFromPuzzle(puzzle)
      .map((h) => h.hint_text)
      .filter((t): t is string => !!t),
    description: puzzle.condition_description ?? null,
    citation: puzzle.citation ?? null,
    learnLink: puzzle.learn_link?.startsWith('http') ? puzzle.learn_link : null,
    released,
  };
}

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Whether a case's answer belongs to a session diagnosis.
 * - Exact (normalized) match, or a match through the condition's aliases.
 * - With `related`, also answers that contain every word of the diagnosis
 *   (e.g. "Lobar pneumonia" under "Pneumonia").
 */
export function caseMatchesDiagnosis(
  answer: string,
  diagnosis: string,
  options: { related?: boolean; aliases?: string[] | null } = {}
): boolean {
  const a = normalizeName(answer);
  const d = normalizeName(diagnosis);
  if (!a || !d) return false;
  if (a === d) return true;
  if (options.aliases?.some((alias) => normalizeName(alias) === a)) return true;
  if (options.related) {
    const answerWords = new Set(a.split(' '));
    return d.split(' ').every((w) => answerWords.has(w));
  }
  return false;
}

/** Finds the condition entry for a diagnosis name (case-insensitive). */
export function findCondition(conditions: Condition[], name: string): Condition | undefined {
  const key = normalizeName(name);
  return conditions.find((c) => normalizeName(c.name) === key);
}

export interface PoolOptions {
  related: boolean;
  unreleased: boolean;
  supplemental: boolean;
  include?: string[];
  exclude?: string[];
  conditions?: Condition[];
}

/**
 * Every case that could belong to a diagnosis — related answers and unreleased
 * puzzles included — regardless of the source filters. This is the list the
 * instructor picks from on the setup page.
 */
export function candidatesForDiagnosis(
  allCases: SessionCase[],
  diagnosis: string,
  conditions?: Condition[]
): SessionCase[] {
  const aliases = conditions ? findCondition(conditions, diagnosis)?.aliases : null;
  return allCases.filter((c) => caseMatchesDiagnosis(c.answer, diagnosis, { related: true, aliases }));
}

/** Whether a candidate case passes the source filters (before per-case overrides). */
export function passesFilters(c: SessionCase, diagnosis: string, options: PoolOptions): boolean {
  if (c.source === 'supplemental' && !options.supplemental) return false;
  if (c.source === 'library' && !c.released && !options.unreleased) return false;
  const aliases = options.conditions ? findCondition(options.conditions, diagnosis)?.aliases : null;
  return caseMatchesDiagnosis(c.answer, diagnosis, { related: options.related, aliases });
}

/** Whether a candidate case is used, after applying include/exclude overrides. */
export function isCaseSelected(c: SessionCase, diagnosis: string, options: PoolOptions): boolean {
  if (options.exclude?.includes(c.key)) return false;
  if (options.include?.includes(c.key)) return true;
  return passesFilters(c, diagnosis, options);
}

/** Cases available for one diagnosis under the given options. */
export function casesForDiagnosis(
  allCases: SessionCase[],
  diagnosis: string,
  options: PoolOptions
): SessionCase[] {
  return candidatesForDiagnosis(allCases, diagnosis, options.conditions).filter((c) =>
    isCaseSelected(c, diagnosis, options)
  );
}

// ============================================
// Sequence building
// ============================================

/** Deterministic PRNG (mulberry32) seeded from a string. */
export function createRng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export interface SessionItem {
  /** The session diagnosis this case was drawn for (the correct choice). */
  diagnosis: string;
  case: SessionCase;
}

export interface BuiltSession {
  items: SessionItem[];
  /** Diagnoses where fewer cases were available than requested. */
  shortfalls: { diagnosis: string; requested: number; available: number }[];
}

/**
 * Draws the cases for a session.
 * - Without repeats each case is used at most once, so a diagnosis yields at
 *   most as many cases as exist for it.
 * - With repeats the diagnosis's cases are cycled (reshuffled each pass) until
 *   the requested count is reached.
 * Then orders them: grouped (diagnosis order), interleaved (round-robin), or
 * random.
 */
export function buildSession(
  settings: SessionSettings,
  allCases: SessionCase[],
  seed: string,
  conditions?: Condition[]
): BuiltSession {
  const rng = createRng(seed);
  const options: PoolOptions = {
    related: settings.related,
    unreleased: settings.unreleased,
    supplemental: settings.supplemental,
    include: settings.include,
    exclude: settings.exclude,
    conditions,
  };

  const usedIds = new Set<string>();
  const groups: SessionItem[][] = [];
  const shortfalls: BuiltSession['shortfalls'] = [];

  for (const dx of settings.diagnoses) {
    if (dx.count <= 0) continue;
    // A case can match two diagnoses (e.g. with `related`); without repeats,
    // never draw the same case twice across the whole session.
    const pool = casesForDiagnosis(allCases, dx.name, options).filter(
      (c) => settings.repeats || !usedIds.has(c.id)
    );
    const group: SessionItem[] = [];

    if (pool.length > 0) {
      if (settings.repeats) {
        let cycle: SessionCase[] = [];
        while (group.length < dx.count) {
          if (cycle.length === 0) cycle = shuffle(pool, rng);
          group.push({ diagnosis: dx.name, case: cycle.shift()! });
        }
      } else {
        for (const c of shuffle(pool, rng).slice(0, dx.count)) {
          group.push({ diagnosis: dx.name, case: c });
          usedIds.add(c.id);
        }
      }
    }

    if (group.length < dx.count) {
      shortfalls.push({ diagnosis: dx.name, requested: dx.count, available: group.length });
    }
    groups.push(group);
  }

  let items: SessionItem[];
  if (settings.order === 'grouped') {
    items = groups.flat();
  } else if (settings.order === 'interleaved') {
    items = [];
    const longest = Math.max(0, ...groups.map((g) => g.length));
    for (let i = 0; i < longest; i++) {
      for (const g of groups) if (g[i]) items.push(g[i]);
    }
  } else {
    items = shuffle(groups.flat(), rng);
  }

  return { items, shortfalls };
}

// ============================================
// Answer checking
// ============================================

export type SessionGuessResult = 'correct' | 'partial' | 'incorrect';

/**
 * Grades a guess for a session item. Picking the session diagnosis the case
 * was drawn for is always correct; typed answers also get the usual
 * exact/partial matching against the case's own answer.
 */
export function gradeGuess(guess: string, item: SessionItem): SessionGuessResult {
  if (normalizeName(guess) === normalizeName(item.diagnosis)) return 'correct';
  return checkAnswer(guess, item.case.answer);
}
