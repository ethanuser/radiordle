import type { Metadata } from 'next';
import { ReactNode } from 'react';
import TopBar from '@/components/TopBar';
import PlainBackground from '@/components/PlainBackground';

export const metadata: Metadata = {
  title: 'About',
  description: 'About this fork of Radiordle and its Game Session teaching mode.',
};

const REPO_URL = 'https://github.com/ethanuser/radiordle';

/** Content section on the About screen — a flat, ruled report section. */
function AboutCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border border-rule bg-panel">
      <h2 className="report-label !text-ink px-5 py-2.5 border-b border-rule">{title}</h2>
      <div className="p-5 space-y-3 text-ink/85 text-[15px] lg:text-base leading-relaxed">{children}</div>
    </section>
  );
}

function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-4 hover:text-white">
      {children}
    </a>
  );
}

const FEATURES: { title: string; text: string }[] = [
  {
    title: 'Game Session',
    text: 'Instructor-configured runs of cases for teaching: choose diagnoses and how many cases of each, include or exclude specific cases, repeats, order, attempts per case and how findings are revealed.',
  },
  {
    title: 'Shareable session links',
    text: 'Every session setting is encoded in the URL, so one link gives a whole class the same session (optionally in the same order).',
  },
  {
    title: 'Hidden session contents',
    text: 'The start screen can hide which diagnoses and how many of each are coming; everything is listed in the end-of-session summary.',
  },
  {
    title: 'Projection-friendly layout',
    text: 'A flat, radiology-report style interface that fills large screens: image on the left, findings and impression on the right.',
  },
  {
    title: 'Supplemental cases',
    text: 'Openly licensed X-ray and CT cases (Radiopaedia, Wikimedia Commons) for pneumonia, pleural effusion, empyema, lung abscess, pulmonary edema and atelectasis, credited on each case.',
  },
  {
    title: 'Static and read-only',
    text: 'Runs as a static GitHub Pages site and reads the Radiordle case library read-only; your results and stats stay in your browser.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen-safe relative overflow-y-auto overflow-x-hidden" style={{ minHeight: 'var(--full-vh)' }}>
      <PlainBackground />

      <div className="relative z-10 min-h-screen-safe flex flex-col" style={{ minHeight: 'var(--full-vh)' }}>
        <TopBar />

        <div className="flex-1 flex flex-col items-center px-4 py-6 sm:py-8">
          <div className="w-full max-w-2xl lg:max-w-3xl space-y-5">
            <div className="border-b border-rule-strong pb-3">
              <p className="report-label">About</p>
              <h1 className="text-2xl sm:text-[28px] font-semibold text-ink mt-1">Radiordle, with Game Sessions</h1>
            </div>

            <AboutCard title="This site">
              <p>
                A fork of Radiordle built by <ExtLink href="https://github.com/ethanuser">Ethan Nguyen</ExtLink> for
                teaching. It shows the same daily puzzle and archive, and adds Game Sessions for running sets of cases
                with a class.
              </p>
              <p>
                Source code: <ExtLink href={REPO_URL}>github.com/ethanuser/radiordle</ExtLink>
              </p>
            </AboutCard>

            <AboutCard title="Added in this fork">
              <ul className="divide-y divide-rule -my-1">
                {FEATURES.map((f) => (
                  <li key={f.title} className="py-2.5">
                    <p className="text-ink font-medium">{f.title}</p>
                    <p className="text-ink-muted text-sm lg:text-[15px] mt-0.5">{f.text}</p>
                  </li>
                ))}
              </ul>
            </AboutCard>

            <AboutCard title="Original Radiordle">
              <p>
                Radiordle — the daily radiology puzzle game, its case library and hints — was created by Kishan Asokan
                and Tanmay Singh. Play the original at <ExtLink href="https://www.radiordle.org">radiordle.org</ExtLink>{' '}
                (source: <ExtLink href="https://github.com/kishanasokan/Radwordle">github.com/kishanasokan/Radwordle</ExtLink>).
              </p>
            </AboutCard>

            <section className="border border-rule p-5">
              <h2 className="report-label mb-2">Disclaimer</h2>
              <p className="text-ink-muted text-sm leading-relaxed">
                For education only; not medical advice. Images come from open-source or free-use collections and are
                used in accordance with their licenses.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
