'use client';

/**
 * StatRow — Played / Win % / Streak / Max Streak, shared by the Results and
 * Stats modals. Rendered as a single bordered row of cells, like a summary
 * table in a report.
 */
interface StatRowStats {
  gamesPlayed: number;
  currentStreak: number;
  maxStreak: number;
}

interface StatRowProps {
  stats: StatRowStats;
  /** Whole-number win percentage (already computed by the caller). */
  winRate: number;
}

function StatCell({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-1 py-3 border-r border-rule last:border-r-0">
      <p className="font-mono font-semibold leading-none text-[22px] text-ink">{value}</p>
      <p className="mt-1.5 report-label !text-[10px]">{label}</p>
    </div>
  );
}

export default function StatRow({ stats, winRate }: StatRowProps) {
  return (
    <div className="grid grid-cols-4 text-center border border-rule">
      <StatCell value={stats.gamesPlayed} label="Played" />
      <StatCell value={winRate} label="Win %" />
      <StatCell value={stats.currentStreak} label="Streak" />
      <StatCell value={stats.maxStreak} label="Max Streak" />
    </div>
  );
}
