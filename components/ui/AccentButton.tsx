'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

/**
 * AccentButton — the primary call-to-action (e.g. Game Session, Archives).
 *
 * Flat, square, inverted (light fill / dark text) so it stands out against the
 * dark report surfaces without gradients or glow. Renders as a Next `<Link>`
 * when `href` is given, otherwise a `<button>`.
 */
interface AccentButtonProps {
  icon?: ReactNode;
  label?: string;
  /** Smaller, tighter sizing for compact/mobile placements. */
  compact?: boolean;
  /** When set, renders as a navigation link instead of a button. */
  href?: string;
  onClick?: () => void;
  /** Falls back to `label` for `title` / `aria-label`. */
  title?: string;
  className?: string;
}

export default function AccentButton({
  icon,
  label,
  compact = false,
  href,
  onClick,
  title,
  className = '',
}: AccentButtonProps) {
  const sizeCls = compact ? 'gap-1.5 px-3 h-8 text-[13px]' : 'gap-2 px-4 h-9 text-sm';
  const cls =
    'inline-flex items-center justify-center whitespace-nowrap font-display font-semibold uppercase tracking-[0.06em] ' +
    'bg-ink text-page-bg border border-ink hover:bg-white transition-colors ' +
    `${sizeCls} ${className}`.trim();
  const accessibleTitle = title ?? label;

  const inner = (
    <>
      {icon}
      {label && <span>{label}</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href} title={accessibleTitle} className={cls}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} title={accessibleTitle} className={cls}>
      {inner}
    </button>
  );
}
