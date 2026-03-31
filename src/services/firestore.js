import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// --- Users ---

export function subscribeToUser(uid, callback) {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  })
}

export async function getUsers() {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function updateUser(uid, data) {
  await updateDoc(doc(db, 'users', uid), data)
}

// --- Events ---

export function subscribeToEvents(callback) {
  const q = query(collection(db, 'eventos'), orderBy('fecha', 'asc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function addEvent(data) {
  return addDoc(collection(db, 'eventos'), {
    ...data,
    asistencia: {},
  })
}

export async function updateEvent(id, data) {
  await updateDoc(doc(db, 'eventos', id), data)
}

export async function deleteEvent(id) {
  await deleteDoc(doc(db, 'eventos', id))
}

export async function voteEvent(eventId, uid, vote) {
  await updateDoc(doc(db, 'eventos', eventId), {
    [`asistencia.${uid}`]: vote,
  })
}

// --- Folders ---

export function subscribeToFolders(callback) {
  const q = query(collection(db, 'carpetas'), orderBy('orden', 'asc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function addFolder(nombre, orden, uid) {
  return addDoc(collection(db, 'carpetas'), {
    nombre,
    orden,
    creadoPor: uid,
  })
}

export async function deleteFolder(id) {
  await deleteDoc(doc(db, 'carpetas', id))
}

// --- Scores ---

export function subscribeToScores(carpetaId, callback) {
  const q = query(
    collection(db, 'partituras'),
    where('carpetaId', '==', carpetaId)
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function addScore(nombre, urlDrive, carpetaId, uid) {
  return addDoc(collection(db, 'partituras'), {
    nombre,
    urlDrive,
    carpetaId,
    creadoPor: uid,
  })
}

export async function deleteScore(id) {
  await deleteDoc(doc(db, 'partituras', id))
}
