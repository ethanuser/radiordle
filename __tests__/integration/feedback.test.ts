import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockInsert, mockFrom } = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fake.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'fake-key'
  return { mockInsert: vi.fn(), mockFrom: vi.fn() }
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ from: mockFrom })),
}))

import { submitFeedback } from '@/lib/feedback'

beforeEach(() => {
  vi.clearAllMocks()
  mockInsert.mockResolvedValue({ error: null })
  mockFrom.mockReturnValue({ insert: mockInsert })
})

describe('submitFeedback', () => {
  it('inserts a valid submission', async () => {
    const result = await submitFeedback({
      category: 'bug',
      message: '  This is a valid bug report  ',
      pageContext: 'day-5',
      fingerprint: 'hash-1',
    })
    expect(result).toEqual({ ok: true })
    expect(mockFrom).toHaveBeenCalledWith('feedback')
    expect(mockInsert).toHaveBeenCalledWith({
      category: 'bug',
      message: 'This is a valid bug report',
      page_context: 'day-5',
      fingerprint: 'hash-1',
    })
  })

  it.each([
    [{ category: '', message: 'long enough message' }, 'Category and message are required'],
    [{ category: 'nope', message: 'long enough message' }, 'Invalid category'],
    [{ category: 'bug', message: 'short' }, 'Message too short (min 10 characters)'],
    [{ category: 'bug', message: 'x'.repeat(1001) }, 'Message too long (max 1000 characters)'],
  ])('rejects invalid input %#', async (input, error) => {
    expect(await submitFeedback(input)).toEqual({ ok: false, error })
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('reports insert failures', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'denied' } })
    const result = await submitFeedback({ category: 'other', message: 'a perfectly fine message' })
    expect(result).toEqual({ ok: false, error: 'Failed to submit feedback' })
  })
})
