'use client';

import { CSSProperties } from 'react';

/**
 * Page background — a flat, neutral PACS reading-room backdrop. Near-black
 * base with crisp grey DICOM/PACS annotations (side rails by the R / L
 * markers, corner metadata, couch curve, scale ruler). No color cast, glow,
 * grain or vignette: annotations are drawn at fixed, legible contrast.
 *
 * Purely decorative: pointer-events-none, aria-hidden, a single static paint.
 */

const MONO = 'var(--font-plex-mono), ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const BASE = 'var(--color-page-bg)';

const META_COLOR = 'rgba(255, 255, 255, 0.34)';
const ORIENT_COLOR = 'rgba(255, 255, 255, 0.5)';
const RAIL_COLOR = 'rgba(255, 255, 255, 0.16)';
const CURVE_COLOR = 'rgba(255, 255, 255, 0.24)';
const TICK = 'rgba(255, 255, 255, 0.3)';

export default function PageBackground() {
  // Constant portions of the corner-metadata / orientation styles (font size is
  // applied responsively via className below).
  const meta: CSSProperties = {
    fontFamily: MONO,
    lineHeight: 1.7,
    letterSpacing: '0.04em',
    color: META_COLOR,
    whiteSpace: 'pre',
  };
  const orient: CSSProperties = {
    fontFamily: MONO,
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: ORIENT_COLOR,
  };
  const ruler = Array.from({ length: 31 });

  return (
    <div
      aria-hidden="true"
      className="absolute sm:fixed inset-0 overflow-hidden pointer-events-none"
      style={{ background: BASE }}
    >
      {/* Side rails flanking the R / L orientation markers */}
      <div className="absolute top-[6%] bottom-[6%] w-px" style={{ left: '5%', background: RAIL_COLOR }} />
      <div className="absolute top-[6%] bottom-[6%] w-px" style={{ right: '5%', background: RAIL_COLOR }} />

      {/* Corner metadata — authentic PACS/DICOM fields.
          Top blocks use a fixed px offset so they always clear the glass navbar
          (56px mobile / 84px desktop) instead of tucking under it. */}
      <div className="absolute text-[8.5px] sm:text-[11px] top-[68px] sm:top-[96px]" style={{ left: '6%', ...meta }}>
        {'Im: 24/512\nSe: 3\nJPEG Lossy 20:1'}
      </div>
      <div
        className="absolute text-[8.5px] sm:text-[11px] text-right top-[68px] sm:top-[96px]"
        style={{ right: '6%', ...meta }}
      >
        {'Study ID: 100482\nCT ABDOMEN W/CONTRAST\nAXIAL 2.0MM SOFT TISSUE\nFlip H'}
      </div>
      <div className="absolute text-[8.5px] sm:text-[11px]" style={{ bottom: '24%', left: '6%', ...meta }}>
        {'X: 256  Y: 198   HU: 42\nWL: 40  WW: 400   [Soft Tissue]\nThk: 2.0mm   Loc: -84.5mm'}
      </div>
      <div
        className="absolute text-[8.5px] sm:text-[11px] text-right"
        style={{ bottom: '24%', right: '6%', ...meta }}
      >
        {'kVp: 120\nmA: 200\n2024-03-12  14:22:05'}
      </div>

      {/* R / L orientation markers */}
      <div className="absolute" style={{ top: '49%', left: '6.5%', ...orient }}>
        R
      </div>
      <div className="absolute" style={{ top: '49%', right: '6.5%', ...orient }}>
        L
      </div>

      {/* Curved couch line, like a real CT table edge */}
      <svg
        className="absolute bottom-[18%] sm:bottom-[11%]"
        style={{ left: '20%', width: '60%', height: '5%', overflow: 'visible' }}
        viewBox="0 0 800 60"
        preserveAspectRatio="none"
      >
        <path
          d="M0 44 Q400 6 800 44"
          fill="none"
          stroke={CURVE_COLOR}
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Scale ruler with hash ticks */}
      <div
        className="absolute bottom-[15%] sm:bottom-[8%]"
        style={{ left: '20%', width: '60%', height: 1, background: TICK }}
      />
      {ruler.map((_, i) => (
        <div
          key={i}
          className="absolute bottom-[15%] sm:bottom-[8%]"
          style={{
            left: 20 + i * 2 + '%',
            width: 1,
            height: i % 5 === 0 ? 11 : 6,
            background: TICK,
          }}
        />
      ))}
    </div>
  );
}
