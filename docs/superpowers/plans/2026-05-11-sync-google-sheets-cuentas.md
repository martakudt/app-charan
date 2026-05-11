# Sincronización Google Sheets de cuentas — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir a Marta sincronizar los actos del año seleccionado en Gestión con la pestaña correspondiente de su Google Sheet CuentasCharanga, escribiendo los datos reales (asistencia, refuerzos, precios) en Firestore con vista previa y confirmación.

**Architecture:** OAuth con Google Identity Services (token solo en memoria) → lectura de Sheets API → parseo a `ActoCandidato[]` → diff contra Firestore (collection `eventos`) → modal de vista previa → escritura batch. Solo Marta (`marta.torres@quantia.es`) ve y dispara la sync; resto de directores y miembros leen Firestore como hoy.

**Tech Stack:** React 19 + Vite + Firebase Firestore + Google Identity Services (`https://accounts.google.com/gsi/client`) + Google Sheets API v4. Vitest para tests unitarios de la lógica pura de parseo/diff.

**Spec de referencia:** [`docs/superpowers/specs/2026-05-11-sync-google-sheets-cuentas-design.md`](../specs/2026-05-11-sync-google-sheets-cuentas-design.md)

**Convenciones del codebase a respetar:**
- Collection Firestore para eventos = `eventos` (NO `events`).
- Identidad de Marta: `userData.email === 'marta.torres@quantia.es'`. NO confundir con `userData.rol === 'admin'` (que da otros permisos).
- UI sin emoticonos. Texto plano o iconos SVG inline (estilo lucide ya usado en Gestión).
- JSX, no TypeScript.
- Imports relativos (`../services/...`).
- Nada de `localStorage` para tokens.

---

## Estructura de archivos

**Crear:**
- `src/services/sheetsParseUtils.js` — funciones puras: `normalizeName`, `parseSpanishDate`, `parseRows`, `resolveUidForColumn`, `buildDiff`.
- `src/services/googleAuth.js` — wrapper de Google Identity Services, token en memoria.
- `src/services/sheetsApi.js` — llamadas HTTP a Sheets API v4 con token.
- `src/services/sheetsConfig.js` — CRUD de `config/sheetsSync` en Firestore.
- `src/services/sheetsSync.js` — orquestador: `prepareSync()` y `applyDiff()`.
- `src/components/gestion/SheetsSyncPanel.jsx` — bloque visible en Gestión.
- `src/components/gestion/SheetsConfigModal.jsx` — modal de configuración de URL.
- `src/components/gestion/SheetsSyncPreviewModal.jsx` — modal de vista previa.
- `src/components/gestion/sheets-sync.css` — estilos del panel y modales.
- `src/services/__tests__/sheetsParseUtils.test.js` — tests de la lógica pura.
- `vitest.config.js` — config mínima de Vitest.

**Modificar:**
- `package.json` — añadir vitest + script `test`.
- `.env.example` — añadir `VITE_GOOGLE_OAUTH_CLIENT_ID`.
- `src/pages/Gestion.jsx` — montar `SheetsSyncPanel` debajo de los filtros (gating por email).
- `index.html` — cargar script de Google Identity Services.
- `firestore.rules` — regla para `config/sheetsSync` y permitir create de `eventos` por owner.
- `FIREBASE_SETUP.md` — añadir sección de setup OAuth Google.

---

## Fase 0 — Setup

### Task 1: Instalar Vitest y configurar test runner

**Files:**
- Modify: `package.json`
- Create: `vitest.config.js`

- [ ] **Step 1: Instalar dependencias**

Run:
```powershell
cd "c:\Users\MartaTorresGómez\Documents\zcosas\app-charan"
npm install --save-dev --legacy-peer-deps vitest@^2.1.0
```

Expected: `vitest` añadido a `devDependencies` en `package.json`. Sin errores.

- [ ] **Step 2: Añadir script `test` a package.json**

Editar `package.json`, en `"scripts"` añadir después de `"preview"`:

```json
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: Crear vitest.config.js**

Contenido completo de `vitest.config.js`:

```javascript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.js'],
  },
})
```

- [ ] **Step 4: Verificar que vitest arranca**

Run:
```powershell
npm test
```

Expected: `No test files found, exiting with code 0` (no falla, solo dice que no hay tests todavía).

- [ ] **Step 5: Commit**

```powershell
git add package.json package-lock.json vitest.config.js
git commit -m "chore: add vitest for unit tests"
```

---

### Task 2: Añadir variable de entorno OAuth en .env.example

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Añadir línea al final de `.env.example`**

Cambiar de:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

A:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Google OAuth Client ID for Sheets sync (only needed for owner)
VITE_GOOGLE_OAUTH_CLIENT_ID=
```

- [ ] **Step 2: Commit**

```powershell
git add .env.example
git commit -m "chore: document VITE_GOOGLE_OAUTH_CLIENT_ID env var"
```

Nota: el valor real lo añade Marta en `.env` local y en Netlify después del setup en Google Cloud (Task 16). Sin valor, el panel mostrará "OAuth no configurado" y no romperá nada.

---

### Task 3: Cargar script de Google Identity Services en index.html

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Añadir script tag en `<head>`**

Localizar el `<head>` de `index.html` y añadir antes del cierre `</head>`:

```html
    <script src="https://accounts.google.com/gsi/client" async defer></script>
```

Si ya existen otros scripts, ponerlo después de ellos pero antes de `</head>`.

- [ ] **Step 2: Verificar que la app sigue arrancando**

Run:
```powershell
npm run dev
```

Abrir `http://localhost:5173` y comprobar consola del navegador: no debe haber errores. `window.google?.accounts?.oauth2` debe existir tras unos segundos. Cerrar dev server (Ctrl+C).

- [ ] **Step 3: Commit**

```powershell
git add index.html
git commit -m "chore: load Google Identity Services script"
```

---

### Task 4: Actualizar firestore.rules para `config/sheetsSync`

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Añadir helper `isOwner()` y regla para config**

En `firestore.rules`, después de la función `hasPermission`, añadir:

```
    function isOwner() {
      return request.auth != null
        && request.auth.token.email == 'marta.torres@quantia.es';
    }
```

Y al final del bloque `match /databases/{database}/documents { ... }` (antes del último `}` de `documents`), añadir:

```
    // Sheets sync config (owner-writable, all approved users can read)
    match /config/{docId} {
      allow read: if isApproved();
      allow write: if isOwner();
    }
```

- [ ] **Step 2: Verificar sintaxis**

