/**
 * Answer sound effects, synthesized with the Web Audio API (no audio files).
 *
 * - correct: a quiz-show "ping-pong" chime, two bell tones stepping down a third
 * - partial: a single soft "pon"
 * - incorrect: a short, low "buu" buzzer
 *
 * During the Halloween season (lib/halloween.ts) they become spooky instead:
 * a skeleton "bone xylophone" run when correct, two bone clacks when close,
 * and a sliding ghost "wooOOooo" when wrong.
 *
 * Sound is on by default; the choice is kept in localStorage and shared with
 * every component through `subscribeSound` (used by `useSoundEnabled`).
 */
import { isHalloweenSeason } from './halloween';

type GuessResult = 'correct' | 'partial' | 'incorrect';

const STORAGE_KEY = 'radiordle_sound';

let context: AudioContext | null = null;
let enabled: boolean | null = null;
const listeners = new Set<() => void>();

export function isSoundEnabled(): boolean {
  if (enabled === null) {
    try {
      enabled = localStorage.getItem(STORAGE_KEY) !== 'off';
    } catch {
      enabled = true;
    }
  }
  return enabled;
}

export function setSoundEnabled(on: boolean): void {
  enabled = on;
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    // Storage blocked: keep the choice for this page only.
  }
  listeners.forEach((l) => l());
}

export function subscribeSound(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * The page's shared AudioContext (also used by lib/music.ts). Created lazily
 * inside a user gesture (a guess or a click), which browsers require.
 */
export function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!context) context = new Ctor();
  if (context.state === 'suspended') void context.resume();
  return context;
}

/** A bell-like tone: a sine with a quieter octave overtone and a fast decay. */
export function bell(
  ctx: AudioContext,
  freq: number,
  start: number,
  length: number,
  volume: number,
  destination: AudioNode = ctx.destination
) {
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, start);
  out.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  out.gain.exponentialRampToValueAtTime(0.0001, start + length);
  out.connect(destination);
  for (const [mult, level] of [[1, 1], [2, 0.25]] as const) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq * mult;
    g.gain.value = level;
    osc.connect(g).connect(out);
    osc.start(start);
    osc.stop(start + length + 0.05);
  }
}

/** A soft buzzer: two slightly detuned square waves through a low-pass filter. */
function buzz(ctx: AudioContext, start: number, length: number, volume: number) {
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, start);
  out.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  out.gain.setValueAtTime(volume, start + length - 0.08);
  out.gain.exponentialRampToValueAtTime(0.0001, start + length);
  filter.connect(out).connect(ctx.destination);
  for (const freq of [146.8, 149.5]) {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.linearRampToValueAtTime(freq * 0.94, start + length);
    osc.connect(filter);
    osc.start(start);
    osc.stop(start + length + 0.05);
  }
}

/** A hollow, woody "bone" note: a sine plus a fast-fading inharmonic overtone. */
function xylo(ctx: AudioContext, freq: number, start: number, volume: number) {
  for (const [mult, level, length] of [[1, 1, 0.35], [3.9, 0.5, 0.08]] as const) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq * mult;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(volume * level, start + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(g).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + length + 0.05);
  }
}

/** A ghostly "wooOOooo": a wobbling sine that swells and slides down. */
function ghost(ctx: AudioContext, start: number, length: number, volume: number) {
  const osc = ctx.createOscillator();
  const wobble = ctx.createOscillator();
  const depth = ctx.createGain();
  const out = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, start);
  osc.frequency.linearRampToValueAtTime(640, start + length * 0.3);
  osc.frequency.exponentialRampToValueAtTime(220, start + length);
  wobble.frequency.value = 6;
  depth.gain.value = 14;
  wobble.connect(depth).connect(osc.frequency);
  out.gain.setValueAtTime(0.0001, start);
  out.gain.exponentialRampToValueAtTime(volume, start + length * 0.3);
  out.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(out).connect(ctx.destination);
  for (const o of [osc, wobble]) {
    o.start(start);
    o.stop(start + length + 0.05);
  }
}

/** Plays the sound for a graded guess, unless sound is off. */
export function playGuessSound(result: GuessResult): void {
  if (!isSoundEnabled()) return;
  try {
    const ctx = audioContext();
    if (!ctx) return;
    const now = ctx.currentTime + 0.01;
    if (isHalloweenSeason(new Date())) {
      if (result === 'correct') {
        // A, C, E, A, then a final high E: a skeleton running up its ribs.
        [440, 523.3, 659.3, 880, 1318.5].forEach((f, i) => xylo(ctx, f, now + i * 0.075, i === 4 ? 0.3 : 0.24));
      } else if (result === 'partial') {
        xylo(ctx, 587.3, now, 0.24);
        xylo(ctx, 587.3, now + 0.11, 0.2);
      } else {
        ghost(ctx, now, 0.9, 0.16);
      }
    } else if (result === 'correct') {
      bell(ctx, 1318.5, now, 0.45, 0.22); // E6 "ping"
      bell(ctx, 1046.5, now + 0.17, 0.8, 0.22); // C6 "pong"
    } else if (result === 'partial') {
      bell(ctx, 784, now, 0.4, 0.18); // G5 "pon"
    } else {
      buzz(ctx, now, 0.42, 0.12); // "buu"
    }
  } catch {
    // Audio is a nicety; never let it break a guess.
  }
}
