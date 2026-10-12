'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ZoomIn, ArrowRight, ExternalLink, Eye } from 'lucide-react';
import type { Condition } from '@/lib/supabase';
import type { SessionItem, SessionSettings, SessionGuessResult } from '@/lib/session';
import DiagnosisAutocomplete from '../DiagnosisAutocomplete';
import ImageZoomModal from '../ImageZoomModal';
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from './controls';

export interface CaseRecord {
  guesses: string[];
  results: SessionGuessResult[];
  done: boolean;
  solved: boolean;
  /** Answer revealed without being solved (out of attempts or skipped). */
  revealed: boolean;
}

export const EMPTY_RECORD: CaseRecord = { guesses: [], results: [], done: false, solved: false, revealed: false };

const RESULT_TEXT: Record<SessionGuessResult, string> = {
  correct: 'Correct',
  partial: 'Partially correct',
  incorrect: 'Incorrect',
};

const RESULT_COLOR: Record<SessionGuessResult, string> = {
  correct: 'text-ring-success',
  partial: 'text-ring-warning',
  incorrect: 'text-ring-error',
};

interface SessionCaseViewProps {
  item: SessionItem;
  index: number;
  total: number;
  settings: SessionSettings;
  choices: string[];
  conditions: Condition[];
  record: CaseRecord;
  onGuess: (guess: string) => void;
  onReveal: () => void;
  onNext: () => void;
  isLast: boolean;
}

/**
 * One case laid out like a reading-room screen: the image on the left (black
 * viewport with DICOM-style corner text) and a structured report on the right
 * — FINDINGS (hints) and IMPRESSION (the student's answer).
 */
