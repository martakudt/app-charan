import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

export async function register(email, password, nombre, instrumento) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  await setDoc(doc(db, 'users', user.uid), {
    email,
    nombre,
    instrumento,
    estado: 'pendiente',
    rol: 'miembro',
    permisos: { partituras: false, calendario: false },
    fechaRegistro: serverTimestamp(),
  })
  return user
}

export async function login(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  return user
}

export async function logout() {
  await signOut(auth)
}
