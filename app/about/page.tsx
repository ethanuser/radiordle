import type { Metadata } from 'next';
import { ReactNode } from 'react';
import Image from 'next/image';
import TopBar from '@/components/TopBar';
import { withBasePath } from '@/lib/paths';
import PlainBackground from '@/components/PlainBackground';

export const metadata: Metadata = {
  title: 'About - Radiordle',
  description: 'About this teaching edition of Radiordle.',
};

/** Content section on the About screen — a flat, ruled report section. */
function AboutCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border border-rule bg-panel">
      <h2 className="report-label !text-ink px-5 py-2.5 border-b border-rule">{title}</h2>
      <div className="p-5 space-y-3 text-ink/85 text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}

// The team — Kishan (left) and Tanmay (right).
const TEAM = [
  {
    name: 'Kishan Asokan',
    title: 'Co-Founder, Puzzle Creator & Platform Lead',
    job: 'MS4 @ McGovern',
    bio: "Builds and curates the complete daily case library, writes the accompanying diagnostic hints, designs the platform's UI, and manages releases and updates.",
    photo: withBasePath('/headshot/Kishan_Radiordle.jpg'),
  },
  {
    name: 'Tanmay Singh',
    title: 'Co-Founder & Tech Lead',
    job: 'Software Engineer',
    bio: "Established the platform's data architecture, built the puzzle rotation system and deployment infrastructure, and handles backend fixes and maintenance.",
    photo: withBasePath('/headshot/Tanmay_Radiordle.jpg'),
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen-safe relative overflow-y-auto overflow-x-hidden" style={{ minHeight: 'var(--full-vh)' }}>
      {/* Plain dark base */}
      <PlainBackground />

      {/* Content */}
      <div className="relative z-10 min-h-screen-safe flex flex-col" style={{ minHeight: 'var(--full-vh)' }}>
        <TopBar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center px-4 py-6 sm:py-8">
          <div className="w-full max-w-2xl space-y-5">
            <AboutCard title="About Radiordle">
              <p>
                Radiordle is a daily radiology puzzle game inspired by Wordle, created by Kishan Asokan and Tanmay
                Singh. This site is a teaching adaptation: it reads cases from the Radiordle library (read-only) and
                runs them as instructor-configured Game Sessions. The daily game itself is at{' '}
                <a href="https://www.radiordle.org" className="underline underline-offset-4 text-ink">radiordle.org</a>.
              </p>
            </AboutCard>

            <AboutCard title="Game Session (teaching)">
              <p>
                <strong className="text-ink">Game Session</strong> runs a set of cases for teaching. Choose the
                diagnoses and how many cases of each, whether cases may repeat, the order, the answer format, attempts
                per case and how findings are revealed. All settings are encoded in the session link, so an
                instructor can share one link with a class.
              </p>
              <p>
                Cases come from the Radiordle library plus a small bundled supplemental set (pneumonia, pleural
                effusion, empyema, lung abscess) using openly licensed Wikimedia Commons images, credited on each
                case. The supplemental clinical vignettes are illustrative.
              </p>
            </AboutCard>

            <AboutCard title="Meet the Team">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {TEAM.map((member) => (
                  <div
                    key={member.name}
                    className="flex flex-col items-center text-center p-5 border border-rule"
                  >
                    <div className="relative mb-3.5 w-[112px] h-[112px] overflow-hidden border border-rule-strong grayscale">
                      <Image src={member.photo} alt={member.name} fill sizes="128px" className="object-cover" />
                    </div>
                    <h3 className="font-display font-semibold text-ink leading-tight text-lg">{member.name}</h3>
                    <p className="font-medium text-ink-muted text-sm">{member.title}</p>
                    <p className="font-mono text-ink-faint text-xs mt-0.5 mb-2.5 uppercase">{member.job}</p>
                    <p className="text-ink-muted text-sm leading-relaxed">{member.bio}</p>
                  </div>
                ))}
              </div>
            </AboutCard>

            <AboutCard title="Contact & Contribute">
              <p>Have feedback, suggestions, or found a bug? We would love to hear from you!</p>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <a
                  href="https://github.com/kishanasokan/Radwordle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-5 h-10 text-sm font-semibold uppercase tracking-[0.06em] text-ink border border-rule-strong hover:bg-surface transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  GitHub Repository
                </a>
              </div>
            </AboutCard>

            <AboutCard title="Image Sources & Credits">
              <p>
                All medical images used in Radiordle are sourced from open-source or free-use collections and are used in accordance with their respective licenses. We are grateful to the medical imaging community for making educational resources freely available.
              </p>
            </AboutCard>

            {/* Disclaimer — quieter card */}
            <section className="border border-rule p-5">
              <h2 className="report-label mb-2">Disclaimer</h2>
              <p className="text-ink-muted text-sm leading-relaxed">
                Radiordle is designed for entertainment and general educational interest only and does not provide medical advice. Users should consult a qualified healthcare professional for medical concerns. All images used are sourced from open-source or free-use collections and are used in accordance with their licenses.
              </p>
            </section>

            <p className="text-ink-faint text-center text-xs font-mono py-4">
              © {new Date().getFullYear()} Radiordle. For educational and entertainment purposes only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
