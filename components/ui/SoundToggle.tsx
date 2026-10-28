'use client';

import { useSyncExternalStore } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled, subscribeSound } from '@/lib/sounds';

/** Whether answer sounds are on; re-renders when any toggle changes it. */
export function useSoundEnabled(): boolean {
  return useSyncExternalStore(subscribeSound, isSoundEnabled, () => true);
}

/**
 * Speaker button that turns the answer sounds on and off: icon-only in the top
 * bar, or with a "Sound on/off" label as a menu item. `className` styles it
 * like its neighbours.
 */
export default function SoundToggle({ className, withLabel = false }: { className: string; withLabel?: boolean }) {
  const on = useSoundEnabled();
  const label = on ? 'Mute sounds' : 'Turn sounds on';
  return (
    <button
      type="button"
      onClick={() => setSoundEnabled(!on)}
      aria-label={label}
      aria-pressed={!on}
      title={label}
      className={className}
    >
      {on ? <Volume2 size={withLabel ? 16 : 15} /> : <VolumeX size={withLabel ? 16 : 15} />}
      {withLabel && (on ? 'Sound on' : 'Sound off')}
    </button>
  );
}
