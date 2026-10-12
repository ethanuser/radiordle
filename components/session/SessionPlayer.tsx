'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Play, RotateCcw, Shuffle, Settings2, Copy } from 'lucide-react';
import { buildSession, gradeGuess, randomSeed, settingsFromQuery, settingsToQuery } from '@/lib/session';
import { useSessionLibrary } from './useSessionLibrary';
import SessionCaseView, { EMPTY_RECORD, type CaseRecord } from './SessionCaseView';
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from './controls';
import { copyText, sessionUrl } from './links';

type Phase = 'intro' | 'case' | 'summary';

/**
 * Runs a Game Session whose settings come from the URL. Flow: intro sheet →
 * one case at a time → summary report. Progress is kept in memory only.
 */
export default function SessionPlayer() {
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const settings = useMemo(() => settingsFromQuery(query), [query]);
  const library = useSessionLibrary();

  // A fixed seed from the URL gives everyone the same order; otherwise shuffle per visit.
  const [seed, setSeed] = useState(() => settings.seed ?? randomSeed());
  const built = useMemo(
    () => (library.status === 'ready' ? buildSession(settings, library.cases, seed, library.conditions) : null),
    [library.status, library.cases, library.conditions, settings, seed]
  );

  const [phase, setPhase] = useState<Phase>('intro');
  const [index, setIndex] = useState(0);
  const [records, setRecords] = useState<CaseRecord[]>([]);
  const [copied, setCopied] = useState(false);

  const choices = settings.diagnoses.map((d) => d.name);
  const items = useMemo(() => built?.items ?? [], [built]);
  const record = records[index] ?? EMPTY_RECORD;

  const updateRecord = useCallback(
    (fn: (r: CaseRecord) => CaseRecord) =>
      setRecords((prev) => {
        const next = [...prev];
        next[index] = fn(prev[index] ?? EMPTY_RECORD);
        return next;
      }),
    [index]
  );

  const handleGuess = useCallback(
    (guess: string) => {
      const item = items[index];
      if (!item) return;
      updateRecord((r) => {
        if (r.done || r.guesses.includes(guess)) return r;
        const result = gradeGuess(guess, item);
        const guesses = [...r.guesses, guess];
        const results = [...r.results, result];
        const solved = result === 'correct';
        const done = solved || guesses.length >= settings.tries;
        return { guesses, results, done, solved, revealed: done && !solved };
      });
    },
    [items, index, settings.tries, updateRecord]
  );

  const handleReveal = useCallback(() => {
    updateRecord((r) => ({ ...r, done: true, solved: false, revealed: true }));
  }, [updateRecord]);

  const handleNext = useCallback(() => {
    if (index + 1 >= items.length) {
      setPhase('summary');
    } else {
      setIndex(index + 1);
    }
    window.scrollTo({ top: 0 });
  }, [index, items.length]);

  const start = () => {
    setRecords([]);
    setIndex(0);
    setPhase('case');
  };

  const reshuffle = () => {
    setSeed(randomSeed());
    start();
  };

  // Link that reproduces exactly this run (same seed → same cases and order)
  const exactQuery = settingsToQuery({ ...settings, seed });

  const copyExactLink = () => {
    copyText(sessionUrl(exactQuery)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  if (!built) {
    return <Sheet label="Game Session" title="Loading cases…" />;
  }

  if (items.length === 0) {
    return (
      <Sheet label="Game Session" title="No cases match these settings">
        <p className="text-sm text-ink-muted">
          None of the selected diagnoses have cases available. Adjust the diagnoses or case sources.
        </p>
        {library.libraryError && <p className="text-xs text-warning">{library.libraryError}</p>}
        <div className="flex justify-end pt-2">
          <Link href={`/session?${query}`} className={PRIMARY_BUTTON}>
            <Settings2 size={15} /> Edit settings
          </Link>
        </div>
      </Sheet>
    );
  }

  // ---- Intro ----
  if (phase === 'intro') {
    return (
      <Sheet label="Game Session" title={`${items.length} case${items.length === 1 ? '' : 's'}`}>
        <dl className="grid grid-cols-[140px_1fr] border border-rule text-sm">
          <Row term="Diagnoses">
            {settings.diagnoses.map((d) => (
              <span key={d.name} className="block">
                {d.name}
                <span className="font-mono text-xs text-ink-faint">
                  {' '}
                  {d.count > 0 ? `× ${built.items.filter((it) => it.diagnosis === d.name).length}` : '(choice only)'}
                </span>
              </span>
            ))}
          </Row>
          <Row term="Order">
            {{ random: 'Random', grouped: 'Grouped by diagnosis', interleaved: 'Interleaved' }[settings.order]}
            {settings.seed && <span className="font-mono text-xs text-ink-faint"> · shared seed {settings.seed}</span>}
          </Row>
          <Row term="Repeats">{settings.repeats ? 'Allowed' : 'None'}</Row>
          <Row term="Answer">
            {settings.answer === 'choice' ? 'Multiple choice' : 'Type the diagnosis'} · {settings.tries} attempt
            {settings.tries === 1 ? '' : 's'} per case
          </Row>
          <Row term="Findings">
            {{ progressive: 'Revealed after each wrong attempt', upfront: 'Shown up front', off: 'Hidden until answered' }[settings.hints]}
          </Row>
        </dl>
        {built.shortfalls.length > 0 && (
          <p className="text-xs text-warning">
            Fewer cases than requested for:{' '}
            {built.shortfalls.map((s) => `${s.diagnosis} (${s.available}/${s.requested})`).join(', ')}.
            {!settings.repeats && ' Allow repeats to reuse cases.'}
          </p>
        )}
        {library.libraryError && <p className="text-xs text-ink-faint">{library.libraryError}</p>}
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Link href={`/session?${query}`} className={SECONDARY_BUTTON}>
            <Settings2 size={15} /> Edit settings
          </Link>
          <button type="button" onClick={start} className={PRIMARY_BUTTON} autoFocus>
            <Play size={15} /> Begin
          </button>
        </div>
      </Sheet>
    );
  }

  // ---- Summary ----
  if (phase === 'summary') {
    const solved = records.filter((r) => r?.solved).length;
    const firstTry = records.filter((r) => r?.solved && r.guesses.length === 1).length;
    const byDx = settings.diagnoses
      .map((d) => {
        const idx = items.map((it, i) => (it.diagnosis === d.name ? i : -1)).filter((i) => i >= 0);
        return { name: d.name, total: idx.length, correct: idx.filter((i) => records[i]?.solved).length };
      })
      .filter((d) => d.total > 0);

    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-5">
        <div className="border-b border-rule-strong pb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="report-label">Game Session · Summary</p>
            <h1 className="text-2xl sm:text-[28px] font-semibold text-ink mt-1">
              {solved} / {items.length} correct
            </h1>
          </div>
          <p className="font-mono text-xs text-ink-muted">
            {Math.round((solved / items.length) * 100)}% · {firstTry} ON FIRST ATTEMPT
          </p>
        </div>

        <ResultStrip records={records} total={items.length} />

        <div className="border border-rule bg-panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-rule text-left">
                {['#', 'Diagnosis', 'Your answers', 'Result'].map((h) => (
                  <th key={h} className="report-label !text-[10px] font-semibold px-3 py-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => {
                const r = records[i] ?? EMPTY_RECORD;
                return (
                  <tr key={i} className="border-b border-rule last:border-b-0 align-top">
                    <td className="px-3 py-2 font-mono text-xs text-ink-faint">{String(i + 1).padStart(2, '0')}</td>
                    <td className="px-3 py-2 text-ink">
                      {it.diagnosis}
                      <span className="block font-mono text-[11px] text-ink-faint uppercase">{it.case.label}</span>
                    </td>
                    <td className="px-3 py-2 text-ink-muted">{r.guesses.length ? r.guesses.join(' → ') : '—'}</td>
                    <td
                      className={`px-3 py-2 font-mono text-[11px] uppercase whitespace-nowrap ${
                        r.solved ? 'text-ring-success' : 'text-ring-error'
                      }`}
                    >
                      {r.solved ? `Correct (${r.guesses.length})` : r.guesses.length ? 'Not solved' : 'Revealed'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {byDx.length > 1 && (
          <div className="border border-rule bg-panel">
            <p className="report-label px-3 py-2 border-b border-rule">By diagnosis</p>
            <ul className="divide-y divide-rule">
              {byDx.map((d) => (
                <li key={d.name} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="w-40 text-ink">{d.name}</span>
                  <span className="flex-1 h-2 bg-surface border border-rule">
                    <span className="block h-full bg-ink" style={{ width: `${(d.correct / d.total) * 100}%` }} />
                  </span>
                  <span className="font-mono text-xs text-ink-muted w-12 text-right">
                    {d.correct}/{d.total}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2 justify-end">
          <Link href={`/session?${query}`} className={SECONDARY_BUTTON}>
            <Settings2 size={15} /> Edit settings
          </Link>
          <button type="button" onClick={copyExactLink} className={SECONDARY_BUTTON}>
            <Copy size={14} /> {copied ? 'Copied' : 'Copy link to this run'}
          </button>
          {!settings.seed && (
            <button type="button" onClick={reshuffle} className={SECONDARY_BUTTON}>
              <Shuffle size={15} /> New shuffle
            </button>
          )}
          <button type="button" onClick={start} className={PRIMARY_BUTTON}>
            <RotateCcw size={15} /> Replay same cases
          </button>
        </div>
      </div>
    );
  }

  // ---- Case ----
  return (
    <>
      <div className="w-full max-w-[1280px] mx-auto px-3 sm:px-6 pt-4">
        <ResultStrip records={records} total={items.length} current={index} />
      </div>
      <SessionCaseView
        key={index}
        item={items[index]}
        index={index}
        total={items.length}
        settings={settings}
        choices={choices}
        conditions={library.conditions}
        record={record}
        onGuess={handleGuess}
        onReveal={handleReveal}
        onNext={handleNext}
        isLast={index + 1 >= items.length}
      />
    </>
  );
}

/** One square per case: green solved, red not solved, outlined = current. */
function ResultStrip({ records, total, current }: { records: CaseRecord[]; total: number; current?: number }) {
  return (
    <div className="flex gap-1" aria-label="Session progress">
      {Array.from({ length: total }, (_, i) => {
        const r = records[i];
        const color = r?.done ? (r.solved ? 'bg-success' : 'bg-error') : 'bg-surface';
        return (
          <span
            key={i}
            className={`h-2.5 flex-1 border ${i === current ? 'border-ink' : 'border-rule'} ${color}`}
          />
        );
      })}
    </div>
  );
}

function Sheet({ label, title, children }: { label: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-10">
      <div className="border border-rule bg-panel p-5 sm:p-6 space-y-4">
        <div className="border-b border-rule pb-3">
          <p className="report-label">{label}</p>
          <h1 className="text-2xl font-semibold text-ink mt-1">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="report-label !text-[10px] px-3 py-2 border-b border-r border-rule">{term}</dt>
      <dd className="px-3 py-2 border-b border-rule text-ink">{children}</dd>
    </>
  );
}
