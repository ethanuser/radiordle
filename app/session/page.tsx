import type { Metadata } from 'next';
import { Suspense } from 'react';
import PlainBackground from '@/components/PlainBackground';
import TopBar from '@/components/TopBar';
import SessionSetup from '@/components/session/SessionSetup';

export const metadata: Metadata = {
  title: 'Game Session',
  description: 'Set up a teaching session: choose diagnoses, case counts, order and repeats, and share it as a link.',
};

export default function SessionSetupPage() {
  return (
    <div className="min-h-screen-safe relative" style={{ minHeight: 'var(--full-vh)' }}>
      <PlainBackground />
      <div className="relative z-10 flex flex-col" style={{ minHeight: 'var(--full-vh)' }}>
        <TopBar />
        <Suspense fallback={null}>
          <SessionSetup />
        </Suspense>
      </div>
    </div>
  );
}
