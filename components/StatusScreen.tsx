import Link from 'next/link';
import { ReactNode } from 'react';
import PlainBackground from './PlainBackground';
import TopBar from './TopBar';

/**
 * Full-page status panel (loading / error / backend not configured), styled
 * like a report addendum box.
 */
export default function StatusScreen({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="min-h-screen-safe relative" style={{ minHeight: 'var(--full-vh)' }}>
      <PlainBackground />
      <div className="relative z-10 flex flex-col" style={{ minHeight: 'var(--full-vh)' }}>
        <TopBar />
        <div className="flex-1 flex items-start justify-center px-4 pt-16">
          <div className="w-full max-w-xl border border-rule bg-panel p-6">
            <p className="report-label mb-2">{label}</p>
            <h1 className="text-xl font-semibold text-ink mb-3">{title}</h1>
            {children && <div className="text-ink-muted text-[15px] leading-relaxed space-y-3">{children}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BackendMissingNotice() {
  return (
    <StatusScreen label="Daily puzzle unavailable" title="The puzzle backend is not configured">
      <p>
        This build was made without Supabase credentials, so daily and archive puzzles cannot be
        loaded. Set <code className="font-mono text-ink">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
        <code className="font-mono text-ink">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (see README).
      </p>
      <p>
        <Link href="/session" className="text-ink underline underline-offset-4">
          Game Session
        </Link>{' '}
        still works with the bundled supplemental cases.
      </p>
    </StatusScreen>
  );
}
