'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import type { Condition } from '@/lib/supabase';
import {
  candidatesForDiagnosis,
  isCaseSelected,
  normalizeName,
  passesFilters,
  type PoolOptions,
  type SessionCase,
} from '@/lib/session';

interface CasePickerProps {
  diagnosis: string;
  cases: SessionCase[];
  conditions: Condition[];
  options: PoolOptions;
  /** Toggles one case on/off; the parent turns this into include/exclude overrides. */
  onToggle: (c: SessionCase, selected: boolean) => void;
}

/**
 * Per-diagnosis list of every case that could be used (related answers and
 * unreleased puzzles included), with a checkbox each. Checked state starts from
 * the case-source filters; ticking or unticking a case records an override.
 * Instructor-only: shows thumbnails and answers.
 */
export default function CasePicker({ diagnosis, cases, conditions, options, onToggle }: CasePickerProps) {
  const [open, setOpen] = useState(false);
  const candidates = candidatesForDiagnosis(cases, diagnosis, conditions);
  const selectedCount = candidates.filter((c) => isCaseSelected(c, diagnosis, options)).length;

  return (
    <div className="border border-rule">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-3 lg:px-4 py-2.5 text-left hover:bg-surface transition-colors"
      >
        <span className="text-ink">{diagnosis}</span>
        <span className="flex items-center gap-3">
          <span className="font-mono text-xs lg:text-sm text-ink-muted">
            {selectedCount} / {candidates.length} SELECTED
          </span>
          <ChevronDown size={16} className={`text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <ul className="border-t border-rule divide-y divide-rule">
          {candidates.length === 0 && (
            <li className="px-3 lg:px-4 py-3 text-sm text-ink-faint">No cases in the library match this diagnosis.</li>
          )}
          {candidates.map((c) => {
            const selected = isCaseSelected(c, diagnosis, options);
            const byDefault = passesFilters(c, diagnosis, options);
            const related = normalizeName(c.answer) !== normalizeName(diagnosis);
            return (
              <li key={c.id}>
                <label className="flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-2 cursor-pointer hover:bg-surface">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => onToggle(c, e.target.checked)}
                    className="w-4 h-4 accent-[#ececec] flex-shrink-0"
                  />
                  <span className="relative w-16 h-12 lg:w-20 lg:h-14 flex-shrink-0 bg-black border border-rule overflow-hidden">
                    <Image src={c.imageUrl} alt="" fill sizes="80px" className="object-cover" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm lg:text-base text-ink truncate">{c.answer}</span>
                    <span className="block font-mono text-[11px] lg:text-xs text-ink-faint uppercase">
                      {c.key} · {c.label}
                      {c.source === 'library' && !c.released && ' · unreleased'}
                      {related && ' · related'}
                    </span>
                  </span>
                  {selected !== byDefault && (
                    <span className="font-mono text-[11px] lg:text-xs uppercase text-ink-muted border border-rule px-1.5 py-0.5">
                      {selected ? 'Added' : 'Removed'}
                    </span>
                  )}
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
