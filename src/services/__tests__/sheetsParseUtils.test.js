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

import { parseRows } from '../sheetsParseUtils'

describe('parseRows', () => {
  function makeHeaderRows() {
    const header = new Array(26).fill('')
    header[2] = 'FECHA'
    header[3] = 'ACTO'
    header[4] = '€'
    header[5] = '€'
    header[6] = 'Martín'
    header[7] = 'Mónica'
    header[8] = 'René'
    header[9] = 'Dani'
    header[10] = 'Marta'
    header[11] = 'Miguel'
    header[12] = 'Pablo'
    header[13] = 'Nacho'
    header[14] = 'Raúl'
    header[15] = 'Carlos'
    header[16] = 'Samuel'
    header[17] = 'Juan'
    header[18] = 'Pablo C'
    header[19] = 'Pelayo'
    header[20] = 'Jaime'
    header[21] = 'Refuerzo 1'
    header[22] = 'Refuerzo 2'
    header[23] = 'Refuerzo 3'
    header[24] = 'Refuerzo 4'
    header[25] = 'Refuerzo 5'
    return [[], [], [], header, []]
  }

  function makeDataRow({ fecha, acto, precio = '', precioTotal = '', asistencia = {}, refuerzos = [] }) {
    const row = new Array(26).fill('')
    row[2] = fecha
    row[3] = acto
    row[4] = precio
    row[5] = precioTotal
    const colMap = {
      'Martín': 6, 'Mónica': 7, 'René': 8, 'Dani': 9, 'Marta': 10,
      'Miguel': 11, 'Pablo': 12, 'Nacho': 13, 'Raúl': 14, 'Carlos': 15,
      'Samuel': 16, 'Juan': 17, 'Pablo C': 18, 'Pelayo': 19, 'Jaime': 20,
    }
    for (const name of Object.keys(asistencia)) {
      if (colMap[name] !== undefined) row[colMap[name]] = 'x'
    }
    refuerzos.forEach((name, i) => {
      if (i < 5) row[21 + i] = name
    })
    return row
  }

  it('returns empty array when there are no data rows', () => {
    const result = parseRows({ values: makeHeaderRows() })
    expect(result.candidates).toEqual([])
    expect(result.headerColumns).toBeTruthy()
  })

  it('parses one row with attendance and refuerzos', () => {
    const rows = [
      ...makeHeaderRows(),
      makeDataRow({
        fecha: '31/01/2026',
        acto: 'CUMPLEAÑOS FARMACIA',
        precio: '300',
        precioTotal: '300',
        asistencia: { 'Martín': true, 'Mónica': true, 'Pablo C': true },
        refuerzos: ['Luismi', 'Rafa'],
      }),
    ]
    const result = parseRows({ values: rows })
    expect(result.candidates).toHaveLength(1)
    const c = result.candidates[0]
    expect(c.fecha.getDate()).toBe(31)
    expect(c.fecha.getMonth()).toBe(0)
    expect(c.nombre).toBe('CUMPLEAÑOS FARMACIA')
    expect(c.precio).toBe(300)
    expect(c.precioTotal).toBe(300)
    expect(c.asistenciaPorColumna).toEqual({ 'Martín': 'voy', 'Mónica': 'voy', 'Pablo C': 'voy' })
    expect(c.refuerzos).toEqual(['Luismi', 'Rafa'])
  })

  it('uses precio when precioTotal is empty', () => {
    const rows = [
      ...makeHeaderRows(),
      makeDataRow({ fecha: '1/02/2026', acto: 'TEST', precio: '500', precioTotal: '' }),
    ]
    const c = parseRows({ values: rows }).candidates[0]
    expect(c.precio).toBe(500)
    expect(c.precioTotal).toBe(500)
  })

  it('defaults precio to 0 when empty', () => {
    const rows = [
      ...makeHeaderRows(),
      makeDataRow({ fecha: '1/02/2026', acto: 'TEST', precio: '', precioTotal: '' }),
    ]
    const c = parseRows({ values: rows }).candidates[0]
    expect(c.precio).toBe(0)
    expect(c.precioTotal).toBe(0)
  })

  it('skips rows without parseable date', () => {
    const rows = [
      ...makeHeaderRows(),
      makeDataRow({ fecha: '', acto: 'NO DATE', precio: '100' }),
      makeDataRow({ fecha: 'abc', acto: 'BAD DATE', precio: '100' }),
      makeDataRow({ fecha: '5/02/2026', acto: 'GOOD', precio: '100' }),
    ]
    const result = parseRows({ values: rows })
    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0].nombre).toBe('GOOD')
  })

  it('skips rows with date but no nombre, no precio, no asistencia', () => {
    const rows = [
      ...makeHeaderRows(),
      makeDataRow({ fecha: '5/02/2026', acto: '', precio: '', precioTotal: '' }),
    ]
    expect(parseRows({ values: rows }).candidates).toHaveLength(0)
  })

  it('stops at first fully empty row', () => {
    const rows = [
      ...makeHeaderRows(),
      makeDataRow({ fecha: '5/02/2026', acto: 'A', precio: '100' }),
      new Array(26).fill(''),
      makeDataRow({ fecha: '6/02/2026', acto: 'B', precio: '200' }),
    ]
    const result = parseRows({ values: rows })
    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0].nombre).toBe('A')
  })

  it('exposes headerColumns mapping name -> column index for member columns', () => {
    const result = parseRows({ values: makeHeaderRows() })
    expect(result.headerColumns).toMatchObject({
      'Martín': 6,
      'Pablo C': 18,
    })
  })

  it('reports filasConError for rows with date but unparseable price', () => {
    const rows = [
      ...makeHeaderRows(),
      makeDataRow({ fecha: '5/02/2026', acto: 'BAD PRICE', precio: 'no es número', asistencia: { 'Martín': true } }),
    ]
    const result = parseRows({ values: rows })
    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0].precio).toBe(0)
  })
})

import { resolveUidForColumn } from '../sheetsParseUtils'

describe('resolveUidForColumn', () => {
  const users = [
    { id: 'u1', nombre: 'Martín García' },
    { id: 'u2', nombre: 'Mónica López' },
    { id: 'u3', nombre: 'Pablo Cubillas', claveHistorico: 'pabloc' },
    { id: 'u4', nombre: 'Pablo Sánchez' },
    { id: 'u5', nombre: 'René Ruiz', claveHistorico: 'rene' },
    { id: 'u6', nombre: 'Samuel Pérez', claveHistorico: 'samuel' },
  ]

  it('matches by claveHistorico first', () => {
    expect(resolveUidForColumn('Pablo C', users)).toBe('u3')
  })

  it('matches by first name (normalized) if no claveHistorico match', () => {
    expect(resolveUidForColumn('Martín', users)).toBe('u1')
    expect(resolveUidForColumn('Mónica', users)).toBe('u2')
  })

  it('handles tildes consistently', () => {
    expect(resolveUidForColumn('Rene', users)).toBe('u5') // claveHistorico 'rene'
    expect(resolveUidForColumn('Martin', users)).toBe('u1') // first name match
  })

  it('returns null when nothing matches', () => {
    expect(resolveUidForColumn('Titi', users)).toBeNull()
  })

  it('claveHistorico beats first-name match for ambiguous columns', () => {
    expect(resolveUidForColumn('Pablo', users)).toBe('u4')
    expect(resolveUidForColumn('Pablo C', users)).toBe('u3')
  })
})
