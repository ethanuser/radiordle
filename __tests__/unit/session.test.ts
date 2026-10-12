import { describe, it, expect } from 'vitest'
import {
  buildSession,
  caseMatchesDiagnosis,
  casesForDiagnosis,
  createRng,
  DEFAULT_SETTINGS,
  gradeGuess,
  puzzleToSessionCase,
  settingsFromQuery,
  settingsToQuery,
  type SessionCase,
  type SessionSettings,
} from '@/lib/session'
import type { Puzzle } from '@/lib/supabase'

function makeCase(id: string, answer: string, overrides: Partial<SessionCase> = {}): SessionCase {
  return {
    id,
    key: id.toUpperCase(),
    source: 'library',
    label: id,
    imageUrl: `https://example.com/${id}.png`,
    annotatedImageUrl: null,
    answer,
    hints: [],
    description: null,
    citation: null,
    learnLink: null,
    released: true,
    ...overrides,
  }
}

const LIBRARY: SessionCase[] = [
  makeCase('p1', 'Pneumonia'),
  makeCase('p2', 'Pneumonia'),
  makeCase('p3', 'Lobar pneumonia'),
  makeCase('e1', 'Pleural effusion'),
  makeCase('m1', 'Empyema'),
  makeCase('a1', 'Lung abscess'),
  makeCase('b1', 'Brain abscess'),
  makeCase('u1', 'Empyema', { released: false }),
  makeCase('s1', 'Lung abscess', { source: 'supplemental' }),
]

function settings(overrides: Partial<SessionSettings> = {}): SessionSettings {
  return { ...DEFAULT_SETTINGS, diagnoses: DEFAULT_SETTINGS.diagnoses.map((d) => ({ ...d })), ...overrides }
}

describe('settings URL round-trip', () => {
  it('round-trips every setting through the query string', () => {
    const s = settings({
      diagnoses: [
        { name: 'Pneumonia', count: 3 },
        { name: 'Lung abscess', count: 0 },
      ],
      order: 'interleaved',
      repeats: true,
      tries: 4,
      hints: 'upfront',
      answer: 'typed',
      seed: 'abc123',
      related: true,
      unreleased: true,
      supplemental: false,
      include: ['L80', 'S2'],
      exclude: ['L10'],
      hideContents: false,
    })
    expect(settingsFromQuery(settingsToQuery(s))).toEqual(s)
  })

  it('encodes diagnoses as readable repeated dx params', () => {
    const q = settingsToQuery(settings({ diagnoses: [{ name: 'Pleural effusion', count: 2 }] }))
    expect(new URLSearchParams(q).getAll('dx')).toEqual(['Pleural effusion:2'])
  })

  it('defaults to typed answers with hidden contents', () => {
    const s = settingsFromQuery('')
    expect(s.answer).toBe('typed')
    expect(s.hideContents).toBe(true)
    expect(s.include).toEqual([])
    expect(s.exclude).toEqual([])
  })

  it('ignores malformed case keys', () => {
    expect(settingsFromQuery('inc=L80,bogus,s2,L80&exc=X1').include).toEqual(['L80', 'S2'])
    expect(settingsFromQuery('exc=X1').exclude).toEqual([])
  })

  it('falls back to the four default diagnoses when no dx is given', () => {
    const s = settingsFromQuery('')
    expect(s.diagnoses.map((d) => d.name)).toEqual(['Pneumonia', 'Pleural effusion', 'Empyema', 'Lung abscess'])
    expect(s.diagnoses.every((d) => d.count === 1)).toBe(true)
  })

  it('clamps and sanitizes invalid values', () => {
    const s = settingsFromQuery('dx=Pneumonia:99&dx=pneumonia:2&dx=:3&tries=9&order=bogus&hints=x&seed=bad seed!')
    expect(s.diagnoses).toEqual([{ name: 'Pneumonia', count: 20 }])
    expect(s.tries).toBe(5)
    expect(s.order).toBe('random')
    expect(s.hints).toBe('progressive')
    expect(s.seed).toBeNull()
  })

  it('keeps colons inside diagnosis names', () => {
    const s = settingsFromQuery('dx=' + encodeURIComponent('Type 2: something:4'))
    expect(s.diagnoses).toEqual([{ name: 'Type 2: something', count: 4 }])
  })
})

