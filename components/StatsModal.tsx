'use client';

import { useState, useEffect } from 'react';
import { Statistics } from '@/lib/localStorage';
import { getGlobalStats, calculatePercentileBeat, GlobalStats } from '@/lib/supabase';
import ModalShell from './ui/ModalShell';
import StatRow from './ui/StatRow';
import GuessDistribution from './ui/GuessDistribution';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: Statistics;
}

export default function StatsModal({ isOpen, onClose, stats }: StatsModalProps) {
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [percentileBeat, setPercentileBeat] = useState<number | null>(null);

  // Fetch global stats when modal opens
  useEffect(() => {
    if (isOpen) {
      getGlobalStats().then((global) => {
        setGlobalStats(global);
        if (global && stats.guessDistribution) {
          const percentile = calculatePercentileBeat(
            stats.guessDistribution,
            global.guessDistribution
          );
          setPercentileBeat(percentile);
        }
      });
    }
  }, [isOpen, stats.guessDistribution]);

  if (!isOpen) return null;

  const winRate = stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0;

  // Calculate user's average guesses (only counting wins)
  const userAvgGuesses = (() => {
    let totalGuesses = 0;
    let totalWins = 0;
    for (const [guessNum, count] of Object.entries(stats.guessDistribution)) {
      totalGuesses += parseInt(guessNum) * count;
      totalWins += count;
    }
    return totalWins > 0 ? totalGuesses / totalWins : 0;
  })();

  // Calculate average guess time
  const avgGuessTime = stats.totalGuessCount && stats.totalGuessCount > 0
    ? (stats.totalGuessTime || 0) / stats.totalGuessCount
    : 0;

  return (
    <ModalShell onClose={onClose} maxWidthClass="max-w-[460px]" ariaLabel="Your statistics">
      <p className="report-label text-center">Daily puzzles</p>
      <h2 className="text-2xl sm:text-3xl font-semibold text-ink text-center mb-5">
        Your Statistics
      </h2>

      {/* Stat cards */}
      <div className="mb-4">
        <StatRow stats={stats} winRate={winRate} />
      </div>

      {/* Guess Distribution */}
      <div className="p-4 mb-5 border border-rule">
        <h3 className="report-label text-center mb-3">Guess Distribution</h3>
        {stats.gamesPlayed > 0 ? (
          <GuessDistribution distribution={stats.guessDistribution} />
        ) : (
          <p className="text-center text-white/50 text-sm py-2">
            Play a game to see your distribution!
          </p>
        )}
      </div>

      {/* How You Compare */}
      {stats.gamesWon > 0 && (
        <div className="p-4 mb-5 border border-rule">
          <h3 className="report-label text-center mb-3">How You Compare</h3>
          {percentileBeat !== null ? (
            <div className="text-center">
              <p className="text-3xl font-mono font-semibold text-ink">
                Top {100 - percentileBeat}%
              </p>
              <p className="text-sm text-white/70 mt-1">
                You beat <span className="font-semibold text-white/90">{percentileBeat}%</span> of
                players based on guess count
              </p>
            </div>
          ) : globalStats === null ? (
            <p className="text-center text-white/50 text-sm">Loading global stats...</p>
          ) : (
            <p className="text-center text-white/50 text-sm">Not enough data yet</p>
          )}
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
            <div>
              <p className="text-white/60">Win Rate</p>
              <p className="font-bold text-white">{winRate}%</p>
            </div>
            <div>
              <p className="text-white/60">Avg Guess #</p>
              <p className="font-bold text-white">{userAvgGuesses > 0 ? userAvgGuesses.toFixed(1) : '-'}</p>
            </div>
            <div>
              <p className="text-white/60">Avg Time</p>
              <p className="font-bold text-white">{avgGuessTime > 0 ? `${avgGuessTime.toFixed(1)}s` : '-'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Close Button */}
      <button
        onClick={onClose}
        className="w-full px-6 h-10 font-semibold uppercase tracking-[0.06em] text-sm text-ink border border-rule-strong transition-colors hover:bg-surface"
      >
        Close
      </button>
    </ModalShell>
  );
}
