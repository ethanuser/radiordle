'use client';

import { MAX_GUESSES } from '@/lib/gameLogic';

/**
 * GuessDistribution — the horizontal guess-distribution bars shared by the
 * Results and Stats modals (design foundation: radiordle-modals.jsx
 * `Distribution`).
 *
 * Flat track with a filled bar per guess count. The bar for the current
 * winning guess is highlighted in success green; the rest are neutral grey. Bars fill via the existing `animate-bar-fill` keyframe with a small
 * per-row stagger — a one-shot paint, no continuous animation.
 */
interface GuessDistributionProps {
  distribution: Record<number, number>;
  /** Guess count to highlight in success green (e.g. the winning guess). */
  highlight?: number | null;
}

export default function GuessDistribution({ distribution, highlight }: GuessDistributionProps) {
  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className="space-y-1.5">
      {Array.from({ length: MAX_GUESSES }, (_, i) => i + 1).map((guessNum) => {
        const count = distribution[guessNum] || 0;
        const pct = (count / maxCount) * 100;
        const isHighlight = highlight === guessNum;

        return (
          <div key={guessNum} className="flex items-center gap-2">
            <span className="w-4 text-sm font-mono text-ink-muted">{guessNum}</span>
            <div className="flex-1 h-6 overflow-hidden bg-surface border border-rule">
              <div
                className={`h-full flex items-center justify-end px-2 animate-bar-fill ${
                  count > 0 ? (isHighlight ? 'bg-success' : 'bg-[#55555a]') : 'bg-transparent'
                }`}
                style={{
                  width: `${Math.max(pct, count > 0 ? 10 : 0)}%`,
                  animationDelay: `${(guessNum - 1) * 0.08}s`,
                }}
              >
                {count > 0 && <span className="text-white text-sm font-mono font-semibold">{count}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
