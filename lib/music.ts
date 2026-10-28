/**
 * Optional Halloween music: an original, music-box style waltz in A minor,
 * synthesized with Web Audio and looped until stopped. It only ever starts
 * from a click on the music toggle (components/ui/Halloween.tsx).
 */
import { audioContext, bell } from './sounds';

const BEAT = 0.42; // seconds per beat (3/4 time)
const BAR = 3 * BEAT;

/** Scientific pitch ("A4", "D#5") to frequency in Hz. */
function freq(note: string): number {
  const m = /^([A-G])(#?)(\d)$/.exec(note);
  if (!m) throw new Error(`Bad note ${note}`);
  const semis = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1] as 'C'] + (m[2] ? 1 : 0);
  const midi = 12 * (Number(m[3]) + 1) + semis;
  return 440 * 2 ** ((midi - 69) / 12);
}

// Eight bars of melody as [note, beats], and one bass note per bar.
const MELODY: [string, number][] = [
  ['A4', 1], ['C5', 1], ['E5', 1],
  ['D#5', 1], ['E5', 2],
  ['F5', 1], ['E5', 1], ['D5', 1],
  ['C5', 1], ['B4', 2],
  ['A4', 1], ['C5', 1], ['E5', 1],
  ['A5', 1], ['G#5', 2],
  ['F5', 1], ['D5', 1], ['B4', 1],
  ['A4', 3],
];
const BASS = ['A2', 'A2', 'D3', 'E2', 'A2', 'E2', 'D2', 'A2'];
const LOOP = BASS.length * BAR;

let master: GainNode | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let playing = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

/** Schedules one pass of the tune starting at `start`; returns when it ends. */
function scheduleLoop(ctx: AudioContext, start: number, out: AudioNode): number {
  let t = start;
  for (const [note, beats] of MELODY) {
    bell(ctx, freq(note), t, Math.min(beats * BEAT + 0.35, 1.4), 0.07, out);
    t += beats * BEAT;
  }
  BASS.forEach((note, i) => bell(ctx, freq(note), start + i * BAR, BAR + 0.2, 0.1, out));
  return start + LOOP;
}

export function isMusicPlaying(): boolean {
  return playing;
}

export function subscribeMusic(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function startMusic(): void {
  if (playing) return;
  const ctx = audioContext();
  if (!ctx) return;
  const out = ctx.createGain();
  out.connect(ctx.destination);
  master = out;
  playing = true;
  let next = scheduleLoop(ctx, ctx.currentTime + 0.1, out);
  // Keep about one bar of tune scheduled ahead.
  timer = setInterval(() => {
    if (next - ctx.currentTime < BAR) next = scheduleLoop(ctx, next, out);
  }, 250);
  notify();
}

export function stopMusic(): void {
  if (!playing) return;
  playing = false;
  if (timer) clearInterval(timer);
  timer = null;
  const out = master;
  master = null;
  const ctx = audioContext();
  if (out && ctx) {
    // Fade out, then cut off the notes already scheduled.
    out.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
    setTimeout(() => out.disconnect(), 400);
  }
  notify();
}