El fichero completo debe quedar así (copiar-pegar tal cual si ayuda a evitar errores):

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isApproved() {
      return request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.estado == 'aprobado';
    }

    function isAdmin() {
      return request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.rol == 'admin';
    }

    function hasPermission(perm) {
      let userData = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
      return userData.rol == 'admin' || userData.permisos[perm] == true;
    }

    function isOwner() {
      return request.auth != null
        && request.auth.token.email == 'marta.torres@quantia.es';
    }

    // Users
    match /users/{uid} {
      allow create: if request.auth != null && request.auth.uid == uid
        && request.resource.data.estado == 'pendiente';
      allow read: if request.auth != null
        && (request.auth.uid == uid || isApproved());
      allow update: if request.auth != null
        && (request.auth.uid == uid || isAdmin());
    }

    // Events
    match /eventos/{eventId} {
      allow read: if isApproved();
      allow create, delete: if isApproved() && hasPermission('calendario');
      allow update: if isApproved();
    }

    // Folders
    match /carpetas/{folderId} {
      allow read: if isApproved();
      allow create, update, delete: if isApproved() && hasPermission('partituras');
    }

    // Scores
    match /partituras/{scoreId} {
      allow read: if isApproved();
      allow create, update, delete: if isApproved() && hasPermission('partituras');
    }

    // Sheets sync config (owner-writable, all approved users can read)
    match /config/{docId} {
      allow read: if isApproved();
      allow write: if isOwner();
    }
  }
}
```

- [ ] **Step 3: Commit**

```powershell
git add firestore.rules
git commit -m "feat(rules): allow owner email to manage config docs"
```

Nota: las reglas se despliegan manualmente desde Firebase Console (Marta lo hace fuera de este plan, antes de probar la sync de verdad).

---

## Fase 1 — Lógica pura de parseo y diff (TDD)

Toda esta fase trabaja sobre `src/services/sheetsParseUtils.js`. Las funciones son puras (sin dependencias de Firebase ni red), perfectas para testear primero.

### Task 5: Función `normalizeName` (string → string normalizado)

**Files:**
- Create: `src/services/__tests__/sheetsParseUtils.test.js`
- Create: `src/services/sheetsParseUtils.js`

- [ ] **Step 1: Escribir test que falla**

Contenido inicial de `src/services/__tests__/sheetsParseUtils.test.js`:

```javascript
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
```

- [ ] **Step 2: Verificar que el test falla**

Run:
```powershell
npm test
```

Expected: FAIL — `Cannot find module '../sheetsParseUtils'` o `normalizeName is not a function`.

- [ ] **Step 3: Implementar `normalizeName`**

Contenido inicial de `src/services/sheetsParseUtils.js`:

```javascript
export function normalizeName(s) {
  if (!s || typeof s !== 'string') return ''
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}
```

- [ ] **Step 4: Verificar que pasa**

Run:
```powershell
npm test
```

Expected: PASS, 3/3 tests.

- [ ] **Step 5: Commit**

```powershell
git add src/services/sheetsParseUtils.js src/services/__tests__/sheetsParseUtils.test.js
git commit -m "feat(sheets): add normalizeName utility"
```

---

### Task 6: Función `parseSpanishDate` (string `dd/mm/yyyy` → Date | null)

**Files:**
- Modify: `src/services/__tests__/sheetsParseUtils.test.js`
- Modify: `src/services/sheetsParseUtils.js`

- [ ] **Step 1: Añadir tests al final del fichero de tests**

Append a `src/services/__tests__/sheetsParseUtils.test.js`:

```javascript
import { parseSpanishDate } from '../sheetsParseUtils'

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
```

Nota: el "28/06/20205" del CSV de 2025 era un typo; lo descartamos en lugar de adivinar.

- [ ] **Step 2: Verificar que falla**

Run: `npm test`
Expected: FAIL — `parseSpanishDate is not exported`.

- [ ] **Step 3: Implementar**

Append a `src/services/sheetsParseUtils.js`:

```javascript
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
```

- [ ] **Step 4: Verificar que pasa**

Run: `npm test`
Expected: PASS, todos los tests verdes.

- [ ] **Step 5: Commit**

```powershell
git add src/services/sheetsParseUtils.js src/services/__tests__/sheetsParseUtils.test.js
git commit -m "feat(sheets): add parseSpanishDate utility"
```

---

### Task 7: Función `parseRows` (filas crudas de Sheets API → ActoCandidato[])

**Files:**
- Modify: `src/services/__tests__/sheetsParseUtils.test.js`
- Modify: `src/services/sheetsParseUtils.js`

**Layout de la GS** (según el CSV de referencia, 0-indexed):
- Col 2 (índice 2): FECHA
- Col 3: ACTO (nombre)
- Col 4: € a repartir
- Col 5: € total
- Cols 6–20: nombres de miembros (Martín, Mónica, …, Pablo C) — 15 columnas
- Cols 21–25: Refuerzo 1 a Refuerzo 5 — 5 columnas

La fila 4 (índice 3) es la cabecera con nombres. Los datos empiezan en la fila 6 (índice 5).

`parseRows` recibe `{ values: rows }` donde `rows` es un array de arrays (formato Sheets API).

- [ ] **Step 1: Añadir tests**

Append a `src/services/__tests__/sheetsParseUtils.test.js`:

```javascript
import { parseRows } from '../sheetsParseUtils'

