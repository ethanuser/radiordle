'use client';

import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import AccentButton from './ui/AccentButton';

/**
 * Top navigation bar — a flat header strip like a RIS/PACS worklist header:
 * wordmark on the left, the Game Session button on the right.
 */
export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/session" aria-label="Radiordle Game Session" className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="relative flex-shrink-0 border border-ink"
        style={{ width: compact ? 18 : 22, height: compact ? 18 : 22 }}
      >
        <span className="absolute left-1/2 top-[3px] bottom-[3px] w-px -translate-x-1/2 bg-ink" />
        <span className="absolute top-1/2 left-[3px] right-[3px] h-px -translate-y-1/2 bg-ink" />
      </span>
      <span
        className={`font-mono font-semibold text-ink tracking-[0.18em] leading-none ${
          compact ? 'text-[15px]' : 'text-[17px]'
        }`}
      >
        RADIORDLE
      </span>
    </Link>
  );
}

export default function TopBar() {
  return (
    <div className="flex items-center justify-between gap-4 px-3 sm:px-6 h-12 sm:h-[60px] flex-shrink-0 z-[60] bg-page-bg border-b border-rule">
      <span className="sm:hidden">
        <Wordmark compact />
      </span>
      <span className="hidden sm:inline">
        <Wordmark />
      </span>
      <AccentButton icon={<ClipboardList size={16} />} label="Game Session" href="/session" />
    </div>
  );
}
