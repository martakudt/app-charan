export function normalizeName(s) {
  if (!s || typeof s !== 'string') return ''
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

export function parseSpanishDate(s) {
  if (!s || typeof s !== 'string') return null
  const trimmed = s.trim()
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return null
  const day = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  const year = parseInt(match[3], 10)
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null
  const d = new Date(year, month - 1, day)
  // Reject overflow (e.g. 31/02 -> 03/03)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null
  return d
}

const COL_FECHA = 2
const COL_ACTO = 3
const COL_PRECIO = 4
const COL_PRECIO_TOTAL = 5
const MEMBER_COLS_START = 6
const MEMBER_COLS_END = 20 // inclusive
const REFUERZO_COLS_START = 21
const REFUERZO_COLS_END = 25 // inclusive
const HEADER_ROW_INDEX = 3
const DATA_START_ROW_INDEX = 4

function parseEuro(s) {
  if (s === '' || s == null) return 0
  // Remove euro sign and normalize comma->dot
  const cleaned = String(s).replace(/€/g, '').replace(/\s/g, '').replace(',', '.')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}

function rowIsCompletelyEmpty(row) {
  if (!row || row.length === 0) return true
  return row.every((cell) => cell == null || String(cell).trim() === '')
}

export function parseRows({ values }) {
  const rows = values || []
  const headerRow = rows[HEADER_ROW_INDEX] || []
  const headerColumns = {}
  for (let i = MEMBER_COLS_START; i <= MEMBER_COLS_END; i++) {
    const name = headerRow[i]
    if (name && String(name).trim() !== '') {
      headerColumns[String(name).trim()] = i
    }
  }

  const candidates = []
  let seenAnyData = false
  for (let r = DATA_START_ROW_INDEX; r < rows.length; r++) {
    const row = rows[r] || []
    if (rowIsCompletelyEmpty(row)) {
      if (seenAnyData) break // stop at first fully empty row after data
      continue // skip leading blank rows between header and data
    }

    const fechaStr = row[COL_FECHA]
    const fecha = parseSpanishDate(fechaStr)
    if (!fecha) continue // skip rows with no/bad date

    const nombre = String(row[COL_ACTO] || '').trim()
    const precio = parseEuro(row[COL_PRECIO])
    const precioTotal = (() => {
      const raw = row[COL_PRECIO_TOTAL]
      if (raw === '' || raw == null) return precio
      return parseEuro(raw)
    })()

    const asistenciaPorColumna = {}
    for (const [colName, colIdx] of Object.entries(headerColumns)) {
      const cell = row[colIdx]
      if (cell != null && String(cell).trim().toLowerCase() === 'x') {
        asistenciaPorColumna[colName] = 'voy'
      }
    }

    const refuerzos = []
    for (let i = REFUERZO_COLS_START; i <= REFUERZO_COLS_END; i++) {
      const cell = row[i]
      if (cell != null && String(cell).trim() !== '') {
        refuerzos.push(String(cell).trim())
      }
    }

    const hasAnyContent = nombre !== '' || precio > 0 || Object.keys(asistenciaPorColumna).length > 0 || refuerzos.length > 0
    if (!hasAnyContent) continue

    candidates.push({ fecha, nombre, precio, precioTotal, asistenciaPorColumna, refuerzos })
    seenAnyData = true
  }

  return { candidates, headerColumns }
}

export function resolveUidForColumn(columnName, users) {
  const target = normalizeName(columnName)
  if (!target) return null

  // Compare against claveHistorico with target spaces stripped
  // (e.g. "Pablo C" -> "pabloc" matches claveHistorico "pabloc")
  const targetNoSpaces = target.replace(/\s+/g, '')
  for (const u of users) {
    if (u.claveHistorico && normalizeName(u.claveHistorico) === targetNoSpaces) return u.id
  }
  // First name match against full normalized target.
  // Skip users with claveHistorico — those are matched ONLY by claveHistorico,
  // so an ambiguous column like "Pablo" doesn't accidentally match a user
  // whose dedicated column is "Pablo C" (claveHistorico='pabloc').
  for (const u of users) {
    if (!u.nombre) continue
    if (u.claveHistorico) continue
    const firstName = normalizeName(u.nombre.split(/\s+/)[0])
    if (firstName === target) return u.id
  }
  return null
}
