'use client';

import { useEffect, useState } from 'react';
import { getAllConditions, getSessionPuzzles, isSupabaseConfigured, type Condition } from '@/lib/supabase';
import { getDayNumber } from '@/lib/gameLogic';
import { puzzleToSessionCase, type SessionCase } from '@/lib/session';
import { SUPPLEMENTAL_CASES } from '@/lib/supplementalCases';

export interface SessionLibrary {
  status: 'loading' | 'ready';
  /** Library + supplemental cases (filtering by settings happens later). */
  cases: SessionCase[];
  conditions: Condition[];
  /** Set when the Supabase library could not be loaded (supplemental still works). */
  libraryError: string | null;
}

/** Loads the case library for Game Session in the browser. */
export function useSessionLibrary(): SessionLibrary {
  const [state, setState] = useState<SessionLibrary>(() => ({
    status: isSupabaseConfigured ? 'loading' : 'ready',
    cases: SUPPLEMENTAL_CASES,
    conditions: [],
    libraryError: isSupabaseConfigured ? null : 'Puzzle library not configured — using supplemental cases only.',
  }));

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    const today = getDayNumber();
    Promise.all([getSessionPuzzles(), getAllConditions()])
      .then(([puzzles, conditions]) => {
        if (cancelled) return;
        setState({
          status: 'ready',
          cases: [...puzzles.map((p) => puzzleToSessionCase(p, today)), ...SUPPLEMENTAL_CASES],
          conditions,
          libraryError: null,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : (err as { message?: string })?.message;
        setState({
          status: 'ready',
          cases: SUPPLEMENTAL_CASES,
          conditions: [],
          libraryError: `Could not load the puzzle library (${message ?? 'unknown error'}) — using supplemental cases only.`,
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
