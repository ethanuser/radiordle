'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getDayNumber } from '@/lib/gameLogic';
import DailyGame from '@/components/DailyGame';

/**
 * Archive puzzle player: /archive/play/?day=N (query param instead of a
 * dynamic route segment, since the site is a static export).
 */
function ArchivePlay() {
  const router = useRouter();
  const params = useSearchParams();
  const dayNumber = parseInt(params.get('day') ?? '', 10);
  const today = getDayNumber();
  const invalid = isNaN(dayNumber) || dayNumber < 0;
  const isTodayOrFuture = !invalid && dayNumber >= today;

  useEffect(() => {
    if (invalid) router.replace('/archive');
    else if (isTodayOrFuture) router.replace('/');
  }, [invalid, isTodayOrFuture, router]);

  if (invalid || isTodayOrFuture) return null;
  return <DailyGame dayNumber={dayNumber} isArchive={true} />;
}

export default function ArchivePlayPage() {
  return (
    <Suspense fallback={null}>
      <ArchivePlay />
    </Suspense>
  );
}
