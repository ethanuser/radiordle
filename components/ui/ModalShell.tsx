'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * ModalShell — the shared modal frame used by the Results, Stats, and Feedback
 * modals. A flat, square panel with a hairline border over a dimmed backdrop;
 * the panel scrolls its own overflow. Clicking the backdrop (or Escape) closes.
 * Body scroll is locked while mounted (the shell only mounts when open).
 */
interface ModalShellProps {
  onClose: () => void;
  children: ReactNode;
  /** Tailwind max-width class controlling panel width (default `max-w-[460px]`). */
  maxWidthClass?: string;
  /** Show the close (X) button in the top-right corner. */
  showClose?: boolean;
  /** Accessible label for the dialog when there's no visible labelled heading. */
  ariaLabel?: string;
  /** Optional test id applied to the backdrop element. */
  testId?: string;
}

export default function ModalShell({
  onClose,
  children,
  maxWidthClass = 'max-w-[460px]',
  showClose = false,
  ariaLabel,
  testId,
}: ModalShellProps) {
  // Lock background scroll while the modal is mounted.
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      data-testid={testId}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 animate-backdrop-fade"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={`relative w-full ${maxWidthClass} p-5 sm:p-7 overflow-y-auto max-h-[92vh] font-display text-ink bg-panel border border-rule-strong animate-modal-enter`}
        onClick={(e) => e.stopPropagation()}
      >
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 z-10 flex items-center justify-center w-8 h-8 text-ink-muted hover:text-ink border border-rule hover:border-rule-strong transition-colors"
          >
            <X size={16} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
