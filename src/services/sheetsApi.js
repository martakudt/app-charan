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
