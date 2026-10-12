'use client';

import { useEffect, useState } from 'react';
import {
  getPuzzleForDay,
  getHintsFromPuzzle,
  getAllConditions,
  isSupabaseConfigured,
  type Puzzle,
  type Hint,
  type Condition,
} from '@/lib/supabase';
import GamePage from './GamePage';
import StatusScreen, { BackendMissingNotice } from './StatusScreen';

interface Loaded {
  puzzle: Puzzle;
  hints: Hint[];
  conditions: Condition[];
}

/**
 * Loads a day's puzzle in the browser and renders the game. The site is a
 * static export (GitHub Pages), so puzzle data is fetched client-side from
 * Supabase rather than in a server component.
 */
export default function DailyGame({ dayNumber, isArchive }: { dayNumber: number; isArchive: boolean }) {
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    Promise.all([getPuzzleForDay(dayNumber), getAllConditions()])
      .then(([puzzle, conditions]) => {
        if (cancelled) return;
        setData({ puzzle, hints: getHintsFromPuzzle(puzzle), conditions });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : (err as { message?: string })?.message ?? 'Unknown error';
        setError(message);
      });
    return () => {
      cancelled = true;
    };
  }, [dayNumber]);

  if (!isSupabaseConfigured) return <BackendMissingNotice />;

  if (error) {
    return (
      <StatusScreen label="Error" title="Could not load the puzzle">
        <p className="font-mono text-sm">{error}</p>
      </StatusScreen>
    );
  }

  if (!data) {
    return <StatusScreen label={`Day ${dayNumber + 1}`} title="Loading puzzle…" />;
  }

  return (
    <GamePage
      // Remount when the day changes so per-day game state reloads cleanly
      key={dayNumber}
      puzzle={data.puzzle}
      hints={data.hints}
      conditions={data.conditions}
      dayNumber={dayNumber}
      isArchive={isArchive}
    />
  );
}
