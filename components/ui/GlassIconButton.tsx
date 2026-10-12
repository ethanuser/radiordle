'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

/**
 * GlassIconButton — a square, icon-only control used in the navbar and
 * modals. Transparent by default; a hairline border and faint fill on hover.
 * Renders as a Next `<Link>` when `href` is given, otherwise a `<button>`.
 */
interface GlassIconButtonProps {
  children: ReactNode;
  /** Used for both `title` and `aria-label` (icon-only, so a label is required). */
  label: string;
  /** Square size in px. */
  size?: number;
  /** When set, renders as a navigation link instead of a button. */
  href?: string;
  onClick?: () => void;
  className?: string;
}

const BASE =
  'flex items-center justify-center border border-transparent transition-colors ' +
  'text-ink-muted hover:text-ink hover:border-rule hover:bg-surface';

export default function GlassIconButton({
  children,
  label,
  size = 36,
  href,
  onClick,
  className = '',
}: GlassIconButtonProps) {
  const cls = `${BASE} ${className}`.trim();
  const style = { width: size, height: size };

  if (href) {
    return (
      <Link href={href} title={label} aria-label={label} className={cls} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} title={label} aria-label={label} className={cls} style={style}>
      {children}
    </button>
  );
}
