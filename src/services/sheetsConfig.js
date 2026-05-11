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
