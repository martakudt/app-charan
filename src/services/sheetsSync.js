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