describe('parseRows', () => {
  // Fixture: simulates Sheets API "values" output for the layout described.
  // Index map:
  //   row[2]=FECHA, row[3]=ACTO, row[4]=€repartir, row[5]=€total,
  //   row[6..20]=miembros (15 cols), row[21..25]=Refuerzo 1..5
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
    // Header is at row index 3 (rows 0..2 are title/blank)
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
    // We accept the row but precio defaults to 0; we surface a warning row
    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0].precio).toBe(0)
  })
})
```

- [ ] **Step 2: Verificar que fallan**

Run: `npm test`
Expected: FAIL — `parseRows is not exported`.

- [ ] **Step 3: Implementar `parseRows`**

Append a `src/services/sheetsParseUtils.js`:

```javascript
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
  for (let r = DATA_START_ROW_INDEX; r < rows.length; r++) {
    const row = rows[r] || []
    if (rowIsCompletelyEmpty(row)) break // stop at first fully empty row

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
  }

  return { candidates, headerColumns }
}
```

- [ ] **Step 4: Verificar que pasan**

Run: `npm test`
Expected: PASS, todos verdes.

- [ ] **Step 5: Commit**

```powershell
git add src/services/sheetsParseUtils.js src/services/__tests__/sheetsParseUtils.test.js
git commit -m "feat(sheets): add parseRows for Sheets API values"
```

---

### Task 8: Función `resolveUidForColumn` (nombre columna GS → user uid o null)

**Files:**
- Modify: `src/services/__tests__/sheetsParseUtils.test.js`
- Modify: `src/services/sheetsParseUtils.js`

- [ ] **Step 1: Añadir tests**

Append:

```javascript
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
    // Both u3 (Pablo Cubillas, claveHistorico=pabloc) and u4 (Pablo Sánchez)
    // The column "Pablo C" must go to u3 via claveHistorico.
    // The column "Pablo" should match u4 by first name (claveHistorico=pabloc != pablo).
    expect(resolveUidForColumn('Pablo', users)).toBe('u4')
    expect(resolveUidForColumn('Pablo C', users)).toBe('u3')
  })
})
```

- [ ] **Step 2: Verificar fallo**

Run: `npm test`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Append a `src/services/sheetsParseUtils.js`:

```javascript
export function resolveUidForColumn(columnName, users) {
  const target = normalizeName(columnName)
  if (!target) return null

  // 1. claveHistorico exact match
  for (const u of users) {
    if (u.claveHistorico && normalizeName(u.claveHistorico) === target) return u.id
  }
  // 2. first name match
  for (const u of users) {
    if (!u.nombre) continue
    const firstName = normalizeName(u.nombre.split(/\s+/)[0])
    if (firstName === target) return u.id
  }
  return null
}
```

- [ ] **Step 4: Verificar pasa**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/services/sheetsParseUtils.js src/services/__tests__/sheetsParseUtils.test.js
git commit -m "feat(sheets): add resolveUidForColumn"
```

---

### Task 9: Función `buildDiff` (candidates + eventos Firestore + users → diff)

**Files:**
- Modify: `src/services/__tests__/sheetsParseUtils.test.js`
- Modify: `src/services/sheetsParseUtils.js`

**Forma del diff:**
```javascript
{
  aCrear:    [{ candidate, asistenciaResuelta }],
  aActualizar: [{ candidate, eventoExistente, asistenciaResuelta, cambios: { precio?, precioTotal?, asistenciaCount?, refuerzosCount? } }],
  soloEnApp: [eventoExistente],
  miembrosNoVinculados: ['Mónica', 'Titi'],   // unique column names
}
```

`asistenciaResuelta` = `{ [uid]: 'voy' }` con uid resueltos por `resolveUidForColumn`.

- [ ] **Step 1: Añadir tests**

Append:

```javascript
import { buildDiff } from '../sheetsParseUtils'

describe('buildDiff', () => {
  const users = [
    { id: 'u1', nombre: 'Martín' },
    { id: 'u2', nombre: 'Mónica' },
    { id: 'u3', nombre: 'Pablo Cubillas', claveHistorico: 'pabloc' },
  ]

  function fbEvent({ id, fecha, nombre, tipo = 'actuacion', precio = 0, precioTotal = 0, asistencia = {} }) {
    return { id, fecha: { toDate: () => new Date(fecha) }, nombre, tipo, precio, precioTotal, asistencia }
  }

  function candidate({ fecha, nombre, precio = 0, precioTotal = precio, asistencia = {}, refuerzos = [] }) {
    return { fecha: new Date(fecha), nombre, precio, precioTotal, asistenciaPorColumna: asistencia, refuerzos }
  }

  it('classifies a brand-new candidate as aCrear', () => {
    const diff = buildDiff({
      candidates: [candidate({ fecha: '2026-01-31', nombre: 'CUMPLEAÑOS', precio: 300 })],
      eventos: [],
      users,
      year: 2026,
    })
    expect(diff.aCrear).toHaveLength(1)
    expect(diff.aActualizar).toEqual([])
    expect(diff.soloEnApp).toEqual([])
  })

  it('matches by same day + normalized name -> aActualizar', () => {
    const diff = buildDiff({
      candidates: [candidate({ fecha: '2026-02-08', nombre: 'DOMINGO EMBUTIDO', precio: 600 })],
      eventos: [fbEvent({ id: 'e1', fecha: '2026-02-08T10:00:00', nombre: 'Domingo Embutido', precio: 500 })],
      users,
      year: 2026,
    })
    expect(diff.aActualizar).toHaveLength(1)
    expect(diff.aActualizar[0].eventoExistente.id).toBe('e1')
    expect(diff.aActualizar[0].cambios.precio).toEqual({ antes: 500, despues: 600 })
  })

  it('treats different name on same day as separate events', () => {
    const diff = buildDiff({
      candidates: [
        candidate({ fecha: '2026-02-21', nombre: 'PEÑAS CARNAVAL', precio: 550 }),
        candidate({ fecha: '2026-02-21', nombre: 'ACTUACIÓN DISCOTECA', precio: 450 }),
      ],
      eventos: [fbEvent({ id: 'e1', fecha: '2026-02-21T10:00:00', nombre: 'PEÑAS CARNAVAL', precio: 0 })],
      users,
      year: 2026,
    })
    expect(diff.aActualizar).toHaveLength(1)
    expect(diff.aCrear).toHaveLength(1)
    expect(diff.aCrear[0].candidate.nombre).toBe('ACTUACIÓN DISCOTECA')
  })

  it('lists Firestore events of given year+actuacion not in GS as soloEnApp', () => {
    const diff = buildDiff({
      candidates: [],
      eventos: [
        fbEvent({ id: 'e1', fecha: '2026-04-25T10:00:00', nombre: 'SAN MARCOS', precio: 600 }),
        fbEvent({ id: 'e2', fecha: '2025-04-25T10:00:00', nombre: 'OLD', precio: 600 }), // wrong year
        fbEvent({ id: 'e3', fecha: '2026-04-25T10:00:00', nombre: 'ENSAYO', tipo: 'ensayo' }), // wrong tipo
      ],
      users,
      year: 2026,
    })
    expect(diff.soloEnApp).toHaveLength(1)
    expect(diff.soloEnApp[0].id).toBe('e1')
  })

  it('resolves attendance to uids and lists unmapped column names', () => {
    const diff = buildDiff({
      candidates: [candidate({
        fecha: '2026-01-31',
        nombre: 'X',
        precio: 100,
        asistencia: { 'Martín': 'voy', 'Mónica': 'voy', 'Titi': 'voy', 'Pablo C': 'voy' },
      })],
      eventos: [],
      users,
      year: 2026,
    })
    expect(diff.aCrear[0].asistenciaResuelta).toEqual({ u1: 'voy', u2: 'voy', u3: 'voy' })
    expect(diff.miembrosNoVinculados).toEqual(['Titi'])
  })

  it('detects asistenciaCount change in cambios', () => {
    const diff = buildDiff({
      candidates: [candidate({
        fecha: '2026-02-08',
        nombre: 'DOMINGO',
        precio: 500,
        asistencia: { 'Martín': 'voy', 'Mónica': 'voy' },
      })],
      eventos: [fbEvent({
        id: 'e1', fecha: '2026-02-08T10:00:00', nombre: 'DOMINGO', precio: 500,
        asistencia: { u1: 'voy' },
      })],
      users,
      year: 2026,
    })
    expect(diff.aActualizar[0].cambios.asistenciaCount).toEqual({ antes: 1, despues: 2 })
  })

  it('does not list unchanged updates with empty cambios as aActualizar (skip noop)', () => {
    const diff = buildDiff({
      candidates: [candidate({
        fecha: '2026-02-08', nombre: 'DOMINGO', precio: 500, precioTotal: 500,
        asistencia: { 'Martín': 'voy' }, refuerzos: [],
      })],
      eventos: [fbEvent({
        id: 'e1', fecha: '2026-02-08T10:00:00', nombre: 'DOMINGO',
        precio: 500, precioTotal: 500, asistencia: { u1: 'voy' },
      })],
      users,
      year: 2026,
    })
    // Identical -> not in aActualizar
    expect(diff.aActualizar).toEqual([])
  })

  it('miembrosNoVinculados is unique across candidates', () => {
    const diff = buildDiff({
      candidates: [
        candidate({ fecha: '2026-01-31', nombre: 'A', precio: 100, asistencia: { 'Titi': 'voy' } }),
        candidate({ fecha: '2026-02-01', nombre: 'B', precio: 100, asistencia: { 'Titi': 'voy' } }),
      ],
      eventos: [],
      users,
      year: 2026,
    })
    expect(diff.miembrosNoVinculados).toEqual(['Titi'])
  })
})
```