describe('caseMatchesDiagnosis', () => {
  it('matches case-insensitively and ignores punctuation', () => {
    expect(caseMatchesDiagnosis('Pleural Effusion', 'pleural effusion')).toBe(true)
    expect(caseMatchesDiagnosis('Lung-abscess', 'Lung abscess')).toBe(true)
  })

  it('does not match subtypes unless related is on', () => {
    expect(caseMatchesDiagnosis('Lobar pneumonia', 'Pneumonia')).toBe(false)
    expect(caseMatchesDiagnosis('Lobar pneumonia', 'Pneumonia', { related: true })).toBe(true)
  })

  it('requires every diagnosis word for related matches', () => {
    expect(caseMatchesDiagnosis('Brain abscess', 'Lung abscess', { related: true })).toBe(false)
  })

  it('matches through condition aliases', () => {
    expect(caseMatchesDiagnosis('Pyothorax', 'Empyema', { aliases: ['Pyothorax'] })).toBe(true)
  })
})

describe('casesForDiagnosis', () => {
  const base = { related: false, unreleased: false, supplemental: true }

  it('excludes unreleased library puzzles by default', () => {
    expect(casesForDiagnosis(LIBRARY, 'Empyema', base).map((c) => c.id)).toEqual(['m1'])
    expect(casesForDiagnosis(LIBRARY, 'Empyema', { ...base, unreleased: true }).map((c) => c.id)).toEqual(['m1', 'u1'])
  })

  it('can exclude supplemental cases', () => {
    expect(casesForDiagnosis(LIBRARY, 'Lung abscess', { ...base, supplemental: false }).map((c) => c.id)).toEqual(['a1'])
  })
})

describe('include / exclude overrides', () => {
  const base = { related: false, unreleased: false, supplemental: true }

  it('excluded cases are dropped even when the filters allow them', () => {
    expect(casesForDiagnosis(LIBRARY, 'Pneumonia', { ...base, exclude: ['P1'] }).map((c) => c.id)).toEqual(['p2'])
  })

  it('included cases are used even when the filters would skip them', () => {
    // u1 is unreleased; p3 is a related answer
    expect(casesForDiagnosis(LIBRARY, 'Empyema', { ...base, include: ['U1'] }).map((c) => c.id)).toEqual(['m1', 'u1'])
    expect(casesForDiagnosis(LIBRARY, 'Pneumonia', { ...base, include: ['P3'] }).map((c) => c.id)).toEqual([
      'p1',
      'p2',
      'p3',
    ])
  })

  it('an include never pulls in a case from an unrelated diagnosis', () => {
    expect(casesForDiagnosis(LIBRARY, 'Empyema', { ...base, include: ['A1'] }).map((c) => c.id)).toEqual(['m1'])
  })

  it('buildSession honours the overrides', () => {
    const s = settings({ diagnoses: [{ name: 'Pneumonia', count: 5 }], exclude: ['P1', 'P2'], include: ['P3'] })
    expect(buildSession(s, LIBRARY, 'seed').items.map((i) => i.case.id)).toEqual(['p3'])
  })
})

