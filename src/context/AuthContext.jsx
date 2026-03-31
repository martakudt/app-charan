import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'
import { subscribeToUser } from '../services/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(undefined)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user)
      if (!user) {
        setUserData(null)
        setLoading(false)
      }
    })
  }, [])

  useEffect(() => {
    if (!firebaseUser) return
    return subscribeToUser(firebaseUser.uid, (data) => {
      setUserData(data)
      setLoading(false)
    })
  }, [firebaseUser])

  const value = {
    user: firebaseUser,
    userData,
    loading,
    isAdmin: userData?.rol === 'admin',
    canManageScores: userData?.rol === 'admin' || userData?.permisos?.partituras === true,
    canManageEvents: userData?.rol === 'admin' || userData?.permisos?.calendario === true,
    canAccessDireccion: userData?.rol === 'admin' || userData?.permisos?.direccion === true,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
