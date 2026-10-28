import { describe, it, expect } from 'vitest'
import { existsSync } from 'fs'
import path from 'path'
import { SUPPLEMENTAL_CASES } from '@/lib/supplementalCases'
import { buildSession, settingsFromQuery } from '@/lib/session'

const DIAGNOSES = ['Pneumonia', 'Pleural effusion', 'Empyema', 'Lung abscess']

describe('supplemental cases', () => {
  it.each(DIAGNOSES)('%s has at least one X-ray and one CT', (dx) => {
    const labels = SUPPLEMENTAL_CASES.filter((c) => c.answer === dx).map((c) => c.label)
    expect(labels.some((l) => l.endsWith('· X-ray'))).toBe(true)
    expect(labels.some((l) => l.endsWith('· CT'))).toBe(true)
  })

  it('has unique keys and an existing image for every case', () => {
    expect(new Set(SUPPLEMENTAL_CASES.map((c) => c.key)).size).toBe(SUPPLEMENTAL_CASES.length)
    for (const c of SUPPLEMENTAL_CASES) {
      expect(existsSync(path.join(__dirname, '../../public', c.imageUrl)), c.imageUrl).toBe(true)
    }
  })

  it.each(['Pulmonary edema', 'Atelectasis'])('%s has at least two X-rays', (dx) => {
    const labels = SUPPLEMENTAL_CASES.filter((c) => c.answer === dx).map((c) => c.label)
    expect(labels.filter((l) => l.endsWith('· X-ray')).length).toBeGreaterThanOrEqual(2)
  })

  it.each(['Pulmonary fibrosis', 'Emphysema', 'Lung cancer'])('%s has at least two cases', (dx) => {
    expect(SUPPLEMENTAL_CASES.filter((c) => c.answer === dx).length).toBeGreaterThanOrEqual(2)
  })

  it('fills the pulmonary infiltrates session without the library', () => {
    // Link used in the BiCEP pulmonary infiltrate patterns slides (README).
    const query =
      'dx=Pneumonia%3A1&dx=Pulmonary+edema%3A1&dx=Atelectasis%3A1&dx=Pulmonary+fibrosis%3A2&dx=Emphysema%3A2' +
      '&dx=Lung+cancer%3A2&dx=Pleural+effusion%3A0&dx=Lung+abscess%3A0&dx=Sarcoidosis%3A0&dx=Normal%3A0' +
      '&order=random&repeats=0&tries=3&hints=progressive&answer=choice' +
      '&seed=infiltrates&exc=S5%2CS6%2CS7%2CS10%2CS11&hide=1'
    const settings = settingsFromQuery(query)
    const { items, shortfalls } = buildSession(settings, SUPPLEMENTAL_CASES, settings.seed!)
    expect(shortfalls).toEqual([])
    expect(items).toHaveLength(9)
    expect(settings.diagnoses).toHaveLength(10)
    for (const item of items) expect(settings.exclude).not.toContain(item.case.key)
  })

  it('credits every case and gives four findings', () => {
    for (const c of SUPPLEMENTAL_CASES) {
      expect(c.citation).toBeTruthy()
      expect(c.hints).toHaveLength(4)
    }
  })
})
