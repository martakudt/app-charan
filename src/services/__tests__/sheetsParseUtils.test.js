import { describe, it, expect } from 'vitest'
import { normalizeName, parseSpanishDate } from '../sheetsParseUtils'

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

describe('parseSpanishDate', () => {
  it('parses dd/mm/yyyy', () => {
    const d = parseSpanishDate('31/01/2026')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(0) // enero = 0
    expect(d.getDate()).toBe(31)
  })

  it('parses d/m/yyyy with single-digit day or month', () => {
    const d = parseSpanishDate('7/2/2026')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(1)
    expect(d.getDate()).toBe(7)
  })

  it('trims whitespace', () => {
    const d = parseSpanishDate('  20/02/2026  ')
    expect(d.getDate()).toBe(20)
  })

  it('returns null for unparseable input', () => {
    expect(parseSpanishDate('')).toBeNull()
    expect(parseSpanishDate(null)).toBeNull()
    expect(parseSpanishDate('abc')).toBeNull()
    expect(parseSpanishDate('28/06/20205')).toBeNull() // year must be 4 digits
    expect(parseSpanishDate('32/01/2026')).toBeNull() // invalid day
    expect(parseSpanishDate('15/13/2026')).toBeNull() // invalid month
  })
})
