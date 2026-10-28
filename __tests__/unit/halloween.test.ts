import { describe, it, expect } from 'vitest'
import { isHalloweenSeason } from '@/lib/halloween'

describe('isHalloweenSeason', () => {
  it('runs from October 15 to November 1', () => {
    expect(isHalloweenSeason(new Date(2026, 9, 14))).toBe(false)
    expect(isHalloweenSeason(new Date(2026, 9, 15))).toBe(true)
    expect(isHalloweenSeason(new Date(2026, 9, 31))).toBe(true)
    expect(isHalloweenSeason(new Date(2026, 10, 1))).toBe(true)
    expect(isHalloweenSeason(new Date(2026, 10, 2))).toBe(false)
    expect(isHalloweenSeason(new Date(2026, 3, 20))).toBe(false)
  })
})