export default function SessionCaseView({
  item,
  index,
  total,
  settings,
  choices,
  conditions,
  record,
  onGuess,
  onReveal,
  onNext,
  isLast,
}: SessionCaseViewProps) {
  const [zoomOpen, setZoomOpen] = useState(false);
  const nextRef = useRef<HTMLButtonElement>(null);
  const c = item.case;

  const wrongCount = record.results.filter((r) => r !== 'correct').length;
  const visibleHints = record.done || settings.hints === 'upfront'
    ? c.hints
    : settings.hints === 'progressive'
      ? c.hints.slice(0, wrongCount)
      : [];
  const hiddenHintCount = c.hints.length - visibleHints.length;
  const attempt = Math.min(record.guesses.length + 1, settings.tries);
  const showAnnotated = record.done && !!c.annotatedImageUrl;
  const imageUrl = showAnnotated ? c.annotatedImageUrl! : c.imageUrl;

  // Typed mode: ensure session diagnoses are in the list even without the library
  const typedConditions = useMemo(() => {
    const names = new Set(conditions.map((x) => x.name.toLowerCase()));
    const extra = choices
      .filter((name) => !names.has(name.toLowerCase()))
      .map((name) => ({ id: `session-${name}`, name, category: '', aliases: null }));
    return [...conditions, ...extra].sort((a, b) => a.name.localeCompare(b.name));
  }, [conditions, choices]);

  // Keyboard: 1–9 picks a choice; Enter / → moves on once the case is done
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (zoomOpen) return;
      if (record.done) {
        if (e.key === 'Enter' || e.key === 'ArrowRight') {
          e.preventDefault();
          onNext();
        }
        return;
      }
      if (settings.answer === 'choice' && /^[1-9]$/.test(e.key)) {
        const choice = choices[Number(e.key) - 1];
        if (choice && !record.guesses.includes(choice)) onGuess(choice);
      }
    },
    [record, settings.answer, choices, onGuess, onNext, zoomOpen]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  useEffect(() => {
    if (record.done) nextRef.current?.focus();
  }, [record.done]);

  const lastResult = record.results[record.results.length - 1];

  return (
    <div className="w-full max-w-[1280px] mx-auto px-3 sm:px-6 py-4 sm:py-6 grid gap-4 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,1fr)]">
      {/* ---- Image viewport ---- */}
      <div>
        <div
          className={`relative w-full aspect-[4/3] bg-black border-2 transition-colors ${
            record.done ? (record.solved ? 'border-ring-success' : 'border-ring-error') : 'border-rule'
          } cursor-zoom-in`}
          onClick={() => setZoomOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setZoomOpen(true);
            }
          }}
          aria-label="Zoom image"
        >
          <Image
            src={imageUrl}
            alt={`Case ${index + 1}`}
            fill
            className="object-contain"
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
          />
          <div className="pointer-events-none absolute inset-0 p-2.5 font-mono text-[11px] leading-snug text-white/70">
            <div className="absolute top-2.5 left-2.5">
              CASE {String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
            </div>
            {/* Case source is shown only after answering so labels can't be memorized */}
            <div className="absolute top-2.5 right-2.5 text-right uppercase">{record.done ? c.label : ''}</div>
            <div className="absolute bottom-2.5 left-2.5 uppercase">{showAnnotated ? 'Annotated' : ''}</div>
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1">
              <ZoomIn size={13} /> ZOOM
            </div>
          </div>
        </div>
      </div>

      {/* ---- Report panel ---- */}
      <div className="border border-rule bg-panel flex flex-col">
        <div className="flex items-baseline justify-between px-4 py-2.5 border-b border-rule">
          <p className="report-label !text-ink">Report</p>
          <p className="font-mono text-xs text-ink-muted">
            CASE {index + 1} OF {total}
          </p>
        </div>

        {/* Findings */}
        <div className="px-4 pt-3 pb-4 border-b border-rule">
          <p className="report-label mb-2">Findings</p>
          {visibleHints.length > 0 ? (
            <ol className="space-y-1.5">
              {visibleHints.map((hint, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-snug text-ink animate-hint-reveal">
                  <span className="font-mono text-xs text-ink-faint pt-0.5">{String(i + 1).padStart(2, '0')}</span>
                  <span>{hint}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-ink-faint italic">
              {settings.hints === 'off'
                ? 'Findings are hidden for this session.'
                : 'Interpret the image. Findings are added after each incorrect impression.'}
            </p>
          )}
          {!record.done && settings.hints === 'progressive' && visibleHints.length > 0 && hiddenHintCount > 0 && (
            <p className="mt-2 font-mono text-[11px] text-ink-faint">{hiddenHintCount} MORE AFTER AN INCORRECT ATTEMPT</p>
          )}
        </div>

        {/* Impression */}
        <div className="px-4 pt-3 pb-4 flex-1">
          <div className="flex items-baseline justify-between mb-2">
            <p className="report-label">Impression</p>
            {!record.done && (
              <p className="font-mono text-xs text-ink-muted">
                ATTEMPT {attempt} OF {settings.tries}
              </p>
            )}
          </div>

          {/* Previous attempts */}
          {record.guesses.length > 0 && (
            <ul className="mb-3 border border-rule divide-y divide-rule">
              {record.guesses.map((g, i) => (
                <li key={i} className="flex items-center justify-between px-3 py-1.5 text-sm">
                  <span className="text-ink">{g}</span>
                  <span className={`font-mono text-[11px] uppercase ${RESULT_COLOR[record.results[i]]}`}>
                    {RESULT_TEXT[record.results[i]]}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {!record.done ? (
            <>
              {settings.answer === 'choice' ? (
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {choices.map((choice, i) => {
                    const used = record.guesses.includes(choice);
                    return (
                      <button
                        key={choice}
                        type="button"
                        disabled={used}
                        onClick={() => onGuess(choice)}
                        className={`flex items-center gap-3 text-left px-3 h-11 border transition-colors ${
                          used
                            ? 'border-rule text-ink-faint line-through cursor-not-allowed'
                            : 'border-rule-strong text-ink hover:bg-ink hover:text-page-bg'
                        }`}
                      >
                        {i < 9 && <span className="font-mono text-xs opacity-60">{i + 1}</span>}
                        <span className="text-[15px]">{choice}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <DiagnosisAutocomplete
                  key={record.guesses.length}
                  conditions={typedConditions}
                  onSubmit={onGuess}
                  onDropdownStateChange={() => {}}
                  previousGuesses={record.guesses}
                />
              )}
              {lastResult && lastResult !== 'correct' && (
                <p className={`mt-2 font-mono text-xs uppercase ${RESULT_COLOR[lastResult]}`}>
                  {RESULT_TEXT[lastResult]} — try again
                </p>
              )}
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={onReveal} className="inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink">
                  <Eye size={13} /> Reveal answer
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className={`border-l-4 ${record.solved ? 'border-l-success' : 'border-l-error'} border border-rule px-3 py-2.5`}>
                <p className={`font-mono text-[11px] uppercase ${record.solved ? 'text-ring-success' : 'text-ring-error'}`}>
                  {record.solved
                    ? `Correct on attempt ${record.guesses.length}`
                    : record.guesses.length === 0
                      ? 'Answer revealed'
                      : 'Not solved'}
                </p>
                <p className="text-xl font-semibold text-ink mt-0.5">{item.diagnosis}</p>
                {c.answer.toLowerCase() !== item.diagnosis.toLowerCase() && (
                  <p className="text-sm text-ink-muted">Library answer: {c.answer}</p>
                )}
              </div>
              {c.description && <p className="text-sm text-ink-muted leading-relaxed">{c.description}</p>}
              {c.citation && <p className="text-xs text-ink-faint italic">{c.citation}</p>}
              <div className="flex flex-wrap gap-2 justify-between pt-1">
                {c.learnLink ? (
                  <a href={c.learnLink} target="_blank" rel="noopener noreferrer" className={SECONDARY_BUTTON}>
                    Learn more <ExternalLink size={13} />
                  </a>
                ) : (
                  <span />
                )}
                <button ref={nextRef} type="button" onClick={onNext} className={PRIMARY_BUTTON}>
                  {isLast ? 'Finish session' : 'Next case'} <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {zoomOpen && (
        <ImageZoomModal onClose={() => setZoomOpen(false)} imageUrl={imageUrl} altText={`Case ${index + 1}`} />
      )}
    </div>
  );
}