describe('buildSession', () => {
  it('without repeats, uses each case once (one per diagnosis here → 4 cases)', () => {
    const { items, shortfalls } = buildSession(settings(), LIBRARY, 'seed')
    expect(items).toHaveLength(4)
    expect(new Set(items.map((i) => i.case.id)).size).toBe(4)
    expect(shortfalls).toEqual([])
  })

  it('without repeats, caps a diagnosis at the cases available and reports the shortfall', () => {
    const s = settings({ diagnoses: [{ name: 'Empyema', count: 3 }] })
    const { items, shortfalls } = buildSession(s, LIBRARY, 'seed')
    expect(items).toHaveLength(1)
    expect(shortfalls).toEqual([{ diagnosis: 'Empyema', requested: 3, available: 1 }])
  })

  it('with repeats, reuses cases to reach the requested count', () => {
    const s = settings({ diagnoses: [{ name: 'Pneumonia', count: 5 }], repeats: true })
    const { items, shortfalls } = buildSession(s, LIBRARY, 'seed')
    expect(items).toHaveLength(5)
    expect(new Set(items.map((i) => i.case.id))).toEqual(new Set(['p1', 'p2']))
    expect(shortfalls).toEqual([])
  })

  it('with repeats, cycles through every case before reusing one', () => {
    const s = settings({ diagnoses: [{ name: 'Pneumonia', count: 4 }], repeats: true, order: 'grouped' })
    const { items } = buildSession(s, LIBRARY, 'xyz')
    expect(new Set(items.slice(0, 2).map((i) => i.case.id)).size).toBe(2)
    expect(new Set(items.slice(2, 4).map((i) => i.case.id)).size).toBe(2)
  })

  it('skips diagnoses with a count of 0 (choice-only)', () => {
    const s = settings({
      diagnoses: [
        { name: 'Pneumonia', count: 1 },
        { name: 'Empyema', count: 0 },
      ],
    })
    expect(buildSession(s, LIBRARY, 'seed').items.map((i) => i.diagnosis)).toEqual(['Pneumonia'])
  })

  it('grouped order follows the diagnosis list', () => {
    const s = settings({
      order: 'grouped',
      diagnoses: [
        { name: 'Lung abscess', count: 2 },
        { name: 'Pneumonia', count: 2 },
      ],
    })
    expect(buildSession(s, LIBRARY, 'seed').items.map((i) => i.diagnosis)).toEqual([
      'Lung abscess',
      'Lung abscess',
      'Pneumonia',
      'Pneumonia',
    ])
  })

  it('interleaved order alternates diagnoses', () => {
    const s = settings({
      order: 'interleaved',
      diagnoses: [
        { name: 'Pneumonia', count: 2 },
        { name: 'Lung abscess', count: 2 },
      ],
    })
    expect(buildSession(s, LIBRARY, 'seed').items.map((i) => i.diagnosis)).toEqual([
      'Pneumonia',
      'Lung abscess',
      'Pneumonia',
      'Lung abscess',
    ])
  })

  it('is deterministic for a given seed', () => {
    const s = settings({ diagnoses: [{ name: 'Pneumonia', count: 6 }], repeats: true })
    const a = buildSession(s, LIBRARY, 'shared').items.map((i) => i.case.id)
    const b = buildSession(s, LIBRARY, 'shared').items.map((i) => i.case.id)
    expect(a).toEqual(b)
  })

  it('never draws the same case for two diagnoses without repeats', () => {
    const s = settings({
      related: true,
      diagnoses: [
        { name: 'Pneumonia', count: 3 },
        { name: 'Lobar pneumonia', count: 1 },
      ],
    })
    const { items } = buildSession(s, LIBRARY, 'seed')
    expect(new Set(items.map((i) => i.case.id)).size).toBe(items.length)
  })
})

describe('gradeGuess', () => {
  const item = { diagnosis: 'Pneumonia', case: makeCase('p3', 'Lobar pneumonia') }

  it('accepts the session diagnosis the case was drawn for', () => {
    expect(gradeGuess('Pneumonia', item)).toBe('correct')
  })

  it('accepts the case’s own answer', () => {
    expect(gradeGuess('Lobar pneumonia', item)).toBe('correct')
  })

  it('rejects other diagnoses', () => {
    expect(gradeGuess('Empyema', item)).toBe('incorrect')
  })
})

describe('createRng', () => {
  it('produces numbers in [0, 1)', () => {
    const rng = createRng('x')
    for (let i = 0; i < 100; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('puzzleToSessionCase', () => {
  const puzzle: Puzzle = {
    id: 'uuid-1',
    puzzle_number: 42,
    image_url: 'https://example.com/a.png',
    answer: 'Empyema',
    difficulty: 'medium',
    is_active: true,
    status: 'active',
    last_shown_day: 10,
    hint_1: 'First',
    hint_2: null,
    hint_3: 'Third',
    hint_4: null,
  }

  it('marks puzzles shown on or before today as released', () => {
    expect(puzzleToSessionCase(puzzle, 10).released).toBe(true)
    expect(puzzleToSessionCase(puzzle, 9).released).toBe(false)
    expect(puzzleToSessionCase({ ...puzzle, last_shown_day: -1 }, 100).released).toBe(false)
    expect(puzzleToSessionCase({ ...puzzle, last_shown_day: -1, status: 'retired' }, 0).released).toBe(true)
  })

  it('collects non-empty hints in order', () => {
    expect(puzzleToSessionCase(puzzle, 10).hints).toEqual(['First', 'Third'])
  })
})
