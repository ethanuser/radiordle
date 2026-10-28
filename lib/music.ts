/**
 * Optional Halloween music: Saint-Saëns' "Danse Macabre" (skeletons dancing at
 * midnight), performed by Kevin MacLeod (incompetech.com), CC BY 3.0, via
 * Wikimedia Commons; credited on the About page. Stored as a 64 kbps mono MP3
 * in public/halloween/. It loops until stopped and only ever starts from a
 * click on the music toggle (components/ui/Halloween.tsx).
 */
import { withBasePath } from './paths';

const SRC = '/halloween/danse-macabre.mp3';
const VOLUME = 0.35;

let player: HTMLAudioElement | null = null;
let playing = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function isMusicPlaying(): boolean {
  return playing;
}

export function subscribeMusic(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function startMusic(): void {
  if (playing || typeof Audio === 'undefined') return;
  if (!player) {
    player = new Audio(withBasePath(SRC));
    player.loop = true;
    player.volume = VOLUME;
    player.preload = 'none';
  }
  playing = true;
  notify();
  player.play().catch(() => {
    // Blocked or failed to load: show the toggle as off again.
    playing = false;
    notify();
  });
}

export function stopMusic(): void {
  if (!playing) return;
  playing = false;
  player?.pause();
  notify();
}