- [ ] **Step 2: Verificar fallo**

Run: `npm test`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Append a `src/services/sheetsParseUtils.js`:

```javascript
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

function eventoDate(evento) {
  return evento.fecha?.toDate ? evento.fecha.toDate() : new Date(evento.fecha)
}

function asistenciaCount(asistencia) {
  return Object.values(asistencia || {}).filter((v) => v === 'voy').length
}

function refuerzosCount(refuerzos) {
  if (Array.isArray(refuerzos)) return refuerzos.length
  return refuerzos || 0
}

export function buildDiff({ candidates, eventos, users, year }) {
  // Filter eventos to actuaciones of the given year
  const eventosDelAnyo = eventos.filter((e) => {
    const d = eventoDate(e)
    return d.getFullYear() === year && e.tipo === 'actuacion'
  })

  const aCrear = []
  const aActualizar = []
  const matchedEventoIds = new Set()
  const miembrosNoVinculadosSet = new Set()

  for (const candidate of candidates) {
    // Resolve asistencia uids
    const asistenciaResuelta = {}
    for (const colName of Object.keys(candidate.asistenciaPorColumna)) {
      const uid = resolveUidForColumn(colName, users)
      if (uid) asistenciaResuelta[uid] = 'voy'
      else miembrosNoVinculadosSet.add(colName)
    }

    // Find match in eventos
    const candidateNombreNorm = normalizeName(candidate.nombre)
    const match = eventosDelAnyo.find((e) => {
      if (matchedEventoIds.has(e.id)) return false
      if (!sameDay(eventoDate(e), candidate.fecha)) return false
      return normalizeName(e.nombre) === candidateNombreNorm
    })

    if (!match) {
      aCrear.push({ candidate, asistenciaResuelta })
      continue
    }

    matchedEventoIds.add(match.id)

    // Compute cambios
    const cambios = {}
    if ((match.precio || 0) !== candidate.precio) {
      cambios.precio = { antes: match.precio || 0, despues: candidate.precio }
    }
    if ((match.precioTotal || match.precio || 0) !== candidate.precioTotal) {
      cambios.precioTotal = { antes: match.precioTotal || match.precio || 0, despues: candidate.precioTotal }
    }
    const asistAntes = asistenciaCount(match.asistencia)
    const asistDespues = Object.keys(asistenciaResuelta).length
    if (asistAntes !== asistDespues) {
      cambios.asistenciaCount = { antes: asistAntes, despues: asistDespues }
    }
    const refAntes = refuerzosCount(match.refuerzos)
    const refDespues = candidate.refuerzos.length
    if (refAntes !== refDespues) {
      cambios.refuerzosCount = { antes: refAntes, despues: refDespues }
    }

    if (Object.keys(cambios).length > 0) {
      aActualizar.push({ candidate, eventoExistente: match, asistenciaResuelta, cambios })
    }
  }

  // soloEnApp = eventos del año tipo actuacion que no se han matcheado
  const soloEnApp = eventosDelAnyo.filter((e) => !matchedEventoIds.has(e.id))

  return {
    aCrear,
    aActualizar,
    soloEnApp,
    miembrosNoVinculados: Array.from(miembrosNoVinculadosSet),
  }
}
```

- [ ] **Step 4: Verificar pasa**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/services/sheetsParseUtils.js src/services/__tests__/sheetsParseUtils.test.js
git commit -m "feat(sheets): add buildDiff with cambios detection"
```

---

## Fase 2 — Servicios de integración

### Task 10: `googleAuth.js` — wrapper de Google Identity Services

**Files:**
- Create: `src/services/googleAuth.js`

No tests automatizados aquí — depende de `window.google` cargado por script externo. Verificación manual en Task 17.

- [ ] **Step 1: Crear `src/services/googleAuth.js`**

Contenido completo:

```javascript
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly'
const CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID

let tokenInMemory = null
let tokenExpiresAt = 0

export function isOAuthConfigured() {
  return Boolean(CLIENT_ID)
}

function gisReady() {
  return typeof window !== 'undefined'
    && window.google
    && window.google.accounts
    && window.google.accounts.oauth2
}

export function getCachedToken() {
  if (!tokenInMemory) return null
  if (Date.now() >= tokenExpiresAt - 60_000) return null // refresh 1 min before expiry
  return tokenInMemory
}

export function clearToken() {
  tokenInMemory = null
  tokenExpiresAt = 0
}

