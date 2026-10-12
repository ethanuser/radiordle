'use client';

import { useState, ReactNode, CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Wordmark } from './TopBar';
import { withBasePath } from '@/lib/paths';

/**
 * Install (PWA) instructions screen (design foundation: radiordle-install.jsx).
 *
 * A mobile-first "Add to Home Screen" walkthrough with a Safari / Chrome tab
 * switcher and three illustrated step cards per browser. The steps use real
 * (cropped) device screenshots with red pointer arrows drawn in code over the
 * relevant control. Nothing here animates continuously.
 *
 * NOTE: the screenshots were captured against a local dev address
 * (192.168.1.98:3000). Re-capture them on https://radiordle.org before this
 * ships so users don't see a dev URL / "Not Secure" warning.
 */

type Browser = 'safari' | 'chrome';


/* ---- Red hand-drawn pointer arrow ---- */
function RedArrow({
  style,
  flip = false,
  rotate = 0,
  width = 80,
}: {
  style?: CSSProperties;
  flip?: boolean;
  rotate?: number;
  width?: number;
}) {
  return (
    <svg
      viewBox="0 0 100 60"
      width={width}
      style={{
        position: 'absolute',
        transform: `rotate(${rotate}deg)${flip ? ' scaleX(-1)' : ''}`,
        ...style,
      }}
    >
      <defs>
        <marker id="rh" markerWidth="7" markerHeight="7" refX="4" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 z" fill="#ef4444" />
        </marker>
      </defs>
      <path d="M4 30 Q 45 8, 88 28" fill="none" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" markerEnd="url(#rh)" />
    </svg>
  );
}

/* ---- A cropped device screenshot with an optional pointer arrow overlay ---- */
interface Arrow {
  style: CSSProperties;
  flip?: boolean;
  rotate?: number;
  width?: number;
}
function Shot({ src, w, h, arrow }: { src: string; w: number; h: number; arrow?: Arrow }) {
  return (
    <div className="relative bg-black">
      <Image src={withBasePath(src)} alt="" width={w} height={h} className="block w-full h-auto" />
      {arrow && <RedArrow style={arrow.style} flip={arrow.flip} rotate={arrow.rotate} width={arrow.width} />}
    </div>
  );
}

/* ---- Step card ---- */
function StepCard({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <section className="p-4 sm:p-5 bg-panel border border-rule">
      <div className="flex items-center gap-3 mb-3.5">
        <span
          className="flex items-center justify-center font-mono font-semibold text-ink border border-rule-strong flex-shrink-0 w-[30px] h-[30px] text-[14px]"
        >
          {n}
        </span>
        <h3 className="font-display font-semibold text-ink leading-tight text-[17px]">{title}</h3>
      </div>
      <div className="overflow-hidden border border-rule">{children}</div>
    </section>
  );
}

/* ---- Steps per browser ---- */
function SafariSteps() {
  return (
    <>
      <StepCard n="1" title="Tap the Share icon">
        <Shot src="/install/safari-1-share.webp" w={593} h={710}
          arrow={{ style: { top: '1%', right: '46%' }, flip: true, width: 74 }} />
      </StepCard>
      <StepCard n="2" title="Tap “Add to Home Screen”">
        <Shot src="/install/safari-2-add.webp" w={850} h={620}
          arrow={{ style: { top: '66%', right: '40%' }, flip: true, width: 82 }} />
      </StepCard>
      <StepCard n="3" title="Tap “Add”">
        <Shot src="/install/safari-3-confirm.webp" w={920} h={720} />
      </StepCard>
    </>
  );
}

function ChromeSteps() {
  return (
    <>
      <StepCard n="1" title="Tap Share, then “Add to Home Screen”">
        <Shot src="/install/chrome-2-add.webp" w={850} h={535}
          arrow={{ style: { top: '20%', right: '40%' }, flip: true, width: 82 }} />
      </StepCard>
      <StepCard n="2" title="Tap “Add”">
        <Shot src="/install/chrome-3-confirm.webp" w={920} h={720} />
      </StepCard>
    </>
  );
}

function TabBtn({ label, icon, active, onClick }: { label: string; icon: ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 font-display font-semibold uppercase tracking-[0.06em] h-10 text-[13px] transition-colors"
      style={{
        color: active ? '#000' : 'var(--color-ink-muted)',
        background: active ? 'var(--color-ink)' : 'transparent',
        border: '1px solid var(--color-rule-strong)',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

export default function InstallScreen() {
  const [tab, setTab] = useState<Browser>('safari');

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <Link
          href="/"
          aria-label="Back to game"
          className="flex items-center justify-center text-ink w-10 h-10 border border-rule hover:bg-surface transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        </Link>
        <Wordmark compact />
        <div className="w-11" />
      </div>

      {/* Hero */}
      <div className="px-4 pb-2 text-center">
        <div
          className="mx-auto mb-3 flex items-center justify-center w-[56px] h-[56px] border border-rule-strong text-ink"
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="m7 12 5 5 5-5" /><path d="M5 21h14" /></svg>
        </div>
        <h2 className="text-2xl text-ink font-display font-semibold">Install Radiordle</h2>
        <p className="text-ink-muted mt-1 font-display text-sm px-4">
          Add Radiordle to your home screen for a full-screen, app-like experience.
        </p>
      </div>

      {/* Sticky tab switcher */}
      <div className="px-4 py-4 sticky top-0 z-10 bg-page-bg border-b border-rule">
        <div className="flex gap-2.5">
          <TabBtn label="Safari" active={tab === 'safari'} onClick={() => setTab('safari')} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9.5" /><path d="m15.5 8.5-2 5-5 2 2-5z" fill="currentColor" stroke="none" /></svg>} />
          <TabBtn label="Chrome" active={tab === 'chrome'} onClick={() => setTab('chrome')} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9.5" /><circle cx="12" cy="12" r="3.2" /><path d="M12 8.8h8.5M8.8 13.6 4.6 6.7M15.2 13.6l-4.2 7.3" /></svg>} />
        </div>
      </div>

      {/* Steps (key re-mounts to replay the fade on tab switch) */}
      <div key={tab} className="px-4 pb-12 space-y-4" style={{ animation: 'fadeIn 0.25s ease-out' }}>
        {tab === 'safari' ? <SafariSteps /> : <ChromeSteps />}
        <p className="text-ink-faint text-center text-xs font-display pt-2">
          Once installed, open Radiordle right from your home screen — no browser bars.
        </p>
      </div>
    </div>
  );
}
