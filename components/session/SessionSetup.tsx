'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CasePicker from './CasePicker';
import { useSearchParams } from 'next/navigation';
import { BASE_PATH } from '@/lib/paths';
import { X, Copy, Play, RefreshCw } from 'lucide-react';
import {
  casesForDiagnosis,
  findCondition,
  passesFilters,
  normalizeName,
  randomSeed,
  settingsFromQuery,
  settingsToQuery,
  MAX_CASES_PER_DIAGNOSIS,
  type SessionCase,
  type SessionSettings,
} from '@/lib/session';
import { MAX_GUESSES } from '@/lib/gameLogic';
import { useSessionLibrary } from './useSessionLibrary';
import { Section, Field, Segmented, Check, Stepper, PRIMARY_BUTTON, SECONDARY_BUTTON } from './controls';
import { sessionUrl, copyText } from './links';

/**
 * Game Session setup — the instructor picks diagnoses, case counts, order,
 * repetition and answering rules. Every change is mirrored into the page URL,
 * so the setup itself is bookmarkable, and the play link carries the same
 * settings.
 */
export default function SessionSetup() {
  const searchParams = useSearchParams();
  const library = useSessionLibrary();
  const [settings, setSettings] = useState<SessionSettings>(() => settingsFromQuery(searchParams.toString()));
  const [newDx, setNewDx] = useState('');
  const [copied, setCopied] = useState(false);

  const query = settingsToQuery(settings);

  // Mirror settings into the address bar without adding history entries.
  // Uses the History API directly rather than router.replace: on a static host
  // a router navigation fetches page data, and a stale cached copy after a
  // deploy makes Next fall back to a full reload — which re-ran this effect
  // and looped.
  useEffect(() => {
    window.history.replaceState(window.history.state, '', `${BASE_PATH}/session/?${query}`);
  }, [query]);

  const poolOptions = useMemo(
    () => ({
      related: settings.related,
      unreleased: settings.unreleased,
      supplemental: settings.supplemental,
      include: settings.include,
      exclude: settings.exclude,
      conditions: library.conditions,
    }),
    [settings.related, settings.unreleased, settings.supplemental, settings.include, settings.exclude, library.conditions]
  );

  const availability = useMemo(
    () =>
      settings.diagnoses.map((d) => {
        const cases = casesForDiagnosis(library.cases, d.name, poolOptions);
        return {
          total: cases.length,
          library: cases.filter((c) => c.source === 'library').length,
          supplemental: cases.filter((c) => c.source === 'supplemental').length,
        };
      }),
    [settings.diagnoses, library.cases, poolOptions]
  );

  const ready = library.status === 'ready';
  const plannedTotal = settings.diagnoses.reduce((sum, d, i) => {
    if (!ready || settings.repeats) return sum + d.count;
    return sum + Math.min(d.count, availability[i].total);
  }, 0);

  const update = (patch: Partial<SessionSettings>) => setSettings((s) => ({ ...s, ...patch }));

  const setCount = (index: number, count: number) =>
    setSettings((s) => ({
      ...s,
      diagnoses: s.diagnoses.map((d, i) => (i === index ? { ...d, count } : d)),
    }));

  const removeDx = (index: number) =>
    setSettings((s) => ({ ...s, diagnoses: s.diagnoses.filter((_, i) => i !== index) }));

  const addDx = () => {
    const raw = newDx.trim();
    if (!raw) return;
    // Use the library's spelling when the condition exists there
    const name = findCondition(library.conditions, raw)?.name ?? raw;
    if (settings.diagnoses.some((d) => normalizeName(d.name) === normalizeName(name))) {
      setNewDx('');
      return;
    }
    setSettings((s) => ({ ...s, diagnoses: [...s.diagnoses, { name, count: 1 }] }));
    setNewDx('');
  };

  // Ticking/unticking a case records an override only when it differs from
  // what the case-source filters would choose on their own.
  const toggleCase = (c: SessionCase, diagnosis: string, selected: boolean) =>
    setSettings((s) => {
      const byDefault = passesFilters(c, diagnosis, { ...poolOptions, include: [], exclude: [] });
      const include = s.include.filter((k) => k !== c.key);
      const exclude = s.exclude.filter((k) => k !== c.key);
      if (selected && !byDefault) include.push(c.key);
      if (!selected && byDefault) exclude.push(c.key);
      return { ...s, include, exclude };
    });

  const copyLink = () => {
    copyText(sessionUrl(query)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const choiceCount = settings.diagnoses.length;
  const canStart = ready && plannedTotal > 0 && (settings.answer === 'typed' || choiceCount >= 2);

  return (
    <div className="w-full max-w-3xl lg:max-w-5xl mx-auto px-4 py-6 sm:py-8 lg:py-10 space-y-5 lg:space-y-6 lg:text-lg">
      {/* Title block */}
      <div className="border-b border-rule-strong pb-3">
        <p className="report-label">Game Session</p>
        <h1 className="text-2xl sm:text-[28px] lg:text-4xl font-semibold text-ink mt-1">Session setup</h1>
        <p className="text-sm lg:text-base text-ink-muted mt-1.5 max-w-3xl">
          Choose the diagnoses and how many cases of each, then start the session or copy its link. The
          link encodes every setting below, so a class can open the same session.
        </p>
      </div>

      <p className="font-mono text-xs text-ink-faint">
        {library.status === 'loading'
          ? 'LOADING CASE LIBRARY…'
          : `CASE LIBRARY: ${library.cases.filter((c) => c.source === 'library').length} LIBRARY · ${
              library.cases.filter((c) => c.source === 'supplemental').length
            } SUPPLEMENTAL`}
        {library.libraryError && <span className="block mt-1 text-warning">{library.libraryError}</span>}
      </p>

      <Section index={1} title="Diagnoses">
        <div className="border border-rule overflow-x-auto">
          <table className="w-full text-sm lg:text-lg">
            <thead>
              <tr className="border-b border-rule text-left">
                <th className="report-label !text-[10px] font-semibold px-3 py-2">Diagnosis</th>
                <th className="report-label !text-[10px] font-semibold px-3 py-2">Available</th>
                <th className="report-label !text-[10px] font-semibold px-3 py-2">Cases</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {settings.diagnoses.map((d, i) => {
                const avail = availability[i];
                const max = settings.repeats ? MAX_CASES_PER_DIAGNOSIS : Math.max(avail.total, 0);
                const short = ready && !settings.repeats && d.count > avail.total;
                const noCases = ready && avail.total === 0;
                return (
                  <tr key={d.name} className="border-b border-rule last:border-b-0">
                    <td className="px-3 py-2 text-ink">
                      {d.name}
                      {d.count === 0 && (
                        <span className="ml-2 font-mono text-[11px] text-ink-faint">
                          {settings.answer === 'choice' ? 'CHOICE ONLY' : 'NOT USED'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-ink-muted whitespace-nowrap">
                      {!ready ? (
                        '…'
                      ) : (
                        <>
                          {avail.total}
                          {avail.total > 0 && (
                            <span className="text-ink-faint">
                              {' '}
                              ({avail.library} lib · {avail.supplemental} sup)
                            </span>
                          )}
                        </>
                      )}
                      {short && <span className="block text-warning">only {avail.total} available</span>}
                      {noCases && d.count > 0 && <span className="block text-warning">no cases</span>}
                    </td>
                    <td className="px-3 py-2">
                      <Stepper
                        value={d.count}
                        min={0}
                        max={ready ? Math.max(max, d.count) : MAX_CASES_PER_DIAGNOSIS}
                        onChange={(n) => setCount(i, n)}
                        label={`${d.name} cases`}
                      />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeDx(i)}
                        aria-label={`Remove ${d.name}`}
                        className="w-8 h-8 inline-flex items-center justify-center text-ink-faint hover:text-ink border border-transparent hover:border-rule"
                      >
                        <X size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            list="session-conditions"
            value={newDx}
            onChange={(e) => setNewDx(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addDx();
              }
            }}
            placeholder="Add a diagnosis…"
            className="flex-1 min-w-[200px] h-9 px-3 bg-page-bg border border-rule-strong text-sm text-ink placeholder-ink-faint outline-none focus:border-ink"
          />
          <datalist id="session-conditions">
            {library.conditions.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
          <button type="button" onClick={addDx} className={SECONDARY_BUTTON + ' !h-9'}>
            Add
          </button>
        </div>
        <p className="text-xs lg:text-sm text-ink-faint">
          {settings.answer === 'choice'
            ? 'Every listed diagnosis is an answer choice; a count of 0 keeps one as a distractor.'
            : 'Students type their answer and search the full diagnosis list.'}{' '}
          Cases are drawn at random from each diagnosis&apos;s selected cases (see Cases below).
        </p>
      </Section>

      <Section index={2} title="Case sources">
        <Check
          checked={settings.supplemental}
          onChange={(supplemental) => update({ supplemental })}
          label="Include supplemental cases"
          description="Bundled, openly licensed images (Wikimedia Commons) for pneumonia, pleural effusion, empyema and lung abscess."
        />
        <Check
          checked={settings.related}
          onChange={(related) => update({ related })}
          label="Include related diagnoses"
          description="Also use library cases whose answer contains the diagnosis name, e.g. “Lobar pneumonia” under “Pneumonia”."
        />
        <Check
          checked={settings.unreleased}
          onChange={(unreleased) => update({ unreleased })}
          label="Include unreleased daily puzzles"
          description="Library puzzles that have not appeared as a daily puzzle yet (spoils future dailies)."
        />
      </Section>

      <Section index={3} title="Cases">
        <p className="text-xs lg:text-sm text-ink-faint -mt-1">
          Every case that could belong to each diagnosis. Ticks start from the case sources above; tick or untick
          individual cases to include or exclude them. Visible to you only — students never see this list.
        </p>
        {!ready ? (
          <p className="font-mono text-xs text-ink-faint">LOADING…</p>
        ) : (
          <div className="space-y-2">
            {settings.diagnoses.map((d) => (
              <CasePicker
                key={d.name}
                diagnosis={d.name}
                cases={library.cases}
                conditions={library.conditions}
                options={poolOptions}
                onToggle={(c, selected) => toggleCase(c, d.name, selected)}
              />
            ))}
          </div>
        )}
        {(settings.include.length > 0 || settings.exclude.length > 0) && (
          <button
            type="button"
            onClick={() => update({ include: [], exclude: [] })}
            className="text-xs lg:text-sm text-ink-muted hover:text-ink underline underline-offset-4"
          >
            Clear case overrides ({settings.include.length} added, {settings.exclude.length} removed)
          </button>
        )}
      </Section>

      <Section index={4} title="Order & repetition">
        <Field label="Case order">
          <Segmented
            ariaLabel="Case order"
            value={settings.order}
            onChange={(order) => update({ order })}
            options={[
              { value: 'random', label: 'Random' },
              { value: 'grouped', label: 'Grouped by diagnosis' },
              { value: 'interleaved', label: 'Interleaved' },
            ]}
          />
        </Field>
        <Field
          label="Repeats"
          hint={settings.repeats ? 'Cases are reused to reach each count.' : 'Each case appears at most once.'}
        >
          <Segmented
            ariaLabel="Repeats"
            value={settings.repeats ? 'yes' : 'no'}
            onChange={(v) => update({ repeats: v === 'yes' })}
            options={[
              { value: 'no', label: 'No repeats' },
              { value: 'yes', label: 'Allow repeats' },
            ]}
          />
        </Field>
        <Field label="Shared order" hint="Without a seed, each person gets their own shuffle.">
          <div className="space-y-2">
            <Check
              checked={!!settings.seed}
              onChange={(on) => update({ seed: on ? randomSeed() : null })}
              label="Same case order for everyone using the link"
            />
            {settings.seed && (
              <div className="flex items-center gap-2 pl-7">
                <span className="font-mono text-xs text-ink-muted">SEED {settings.seed}</span>
                <button
                  type="button"
                  onClick={() => update({ seed: randomSeed() })}
                  className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink border border-rule px-2 h-6"
                >
                  <RefreshCw size={12} /> New
                </button>
              </div>
            )}
          </div>
        </Field>
      </Section>

      <Section index={5} title="Answering & display">
        <Field label="Answer format">
          <Segmented
            ariaLabel="Answer format"
            value={settings.answer}
            onChange={(answer) => update({ answer })}
            options={[
              { value: 'typed', label: 'Type the diagnosis' },
              { value: 'choice', label: 'Multiple choice' },
            ]}
          />
        </Field>
        <Field label="Attempts per case">
          <Segmented
            ariaLabel="Attempts per case"
            value={settings.tries}
            onChange={(tries) => update({ tries })}
            options={Array.from({ length: MAX_GUESSES }, (_, i) => ({ value: i + 1, label: String(i + 1) }))}
          />
        </Field>
        <Field label="Start screen" hint="What students see before the first case.">
          <Check
            checked={settings.hideContents}
            onChange={(hideContents) => update({ hideContents })}
            label="Hide the diagnoses and case counts"
            description="Shows only the number of cases and the rules. The summary at the end still lists everything."
          />
        </Field>
        <Field label="Findings (hints)">
          <Segmented
            ariaLabel="Findings"
            value={settings.hints}
            onChange={(hints) => update({ hints })}
            options={[
              { value: 'progressive', label: 'After each wrong attempt' },
              { value: 'upfront', label: 'All shown up front' },
              { value: 'off', label: 'Hidden' },
            ]}
          />
        </Field>
      </Section>

      {/* Footer: summary + actions */}
      <div className="border border-rule-strong bg-panel p-4 space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm text-ink">
            <span className="font-mono text-lg font-semibold mr-1.5">{ready ? plannedTotal : '…'}</span>
            case{plannedTotal === 1 ? '' : 's'} · {settings.tries} attempt{settings.tries === 1 ? '' : 's'} each ·{' '}
            {settings.answer === 'choice' ? `${choiceCount} choices` : 'typed answers'}
          </p>
          {settings.answer === 'choice' && choiceCount < 2 && (
            <p className="text-xs text-warning">Multiple choice needs at least two diagnoses.</p>
          )}
        </div>
        <div className="flex items-stretch border border-rule">
          <input
            readOnly
            value={sessionUrl(query)}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Session link"
            className="flex-1 min-w-0 px-3 h-9 bg-page-bg font-mono text-xs text-ink-muted outline-none"
          />
          <button type="button" onClick={copyLink} className="inline-flex items-center gap-1.5 px-3 text-xs font-semibold uppercase tracking-[0.06em] text-ink border-l border-rule hover:bg-surface">
            <Copy size={13} />
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <button type="button" onClick={() => setSettings(settingsFromQuery(''))} className={SECONDARY_BUTTON}>
            Reset
          </button>
          {canStart ? (
            <Link href={`/session/play?${query}`} className={PRIMARY_BUTTON}>
              <Play size={15} />
              Start session
            </Link>
          ) : (
            <button type="button" disabled className={PRIMARY_BUTTON}>
              <Play size={15} />
              Start session
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
