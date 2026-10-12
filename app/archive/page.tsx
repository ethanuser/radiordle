import type { Metadata } from 'next';
import PlainBackground from '@/components/PlainBackground';
import TopBar from '@/components/TopBar';
import ArchiveBrowser from '@/components/ArchiveBrowser';

export const metadata: Metadata = {
  title: 'Archive',
  description: 'Play any past Radiordle puzzle.',
};

export default function ArchivePage() {
  return (
    <div className="min-h-screen-safe relative overflow-y-auto overflow-x-hidden" style={{ minHeight: 'var(--full-vh)' }}>
      <PlainBackground />

      <div className="relative z-10 min-h-screen-safe flex flex-col" style={{ minHeight: 'var(--full-vh)' }}>
        <TopBar />

        <div className="w-full max-w-2xl mx-auto px-4 pt-6 sm:pt-8 pb-4">
          <div className="border-b border-rule-strong pb-3">
            <p className="report-label">Archive</p>
            <h1 className="text-2xl sm:text-[28px] font-semibold text-ink mt-1">Past puzzles</h1>
          </div>
        </div>

        <div className="flex-1 px-4 pb-20">
          <ArchiveBrowser />
        </div>
      </div>
    </div>
  );
}
