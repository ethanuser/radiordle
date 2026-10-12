'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BarChart3, Info, MessageCircle, Archive, Menu, Download, ClipboardList, CalendarDays } from 'lucide-react';
import GlassIconButton from './ui/GlassIconButton';
import AccentButton from './ui/AccentButton';

/**
 * Top navigation bar — a flat header strip like a RIS/PACS worklist header.
 *
 * Renders desktop and mobile layouts side by side and lets CSS pick one
 * (matching the app's dual-layout convention so the `:visible` e2e selectors
 * keep working):
 *   - Desktop (>= sm): wordmark on the left; Daily / Archive / Stats / About /
 *     Feedback text links and the primary Game Session button on the right.
 *   - Mobile (< sm): wordmark, Game Session button, and a menu with the rest.
 *
 * `onStats` / `onFeedback` are optional; pages without those modals omit them
 * and the corresponding controls are hidden.
 */
interface TopBarProps {
  onStats?: () => void;
  onFeedback?: () => void;
}

const NAV_LINK =
  'flex items-center gap-1.5 h-9 px-3 text-[13px] font-display font-medium uppercase tracking-[0.06em] ' +
  'text-ink-muted hover:text-ink border border-transparent hover:border-rule transition-colors';

const MENU_ITEM =
  'flex items-center gap-3 w-full px-4 py-3 text-left text-sm font-display font-medium uppercase tracking-[0.06em] ' +
  'text-ink border-b border-rule last:border-b-0 transition-colors hover:bg-surface';

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" aria-label="Radiordle home" className="flex items-center gap-2.5">
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

export default function TopBar({ onStats, onFeedback }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* ---- Desktop bar ---- */}
      <div className="hidden sm:flex items-center gap-4 px-6 h-[60px] flex-shrink-0 z-[60] bg-page-bg border-b border-rule">
        <Wordmark />

        <nav className="flex-1 flex items-center justify-end gap-1">
          <Link href="/" className={NAV_LINK}>
            <CalendarDays size={15} />
            Daily
          </Link>
          <Link href="/archive" className={NAV_LINK}>
            <Archive size={15} />
            Archive
          </Link>
          {onStats && (
            <button type="button" onClick={onStats} aria-label="Stats" className={NAV_LINK}>
              <BarChart3 size={15} />
              Stats
            </button>
          )}
          <Link href="/about" className={NAV_LINK}>
            <Info size={15} />
            About
          </Link>
          {onFeedback && (
            <button type="button" onClick={onFeedback} aria-label="Feedback" className={NAV_LINK}>
              <MessageCircle size={15} />
              Feedback
            </button>
          )}
          <span className="w-px h-6 bg-rule mx-2" aria-hidden="true" />
          <AccentButton icon={<ClipboardList size={16} />} label="Game Session" href="/session" />
        </nav>
      </div>

      {/* ---- Mobile bar ---- */}
      <div className="relative flex sm:hidden flex-col flex-shrink-0 z-[60]">
        <div className="flex items-center justify-between gap-2 px-3 h-12 bg-page-bg border-b border-rule">
          <Wordmark compact />
          <div className="flex items-center gap-1.5">
            <AccentButton label="Game Session" compact href="/session" />
            <GlassIconButton label="Menu" size={34} onClick={() => setMenuOpen((m) => !m)}>
              <Menu size={20} />
            </GlassIconButton>
          </div>
        </div>

        {menuOpen && (
          <>
            {/* Click-away layer */}
            <div className="fixed inset-0 z-[55]" onClick={() => setMenuOpen(false)} aria-hidden="true" />
            <div className="absolute right-3 top-[52px] z-[61] min-w-[200px] bg-panel border border-rule-strong">
              <Link href="/" onClick={() => setMenuOpen(false)} className={MENU_ITEM}>
                <CalendarDays size={16} />
                Daily
              </Link>
              <Link href="/archive" onClick={() => setMenuOpen(false)} className={MENU_ITEM}>
                <Archive size={16} />
                Archive
              </Link>
              {onStats && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onStats();
                  }}
                  className={MENU_ITEM}
                >
                  <BarChart3 size={16} />
                  Stats
                </button>
              )}
              <Link href="/about" onClick={() => setMenuOpen(false)} className={MENU_ITEM}>
                <Info size={16} />
                About
              </Link>
              {onFeedback && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onFeedback();
                  }}
                  className={MENU_ITEM}
                >
                  <MessageCircle size={16} />
                  Feedback
                </button>
              )}
              <Link href="/install" onClick={() => setMenuOpen(false)} className={MENU_ITEM}>
                <Download size={16} />
                Install
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
