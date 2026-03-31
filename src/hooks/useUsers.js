import { useState, useEffect } from 'react'
import { getUsers, updateUser } from '../services/firestore'

export function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  async function refresh() {
    const data = await getUsers()
    setUsers(data)
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  async function approveUser(uid) {
    await updateUser(uid, { estado: 'aprobado' })
    refresh()
  }

  async function rejectUser(uid) {
    await updateUser(uid, { estado: 'rechazado' })
    refresh()
  }

  async function togglePermission(uid, permission, value) {
    await updateUser(uid, { [`permisos.${permission}`]: value })
    refresh()
  }

  return { users, loading, approveUser, rejectUser, togglePermission }
}
