'use client';

import { ReactNode } from 'react';

/** Numbered report-style section with a ruled header. */
export function Section({ index, title, children }: { index: number; title: string; children: ReactNode }) {
  return (
    <section className="border border-rule bg-panel">
      <header className="flex items-baseline gap-3 px-4 py-2.5 border-b border-rule">
        <span className="font-mono text-xs text-ink-faint">{String(index).padStart(2, '0')}</span>
        <h2 className="report-label !text-ink">{title}</h2>
      </header>
      <div className="p-4 space-y-4">{children}</div>
    </section>
  );
}

/** Label + control row. */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[200px_1fr] lg:grid-cols-[260px_1fr] sm:items-start sm:gap-4">
      <div className="sm:pt-2">
        <p className="text-sm lg:text-base font-medium text-ink">{label}</p>
        {hint && <p className="text-xs lg:text-sm text-ink-faint mt-0.5">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

/** Row of mutually exclusive square buttons. */
export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex flex-wrap border border-rule-strong">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={`px-3.5 lg:px-4 h-9 lg:h-11 text-sm lg:text-base font-medium border-r border-rule-strong last:border-r-0 transition-colors ${
              selected ? 'bg-ink text-page-bg' : 'text-ink-muted hover:text-ink hover:bg-surface'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Square checkbox with label and optional description. */
export function Check({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 accent-[#ececec] flex-shrink-0"
      />
      <span>
        <span className="block text-sm lg:text-base text-ink">{label}</span>
        {description && <span className="block text-xs lg:text-sm text-ink-faint mt-0.5">{description}</span>}
      </span>
    </label>
  );
}

/** − n + stepper. */
export function Stepper({
  value,
  min,
  max,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
}) {
  const btn =
    'w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface disabled:opacity-30 disabled:hover:bg-transparent transition-colors';
  return (
    <div className="inline-flex items-center border border-rule-strong" aria-label={label}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Fewer ${label}`}>
        −
      </button>
      <span className="w-9 h-8 lg:w-11 lg:h-10 flex items-center justify-center font-mono text-sm lg:text-base text-ink border-x border-rule-strong">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`More ${label}`}>
        +
      </button>
    </div>
  );
}

export const PRIMARY_BUTTON =
  'inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-semibold uppercase tracking-[0.06em] ' +
  'bg-ink text-page-bg border border-ink hover:bg-white transition-colors disabled:opacity-40 disabled:hover:bg-ink';

export const SECONDARY_BUTTON =
  'inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-semibold uppercase tracking-[0.06em] ' +
  'text-ink border border-rule-strong hover:bg-surface transition-colors disabled:opacity-40';
