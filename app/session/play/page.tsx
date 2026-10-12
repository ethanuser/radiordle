import type { Metadata } from 'next';
import { Suspense } from 'react';
import PlainBackground from '@/components/PlainBackground';
import TopBar from '@/components/TopBar';
import SessionPlayer from '@/components/session/SessionPlayer';

export const metadata: Metadata = {
  title: 'Game Session',
  description: 'A Radiordle teaching session.',
};

export default function SessionPlayPage() {
  return (
    <div className="min-h-screen-safe relative" style={{ minHeight: 'var(--full-vh)' }}>
      <PlainBackground />
      <div className="relative z-10 flex flex-col" style={{ minHeight: 'var(--full-vh)' }}>
        <TopBar />
        <Suspense fallback={null}>
          <SessionPlayer />
        </Suspense>
      </div>
    </div>
  );
}
