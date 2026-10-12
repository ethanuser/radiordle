import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFrom } = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fake.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'fake-key'
  return { mockFrom: vi.fn() }
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}))

import { fetchPlayerStats } from '@/lib/playerStats'

function mockTables(tables: Record<string, { data: unknown; error: unknown }>) {
  mockFrom.mockImplementation((table: string) => {
    const result = tables[table]
    const chain = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      order: vi.fn(() => Promise.resolve(result)),
      then: (resolve: (v: unknown) => unknown) => resolve(result),
    }
    return chain
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchPlayerStats', () => {
  it('rejects malformed hashes without querying', async () => {
    expect(await fetchPlayerStats('bad hash!')).toBeNull()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns null when the player has no history', async () => {
    mockTables({ game_results: { data: [], error: null } })
    expect(await fetchPlayerStats('abc-123')).toBeNull()
  })

  it('calculates stats from results mapped to day numbers', async () => {
    mockTables({
      game_results: {
        data: [
          { puzzle_number: 1, won: true, guess_count: 2, played_at: '2026-01-01T12:00:00Z' },
          { puzzle_number: 2, won: true, guess_count: 3, played_at: '2026-01-02T12:00:00Z' },
          { puzzle_number: 3, won: false, guess_count: 5, played_at: '2026-01-03T12:00:00Z' },
        ],
        error: null,
      },
      puzzle_schedule: {
        data: [
          { day_number: 10, puzzle_id: 'a' },
          { day_number: 11, puzzle_id: 'b' },
          { day_number: 12, puzzle_id: 'c' },
        ],
        error: null,
      },
      puzzles: {
        data: [
          { id: 'a', puzzle_number: 1 },
          { id: 'b', puzzle_number: 2 },
          { id: 'c', puzzle_number: 3 },
        ],
        error: null,
      },
    })

    const stats = await fetchPlayerStats('abc-123')
    expect(stats).not.toBeNull()
    expect(stats!.gamesPlayed).toBe(3)
    expect(stats!.gamesWon).toBe(2)
    expect(stats!.guessDistribution).toEqual({ 2: 1, 3: 1 })
    expect(stats!.maxStreak).toBe(2)
  })
})