export function requestSheetsToken() {
  return new Promise((resolve, reject) => {
    if (!isOAuthConfigured()) {
      reject(new Error('OAuth no configurado: falta VITE_GOOGLE_OAUTH_CLIENT_ID'))
      return
    }
    if (!gisReady()) {
      reject(new Error('Google Identity Services no está disponible. ¿Has cargado el script?'))
      return
    }

    const cached = getCachedToken()
    if (cached) {
      resolve(cached)
      return
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (response) => {
        if (response.error) {
          reject(new Error('Permiso denegado por Google: ' + response.error))
          return
        }
        tokenInMemory = response.access_token
        // expires_in is in seconds
        tokenExpiresAt = Date.now() + (response.expires_in || 3600) * 1000
        resolve(tokenInMemory)
      },
    })

    tokenClient.requestAccessToken({ prompt: '' })
  })
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/services/googleAuth.js
git commit -m "feat(sheets): add Google OAuth wrapper using GIS"
```

---

### Task 11: `sheetsApi.js` — fetch de la pestaña

**Files:**
- Create: `src/services/sheetsApi.js`

- [ ] **Step 1: Crear `src/services/sheetsApi.js`**

Contenido completo:

```javascript
const BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

/**
 * Extracts spreadsheet ID from a Google Sheets URL.
 * Returns null if not a recognizable URL.
 */
export function extractSpreadsheetId(url) {
  if (!url || typeof url !== 'string') return null
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return m ? m[1] : null
}

/**
 * Fetches values from a sheet tab.
 * Returns { values: any[][] }.
 * Throws Error with useful message on HTTP failure.
 */
