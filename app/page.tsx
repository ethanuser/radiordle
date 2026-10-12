'use client';

import { useState } from 'react';
import { getDayNumber } from '@/lib/gameLogic';
import DailyGame from '@/components/DailyGame';

export default function Home() {
  // Computed on the client so the static export always shows today's puzzle
  const [dayNumber] = useState(() => getDayNumber());
  return <DailyGame dayNumber={dayNumber} isArchive={false} />;
}
