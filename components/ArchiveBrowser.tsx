'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { getDayNumber, dayNumberToDate } from '@/lib/gameLogic';
import { getDayStatus } from '@/lib/localStorage';

interface ArchiveDay {
  dayNumber: number;
  date: string;
  status: 'won' | 'lost' | 'not_played';
}

export default function ArchiveBrowser() {
  const today = getDayNumber();

  const days = useMemo(() => {
    const archiveDays: ArchiveDay[] = [];

    for (let i = today; i >= 0; i--) {
      const date = dayNumberToDate(i);
      archiveDays.push({
        dayNumber: i,
        date: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        status: getDayStatus(i),
      });
    }

    return archiveDays;
  }, [today]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
        {days.map((day) => {
          const isToday = day.dayNumber === today;
          const isWon = day.status === 'won';
          const isLost = day.status === 'lost';

          return (
            <Link
              key={day.dayNumber}
              href={isToday ? '/' : `/archive/play?day=${day.dayNumber}`}
              prefetch={false}
              className={`relative flex flex-col items-center justify-center p-2.5 sm:p-3 border border-rule border-l-4 transition-colors bg-panel hover:bg-surface ${
                isWon ? 'border-l-success' : isLost ? 'border-l-error' : 'border-l-rule'
              }`}
            >
              {isToday && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-ink text-black text-[9px] font-mono font-semibold leading-none">
                  TODAY
                </span>
              )}
              <span className="text-ink font-mono text-sm leading-tight inline-flex items-center gap-1">
                Day {day.dayNumber + 1}
                {isWon && (
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isLost && (
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </span>
              <span className="text-ink-faint text-[10px] sm:text-xs leading-tight mt-0.5 uppercase">
                {day.date}
              </span>
            </Link>
          );
        })}
      </div>

      {days.length === 0 && (
        <div className="text-center text-ink-muted py-8">
          No archive days available yet.
        </div>
      )}
    </div>
  );
}
