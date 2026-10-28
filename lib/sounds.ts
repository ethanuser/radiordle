/**
 * Answer sound effects, synthesized with the Web Audio API (no audio files).
 *
 * - correct: a quiz-show "ping-pong" chime, two bell tones stepping down a third
 * - partial: a single soft "pon"
 * - incorrect: a short, low "buu" buzzer
 *
 * Sound is on by default; the choice is kept in localStorage and shared with
 * every component through `subscribeSound` (used by `useSoundEnabled`).
 */
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

/** Created lazily inside a user gesture (a guess), which browsers require. */
function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!context) context = new Ctor();
  if (context.state === 'suspended') void context.resume();
  return context;
}

/** A bell-like tone: a sine with a quieter octave overtone and a fast decay. */
function bell(ctx: AudioContext, freq: number, start: number, length: number, volume: number) {
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, start);
  out.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  out.gain.exponentialRampToValueAtTime(0.0001, start + length);
  out.connect(ctx.destination);
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

/** Plays the sound for a graded guess, unless sound is off. */
export function playGuessSound(result: GuessResult): void {
  if (!isSoundEnabled()) return;
  try {
    const ctx = audio();
    if (!ctx) return;
    const now = ctx.currentTime + 0.01;
    if (result === 'correct') {
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
