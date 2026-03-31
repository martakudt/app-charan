import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { logout } from '../services/auth'
import { updateUser } from '../services/firestore'
import { useUsers } from '../hooks/useUsers'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import './perfil.css'

function formatDate(timestamp) {
  if (!timestamp) return ''
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Perfil() {
  const { user, userData, isAdmin } = useAuth()
  const { users, loading, approveUser, rejectUser, togglePermission } = useUsers()
  const [showEdit, setShowEdit] = useState(false)
  const [editNombre, setEditNombre] = useState('')
  const [editInstrumento, setEditInstrumento] = useState('')

  const INSTRUMENTOS = [
    'Clarinete', 'Saxofón', 'Trompeta', 'Trombón', 'Tuba',
    'Bombardino', 'Flauta', 'Percusión', 'Caja', 'Bombo', 'Otro'
  ]

  function openEdit() {
    setEditNombre(userData?.nombre || '')
    setEditInstrumento(userData?.instrumento || '')
    setShowEdit(true)
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    if (!editNombre.trim() || !editInstrumento) return
    await updateUser(user.uid, {
      nombre: editNombre.trim(),
      instrumento: editInstrumento,
    })
    setShowEdit(false)
  }

  const pendingUsers = users.filter((u) => u.estado === 'pendiente')
  const approvedUsers = users.filter((u) => u.estado === 'aprobado' && u.id !== user.uid)

  return (
    <div>
      <div className="perfil-header">
        <h1 className="perfil-name">{userData?.nombre}</h1>
        <div className="perfil-instrument">🎵 {userData?.instrumento}</div>
        <p className="perfil-since">
          En La Mandanga desde el {formatDate(userData?.fechaRegistro)}
        </p>
      </div>

      <div className="perfil-actions">
        <Button variant="secondary" onClick={openEdit}>Editar perfil</Button>
        <Button variant="ghost" onClick={logout}>Cerrar sesión</Button>
      </div>

      {isAdmin && (
        <div className="admin-section">
          <h2>Administración</h2>

          {pendingUsers.length > 0 && (
            <>
              <h3>Solicitudes pendientes</h3>
              {pendingUsers.map((u) => (
                <Card key={u.id} className="pending-card">
                  <div className="pending-info">
                    <div className="pending-name">{u.nombre}</div>
                    <div className="pending-meta">{u.email} · {u.instrumento}</div>
                  </div>
                  <div className="pending-actions">
                    <button
                      className="pending-btn"
                      style={{ background: 'var(--color-success)' }}
                      onClick={() => approveUser(u.id)}
                    >
                      ✓
                    </button>
                    <button
                      className="pending-btn"
                      style={{ background: 'var(--color-danger)' }}
                      onClick={() => rejectUser(u.id)}
                    >
                      ✗
                    </button>
                  </div>
                </Card>
              ))}
            </>
          )}

          <h3 style={{ marginTop: 24 }}>Miembros</h3>
          {loading ? (
            <p style={{ color: 'var(--color-text-secondary)' }}>Cargando...</p>
          ) : (
            <>
              {approvedUsers.map((u) => (
                <Card key={u.id} className="member-card">
                  <div className="member-header">
                    <span className="member-name">{u.nombre}</span>
                    <span className="member-instrument">{u.instrumento}</span>
                  </div>
                  <div className="toggle-row">
                    <span>Gestionar partituras</span>
                    <div
                      className={`toggle${u.permisos?.partituras ? ' toggle-active' : ''}`}
                      onClick={() => togglePermission(u.id, 'partituras', !u.permisos?.partituras)}
                    />
                  </div>
                  <div className="toggle-row">
                    <span>Gestionar calendario</span>
                    <div
                      className={`toggle${u.permisos?.calendario ? ' toggle-active' : ''}`}
                      onClick={() => togglePermission(u.id, 'calendario', !u.permisos?.calendario)}
                    />
                  </div>
                </Card>
              ))}
              <div className="member-count">
                {users.filter((u) => u.estado === 'aprobado').length}/16 miembros activos
              </div>
            </>
          )}
        </div>
      )}

      {showEdit && (
        <Modal onClose={() => setShowEdit(false)}>
          <form onSubmit={handleSaveProfile}>
            <h3 style={{ marginBottom: 16 }}>Editar perfil</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                placeholder="Nombre"
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
              />
              <select
                value={editInstrumento}
                onChange={(e) => setEditInstrumento(e.target.value)}
              >
                {INSTRUMENTOS.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <Button type="submit">Guardar</Button>
              <Button variant="ghost" onClick={() => setShowEdit(false)}>Cancelar</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
