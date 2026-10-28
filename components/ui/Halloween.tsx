'use client';

import { useSyncExternalStore } from 'react';
import { Music, Music2 } from 'lucide-react';
import { isHalloweenSeason } from '@/lib/halloween';
import { isMusicPlaying, startMusic, stopMusic, subscribeMusic } from '@/lib/music';
import { withBasePath } from '@/lib/paths';

const noSubscribe = () => () => {};

/**
 * True during the Halloween season. Always false in the prerendered HTML (the
 * site is a static export, so the build date must not decide it); the browser
 * checks its own date on hydration.
 */
export function useHalloween(): boolean {
  return useSyncExternalStore(noSubscribe, () => isHalloweenSeason(new Date()), () => false);
}

/** Skull that stands in for the wordmark's crosshair during the season. */
export function SkullMark({ size }: { size: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={withBasePath('/halloween/skull-mark.svg')} alt="" aria-hidden="true" width={size} height={size} className="flex-shrink-0" />
  );
}

/** A small skeleton dangling from the top bar on a thread, swaying gently (1024px and up). */
export function HangingSkeleton() {
  return (
    <span aria-hidden="true" className="relative self-stretch w-10 flex-shrink-0 pointer-events-none hidden lg:block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={withBasePath('/halloween/hanger.svg')}
        alt=""
        width={40}
        height={55}
        className="halloween-sway absolute top-0 left-0"
      />
    </span>
  );
}

/**
 * Starts and stops the Halloween music loop (lib/music.ts). Off until clicked;
 * icon-only in the top bar, or labelled as a menu item.
 */
export function MusicToggle({ className, withLabel = false }: { className: string; withLabel?: boolean }) {
  const playing = useSyncExternalStore(subscribeMusic, isMusicPlaying, () => false);
  const label = playing ? 'Stop spooky music' : 'Play spooky music';
  const Icon = playing ? Music2 : Music;
  return (
    <button
      type="button"
      onClick={() => (playing ? stopMusic() : startMusic())}
      aria-label={label}
      aria-pressed={playing}
      title={label}
      className={`${className} ${playing ? '!text-ink' : ''}`}
    >
      <Icon size={withLabel ? 16 : 15} />
      {withLabel && (playing ? 'Music on' : 'Music off')}
    </button>
  );
}
