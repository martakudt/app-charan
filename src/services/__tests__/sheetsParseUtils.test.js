import { describe, it, expect } from 'vitest'
import { normalizeName } from '../sheetsParseUtils'

describe('normalizeName', () => {
  it('lowercases and removes tildes', () => {
    expect(normalizeName('Martín')).toBe('martin')
    expect(normalizeName('René')).toBe('rene')
    expect(normalizeName('Mónica')).toBe('monica')
  })

  it('trims surrounding whitespace and collapses inner spaces', () => {
    expect(normalizeName('  Pablo   C  ')).toBe('pablo c')
  })

  it('returns empty string for null/undefined/empty input', () => {
    expect(normalizeName(null)).toBe('')
    expect(normalizeName(undefined)).toBe('')
    expect(normalizeName('')).toBe('')
    expect(normalizeName('   ')).toBe('')
  })
})