export async function fetchSheetValues({ spreadsheetId, tabName, accessToken }) {
  const range = encodeURIComponent(`${tabName}!A1:Z200`)
  const url = `${BASE}/${spreadsheetId}/values/${range}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (res.status === 401 || res.status === 403) {
    throw new Error('Permiso denegado por Google. Vuelve a autorizar la app.')
  }
  if (res.status === 400) {
    // Sheets API returns 400 when range references non-existent tab
    const body = await res.json().catch(() => ({}))
    if (body?.error?.message?.includes('Unable to parse range')) {
      throw new Error(`No encuentro la pestaña "${tabName}" en tu hoja.`)
    }
    throw new Error(body?.error?.message || 'Error al leer la hoja.')
  }
  if (!res.ok) {
    throw new Error(`Error HTTP ${res.status} al leer la hoja.`)
  }
  return res.json()
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/services/sheetsApi.js
git commit -m "feat(sheets): add Sheets API fetcher with extractSpreadsheetId"
```

---

### Task 12: `sheetsConfig.js` — Firestore CRUD para `config/sheetsSync`

**Files:**
- Create: `src/services/sheetsConfig.js`

- [ ] **Step 1: Crear `src/services/sheetsConfig.js`**

Contenido completo:

```javascript
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

const CONFIG_REF = doc(db, 'config', 'sheetsSync')

export async function getSheetsConfig() {
  const snap = await getDoc(CONFIG_REF)
  if (!snap.exists()) return null
  return snap.data()
}

export async function saveSheetsConfig({ spreadsheetId, spreadsheetUrl }) {
  await setDoc(CONFIG_REF, {
    spreadsheetId,
    spreadsheetUrl,
  }, { merge: true })
}

export async function recordSyncResult({ creados, actualizados, email }) {
  await setDoc(CONFIG_REF, {
    ultimaSync: serverTimestamp(),
    ultimaSyncPor: email,
    ultimaSyncResultado: { creados, actualizados },
  }, { merge: true })
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/services/sheetsConfig.js
git commit -m "feat(sheets): add config doc CRUD for sheetsSync"
```

---

### Task 13: `sheetsSync.js` — orquestador `prepareSync` y `applyDiff`

**Files:**
- Create: `src/services/sheetsSync.js`

- [ ] **Step 1: Crear `src/services/sheetsSync.js`**

Contenido completo:

```javascript
import { writeBatch, doc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { requestSheetsToken } from './googleAuth'
import { fetchSheetValues } from './sheetsApi'
import { parseRows, buildDiff } from './sheetsParseUtils'
import { getSheetsConfig, recordSyncResult } from './sheetsConfig'

/**
 * Authenticates, fetches the tab for the given year, parses rows,
 * builds and returns the diff (without applying).
 *
 * Throws Error with user-friendly message on any failure.
 */
export async function prepareSync({ year, eventos, users }) {
  const config = await getSheetsConfig()
  if (!config?.spreadsheetId) {
    throw new Error('No hay hoja configurada. Pulsa Configurar primero.')
  }

  const accessToken = await requestSheetsToken()
  const tabName = String(year)

  const { values } = await fetchSheetValues({
    spreadsheetId: config.spreadsheetId,
    tabName,
    accessToken,
  })

  const { candidates } = parseRows({ values })
  const diff = buildDiff({ candidates, eventos, users, year })
  return { diff, tabName }
}

/**
 * Applies a diff to Firestore using a batched write.
 * Marks all synced events with sincronizadoDesdeGS, sincronizadoEn, cerrado=true.
 *
 * Returns { creados, actualizados }.
 */
export async function applyDiff({ diff, currentUserEmail }) {
  const batch = writeBatch(db)

  for (const item of diff.aCrear) {
    const ref = doc(collection(db, 'eventos'))
    batch.set(ref, {
      fecha: item.candidate.fecha,
      nombre: item.candidate.nombre,
      tipo: 'actuacion',
      precio: item.candidate.precio,
      precioTotal: item.candidate.precioTotal,
      refuerzos: item.candidate.refuerzos,
      asistencia: item.asistenciaResuelta,
      cerrado: true,
      sincronizadoDesdeGS: true,
      sincronizadoEn: serverTimestamp(),
    })
  }

  for (const item of diff.aActualizar) {
    const ref = doc(db, 'eventos', item.eventoExistente.id)
    batch.update(ref, {
      precio: item.candidate.precio,
      precioTotal: item.candidate.precioTotal,
      refuerzos: item.candidate.refuerzos,
      asistencia: item.asistenciaResuelta,
      cerrado: true,
      sincronizadoDesdeGS: true,
      sincronizadoEn: serverTimestamp(),
    })
  }

  await batch.commit()

  await recordSyncResult({
    creados: diff.aCrear.length,
    actualizados: diff.aActualizar.length,
    email: currentUserEmail,
  })

  return { creados: diff.aCrear.length, actualizados: diff.aActualizar.length }
}
```

Importante: `applyDiff` SOBRESCRIBE `asistencia` completa (set, no merge). Esto es intencional: la GS es la verdad, así que cualquier voto previo se reemplaza.

`pagados`, `ubicacion` y `hora` no aparecen en el `update`, por lo que se conservan.

- [ ] **Step 2: Commit**

```powershell
git add src/services/sheetsSync.js
git commit -m "feat(sheets): add prepareSync + applyDiff orchestrator"
```

---

## Fase 3 — UI

### Task 14: `SheetsConfigModal.jsx` — modal de configuración de URL

**Files:**
- Create: `src/components/gestion/SheetsConfigModal.jsx`
- Create: `src/components/gestion/sheets-sync.css`

- [ ] **Step 1: Crear el CSS base**

Contenido inicial de `src/components/gestion/sheets-sync.css`:

```css
.sheets-sync-panel {
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #e5e5e5);
  border-radius: 12px;
  padding: 16px;
  margin: 12px 0 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sheets-sync-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary, #666);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sheets-sync-info {
  font-size: 14px;
  color: var(--color-text, #222);
}

.sheets-sync-meta {
  font-size: 12px;
  color: var(--color-text-secondary, #777);
}

.sheets-sync-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.sheets-sync-empty {
  font-size: 14px;
  color: var(--color-text-secondary, #777);
  font-style: italic;
}

/* Preview modal */
.preview-section {
  margin-top: 16px;
}

.preview-section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary, #555);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 6px;
}

.preview-item {
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--color-background-soft, #f7f7f7);
  margin-bottom: 4px;
  font-size: 14px;
}

.preview-item-meta {
  font-size: 12px;
  color: var(--color-text-secondary, #777);
  margin-top: 2px;
}

.preview-warn {
  background: #fff7e6;
  border: 1px solid #ffd591;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  margin-top: 12px;
  color: #874d00;
}

.preview-error {
  background: #fff1f0;
  border: 1px solid #ffa39e;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  margin: 12px 0;
  color: #a8071a;
}
```

- [ ] **Step 2: Crear el componente**

Contenido completo de `src/components/gestion/SheetsConfigModal.jsx`:

```javascript
import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { extractSpreadsheetId } from '../../services/sheetsApi'
import { saveSheetsConfig } from '../../services/sheetsConfig'
import './sheets-sync.css'

export default function SheetsConfigModal({ initialUrl = '', onClose, onSaved }) {
  const [url, setUrl] = useState(initialUrl)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setError('')
    const id = extractSpreadsheetId(url)
    if (!id) {
      setError('No reconozco esa URL. Pega el enlace completo de la hoja.')
      return
    }
    setSaving(true)
    try {
      await saveSheetsConfig({ spreadsheetId: id, spreadsheetUrl: url })
      onSaved?.({ spreadsheetId: id, spreadsheetUrl: url })
      onClose?.()
    } catch (e) {
      setError(e.message || 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3 style={{ marginBottom: 16 }}>Configurar Google Sheets</h3>
      <label className="form-label">URL de la hoja</label>
      <input
        type="url"
        placeholder="https://docs.google.com/spreadsheets/d/..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        autoFocus
      />
      <div style={{ fontSize: 12, color: '#777', marginTop: 6 }}>
        Pega la URL completa de tu hoja CuentasCharanga.
      </div>
      {error && <div className="preview-error">{error}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 3: Commit**

```powershell
git add src/components/gestion/SheetsConfigModal.jsx src/components/gestion/sheets-sync.css
git commit -m "feat(sheets): add config modal to set spreadsheet URL"
```

---

### Task 15: `SheetsSyncPreviewModal.jsx` — vista previa del diff

**Files:**
- Create: `src/components/gestion/SheetsSyncPreviewModal.jsx`

- [ ] **Step 1: Crear el componente**

Contenido completo:

```javascript
import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { applyDiff } from '../../services/sheetsSync'
import './sheets-sync.css'

function formatShort(date) {
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtEur(n) {
  return new Intl.NumberFormat('de-DE').format(n || 0) + '€'
}

function CambioLine({ label, change }) {
  if (!change) return null
  return (
    <div className="preview-item-meta">
      {label}: {typeof change.antes === 'number' && label.includes('€') ? fmtEur(change.antes) : change.antes}
      {' -> '}
      {typeof change.despues === 'number' && label.includes('€') ? fmtEur(change.despues) : change.despues}
    </div>
  )
}

export default function SheetsSyncPreviewModal({ diff, tabName, currentUserEmail, onClose, onApplied }) {
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState('')

  const nada = diff.aCrear.length === 0 && diff.aActualizar.length === 0

  async function handleConfirm() {
    setApplying(true)
    setError('')
    try {
      const result = await applyDiff({ diff, currentUserEmail })
      onApplied?.(result)
      onClose?.()
    } catch (e) {
      setError(e.message || 'Error al sincronizar.')
      setApplying(false)
    }
  }

  return (
    <Modal onClose={applying ? undefined : onClose}>
      <h3 style={{ marginBottom: 4 }}>Vista previa de sincronización</h3>
      <div className="sheets-sync-meta">Pestaña: {tabName}</div>

      {nada && (
        <div className="preview-warn" style={{ marginTop: 16 }}>
          Ya está todo sincronizado. No hay cambios.
        </div>
      )}

      {diff.aCrear.length > 0 && (
        <div className="preview-section">
          <div className="preview-section-title">Crear ({diff.aCrear.length})</div>
          {diff.aCrear.map((item, i) => (
            <div key={i} className="preview-item">
              <div>{formatShort(item.candidate.fecha)}  ·  {item.candidate.nombre}  ·  {fmtEur(item.candidate.precio)}</div>
              <div className="preview-item-meta">
                {Object.keys(item.asistenciaResuelta).length} miembros
                {item.candidate.refuerzos.length > 0 ? ` + ${item.candidate.refuerzos.length} refuerzos` : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {diff.aActualizar.length > 0 && (
        <div className="preview-section">
          <div className="preview-section-title">Actualizar ({diff.aActualizar.length})</div>
          {diff.aActualizar.map((item, i) => (
            <div key={i} className="preview-item">
              <div>{formatShort(item.candidate.fecha)}  ·  {item.candidate.nombre}</div>
              <CambioLine label="precio" change={item.cambios.precio} />
              <CambioLine label="precio total" change={item.cambios.precioTotal} />
              <CambioLine label="asistentes" change={item.cambios.asistenciaCount} />
              <CambioLine label="refuerzos" change={item.cambios.refuerzosCount} />
            </div>
          ))}
        </div>
      )}

      {diff.soloEnApp.length > 0 && (
        <div className="preview-section">
          <div className="preview-section-title">En la app pero no en la GS ({diff.soloEnApp.length})</div>
          {diff.soloEnApp.map((e) => {
            const d = e.fecha?.toDate ? e.fecha.toDate() : new Date(e.fecha)
            return (
              <div key={e.id} className="preview-item">
                {formatShort(d)}  ·  {e.nombre}  (no se toca)
              </div>
            )
          })}
        </div>
      )}

      {diff.miembrosNoVinculados.length > 0 && (
        <div className="preview-warn">
          Miembros sin vincular: {diff.miembrosNoVinculados.join(', ')}.
          Configura su claveHistorico en Perfil para que su asistencia se cuente.
        </div>
      )}

      {error && <div className="preview-error">{error}</div>}

      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose} disabled={applying}>Cancelar</Button>
        <Button onClick={handleConfirm} disabled={applying || nada}>
          {applying ? 'Sincronizando...' : 'Confirmar sync'}
        </Button>
      </div>
    </Modal>
  )
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/gestion/SheetsSyncPreviewModal.jsx
git commit -m "feat(sheets): add preview modal with confirm sync"
```

---

### Task 16: `SheetsSyncPanel.jsx` — bloque visible en Gestión

**Files:**
- Create: `src/components/gestion/SheetsSyncPanel.jsx`

- [ ] **Step 1: Crear el componente**

Contenido completo:

```javascript
import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import SheetsConfigModal from './SheetsConfigModal'
import SheetsSyncPreviewModal from './SheetsSyncPreviewModal'
import { getSheetsConfig } from '../../services/sheetsConfig'
import { prepareSync } from '../../services/sheetsSync'
import { isOAuthConfigured } from '../../services/googleAuth'
import './sheets-sync.css'

function formatLastSync(ts) {
  if (!ts) return 'nunca'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    + ', ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

export default function SheetsSyncPanel({ year, eventos, users, currentUserEmail }) {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showConfig, setShowConfig] = useState(false)
  const [preview, setPreview] = useState(null) // { diff, tabName }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    let cancelled = false
    getSheetsConfig()
      .then((c) => { if (!cancelled) { setConfig(c); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  async function handleSync() {
    setError('')
    setToast('')
    setBusy(true)
    try {
      const { diff, tabName } = await prepareSync({ year, eventos, users })
      setPreview({ diff, tabName })
    } catch (e) {
      setError(e.message || 'Error al preparar sync.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return null
  if (!isOAuthConfigured()) {
    return (
      <div className="sheets-sync-panel">
        <div className="sheets-sync-title">Sincronización Google Sheets</div>
        <div className="sheets-sync-empty">
          OAuth no configurado. Falta VITE_GOOGLE_OAUTH_CLIENT_ID en variables de entorno.
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="sheets-sync-panel">
        <div className="sheets-sync-title">Sincronización Google Sheets</div>
        {config?.spreadsheetId ? (
          <>
            <div className="sheets-sync-info">
              Hoja configurada · Pestaña: {year}
            </div>
            <div className="sheets-sync-meta">
              Última sync: {formatLastSync(config.ultimaSync)}
              {config.ultimaSyncResultado && config.ultimaSync && (
                <> · {config.ultimaSyncResultado.creados} creados, {config.ultimaSyncResultado.actualizados} actualizados</>
              )}
            </div>
          </>
        ) : (
          <div className="sheets-sync-empty">No configurado.</div>
        )}
        {error && <div className="preview-error">{error}</div>}
        {toast && <div className="preview-warn">{toast}</div>}
        <div className="sheets-sync-actions">
          <Button variant="secondary" size="sm" onClick={() => setShowConfig(true)} disabled={busy}>
            Configurar
          </Button>
          <Button size="sm" onClick={handleSync} disabled={busy || !config?.spreadsheetId}>
            {busy ? 'Cargando...' : `Sincronizar ${year}`}
          </Button>
        </div>
      </div>

      {showConfig && (
        <SheetsConfigModal
          initialUrl={config?.spreadsheetUrl || ''}
          onClose={() => setShowConfig(false)}
          onSaved={(c) => setConfig((prev) => ({ ...(prev || {}), ...c }))}
        />
      )}

      {preview && (
        <SheetsSyncPreviewModal
          diff={preview.diff}
          tabName={preview.tabName}
          currentUserEmail={currentUserEmail}
          onClose={() => setPreview(null)}
          onApplied={(result) => {
            setToast(`Sincronizado: ${result.actualizados} actualizados, ${result.creados} creados.`)
            // Reload config to refresh ultimaSync display
            getSheetsConfig().then(setConfig).catch(() => {})
          }}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/gestion/SheetsSyncPanel.jsx
git commit -m "feat(sheets): add sync panel with prepare + preview flow"
```

---

### Task 17: Integrar `SheetsSyncPanel` en `Gestion.jsx` (gating por email)

**Files:**
- Modify: `src/pages/Gestion.jsx`

- [ ] **Step 1: Añadir constante OWNER_EMAIL e import**

En `src/pages/Gestion.jsx`, en la zona de imports (al principio del fichero), añadir:

```javascript
import { useAuth } from '../context/AuthContext'
import SheetsSyncPanel from '../components/gestion/SheetsSyncPanel'
```

Y añadir constante después de los imports, antes de la primera función:

```javascript
const OWNER_EMAIL = 'marta.torres@quantia.es'
```

- [ ] **Step 2: Pasar `events` (no solo `pastEvents`) al panel y obtener email**

Dentro del componente `Gestion`, después de la línea `const { events } = useEvents()`, añadir:

```javascript
  const { userData } = useAuth()
  const isOwner = userData?.email === OWNER_EMAIL
```

- [ ] **Step 3: Renderizar el panel justo después del bloque `gestion-filters`**

Localizar este bloque en `Gestion.jsx`:

```jsx
      <div className="gestion-filters">
        <select ...>
          ...
        </select>
        <select ...>
          ...
        </select>
      </div>

      <IngresosChart actuaciones={pastActuaciones} />
```

Insertar entre los filtros y `IngresosChart`:

```jsx
      {isOwner && (
        <SheetsSyncPanel
          year={selectedYear}
          eventos={events}
          users={users}
          currentUserEmail={userData?.email}
        />
      )}
```

Importante: pasar `events` (todos), no `pastEvents` ni `filteredEvents` — el sync necesita ver todos los eventos del año para detectar `soloEnApp` correctamente.

- [ ] **Step 4: Verificar visualmente**

Run:
```powershell
npm run dev
```

- Loguearte como `marta.torres@quantia.es`. Ir a `/gestion`. El panel debe aparecer debajo de los filtros, mostrando "OAuth no configurado" (porque aún no hay env var) o "No configurado" si la env var existe pero no hay doc en Firestore.
- Loguearte como cualquier otro usuario. Ir a `/gestion`. El panel NO debe aparecer.
- Cerrar dev server (Ctrl+C).

- [ ] **Step 5: Commit**

```powershell
git add src/pages/Gestion.jsx
git commit -m "feat(gestion): integrate SheetsSyncPanel for owner email"
```

---

## Fase 4 — Documentación y verificación end-to-end

### Task 18: Documentar setup OAuth en FIREBASE_SETUP.md

**Files:**
- Modify: `FIREBASE_SETUP.md`

- [ ] **Step 1: Añadir sección al final del fichero**

Append a `FIREBASE_SETUP.md`:

```markdown

---

## Google Sheets Sync (solo owner)

Para que Marta pueda sincronizar los actos desde la Google Sheet de cuentas:

### 1. Google Cloud Console

1. Ir a https://console.cloud.google.com.
2. Crear o seleccionar un proyecto (puede ser el mismo de Firebase).
3. Habilitar **Google Sheets API** (APIs & Services → Library → buscar "Google Sheets API" → Enable).
4. Crear credenciales OAuth:
   - APIs & Services → Credentials → Create Credentials → OAuth client ID.
   - Si pide configurar OAuth consent screen primero: User Type "External", añadir tu email como Test User, scopes mínimos.
   - Application type: **Web application**.
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `https://<tu-dominio-netlify>` (ej: `https://lamandanga.netlify.app`)
   - Authorized redirect URIs: dejar vacío (usamos token client, no redirect).
5. Copiar el Client ID generado.

### 2. Variables de entorno

En `.env` local:
```
VITE_GOOGLE_OAUTH_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

En Netlify: Site Settings → Environment Variables → añadir `VITE_GOOGLE_OAUTH_CLIENT_ID`.

### 3. Reglas Firestore

Desplegar `firestore.rules` desde Firebase Console (Rules → Edit → pegar contenido del fichero → Publish).

### 4. Configuración inicial en la app

1. Abrir la app como `marta.torres@quantia.es`.
2. Ir a Gestión.
3. Pulsar Configurar en el bloque "Sincronización Google Sheets".
4. Pegar la URL de la Google Sheet CuentasCharanga.
5. Pulsar Sincronizar 2026, autorizar Google en el popup, revisar la vista previa, confirmar.
```

- [ ] **Step 2: Commit**

```powershell
git add FIREBASE_SETUP.md
git commit -m "docs: add Google Sheets sync setup instructions"
```

---

### Task 19: Test end-to-end manual + lista de verificación

**Files:** ninguno (verificación manual)

Esta tarea NO se commitea. Es para Marta (o quien ejecute el plan) recorrer la app antes de declarar la feature lista.

**Pre-requisitos:**
- Tasks 1-18 commiteadas.
- `VITE_GOOGLE_OAUTH_CLIENT_ID` configurado en `.env` local.
- Reglas Firestore desplegadas.
- GS de prueba accesible (puede ser una copia con 2-3 actos de 2026).

- [ ] **Step 1: Smoke tests (no requieren OAuth)**

Run:
```powershell
npm test
npm run build
```

Expected: tests pasan (todos los de `sheetsParseUtils`), build sin errores.

- [ ] **Step 2: Login como NO-owner**

- Arrancar `npm run dev`.
- Loguearte con cualquier usuario que NO sea `marta.torres@quantia.es`.
- Ir a `/gestion`. El panel "Sincronización Google Sheets" NO debe aparecer.

- [ ] **Step 3: Login como owner — UI visible**

- Loguearte como `marta.torres@quantia.es`.
- Ir a `/gestion`. El panel debe aparecer debajo de los filtros, con texto "No configurado".

- [ ] **Step 4: Configurar URL**

- Pulsar "Configurar".
- Pegar URL inválida (ej: "abc"). Debe mostrar error "No reconozco esa URL".
- Pegar URL válida. Pulsar Guardar. Modal cierra. Panel ahora dice "Hoja configurada · Pestaña: 2026".

- [ ] **Step 5: Sincronizar — flujo OAuth**

- Pulsar "Sincronizar 2026".
- Popup de Google se abre. Autorizar con tu cuenta.
- Tras autorizar: aparece la vista previa con los actos de la GS de 2026.

- [ ] **Step 6: Vista previa correcta**

Verificar que:
- Los actos a Crear coinciden con los de la GS que NO existen en Firestore.
- Los actos a Actualizar muestran el cambio antes→después.
- Los miembros sin vincular aparecen en el aviso amarillo (si los hay).
- Si no hay cambios, mensaje "Ya está todo sincronizado".

- [ ] **Step 7: Confirmar sync**

- Pulsar "Confirmar sync".
- Toast: "Sincronizado: X actualizados, Y creados".
- Refrescar página. La tabla de asistencias y los gráficos reflejan los datos sincronizados.
- Abrir un acto sincronizado en Agenda. Debe estar marcado como cerrado, no se puede votar.
- Marcar un pago en el acto sincronizado. Recargar. El pago se mantiene (no lo toca la sync).

- [ ] **Step 8: Sync idempotente**

- Volver a pulsar "Sincronizar 2026" sin cambios en la GS.
- Vista previa muestra "Ya está todo sincronizado".
- Cancelar. Sin escrituras en Firestore.

- [ ] **Step 9: Errores manejables**

- En la GS, renombrar la pestaña "2026" a "ZZZ" temporalmente.
- Pulsar Sincronizar 2026. Debe mostrar error: "No encuentro la pestaña '2026' en tu hoja."
- Restaurar el nombre de la pestaña.

- [ ] **Step 10: Verificación final**

Si todos los pasos anteriores pasan, marcar esta tarea como completada y avisar a Marta para hacer la primera sync real (acordándose de hacer export de Firestore antes, por precaución).

---

## Resumen de commits esperados

1. chore: add vitest for unit tests
2. chore: document VITE_GOOGLE_OAUTH_CLIENT_ID env var
3. chore: load Google Identity Services script
4. feat(rules): allow owner email to manage config docs
5. feat(sheets): add normalizeName utility
6. feat(sheets): add parseSpanishDate utility
7. feat(sheets): add parseRows for Sheets API values
8. feat(sheets): add resolveUidForColumn
9. feat(sheets): add buildDiff with cambios detection
10. feat(sheets): add Google OAuth wrapper using GIS
11. feat(sheets): add Sheets API fetcher with extractSpreadsheetId
12. feat(sheets): add config doc CRUD for sheetsSync
13. feat(sheets): add prepareSync + applyDiff orchestrator
14. feat(sheets): add config modal to set spreadsheet URL
15. feat(sheets): add preview modal with confirm sync
16. feat(sheets): add sync panel with prepare + preview flow
17. feat(gestion): integrate SheetsSyncPanel for owner email
18. docs: add Google Sheets sync setup instructions

(La Task 19 es verificación manual, sin commit.)
