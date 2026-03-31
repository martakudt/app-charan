import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { logout } from '../services/auth'
import { updateUser } from '../services/firestore'
import { useUsers } from '../hooks/useUsers'
import { useEvents } from '../hooks/useEvents'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import './perfil.css'

function formatDate(timestamp) {
  if (!timestamp) return ''
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDateShort(timestamp) {
  if (!timestamp) return ''
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0].substring(0, 2).toUpperCase()
}

function Avatar({ name, size = 80 }) {
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {getInitials(name)}
    </div>
  )
}

function StatRing({ value, max, label, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="stat-card">
      <div className="stat-ring-container">
        <svg width="88" height="88" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="6" />
          <circle
            cx="44" cy="44" r={radius} fill="none"
            stroke={color} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 44 44)"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="stat-ring-value">{pct}%</div>
      </div>
      <div className="stat-numbers">{value}/{max}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function roundDown5(n) {
  return Math.floor(n / 5) * 5
}

function MisActuaciones({ events, uid }) {
  const now = new Date()
  const misActuaciones = events
    .filter((e) => {
      const d = e.fecha?.toDate ? e.fecha.toDate() : new Date(e.fecha)
      return d < now && e.tipo === 'actuacion' && e.asistencia?.[uid] === 'voy'
    })
    .sort((a, b) => {
      const da = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha)
      const db = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha)
      return db - da
    })

  if (misActuaciones.length === 0) {
    return (
      <div className="mis-actuaciones">
        <h3 className="mis-actuaciones-title">Mis actuaciones</h3>
        <p className="mis-actuaciones-empty">No has asistido a ninguna actuación todavía.</p>
      </div>
    )
  }

  const totalGanado = misActuaciones.reduce((sum, act) => {
    if (!act.precio) return sum
    const asistentes = Object.values(act.asistencia || {}).filter((v) => v === 'voy').length
    const total = asistentes + (act.refuerzos || 0)
    if (total === 0) return sum
    return sum + roundDown5(act.precio / total)
  }, 0)

  return (
    <div className="mis-actuaciones">
      <h3 className="mis-actuaciones-title">Mis actuaciones</h3>

      <div className="mis-actuaciones-total">
        <span className="mis-actuaciones-total-value">{totalGanado}€</span>
        <span className="mis-actuaciones-total-label">Total acumulado</span>
      </div>

      <div className="mis-actuaciones-list">
        {misActuaciones.map((act) => {
          const asistentes = Object.values(act.asistencia || {}).filter((v) => v === 'voy').length
          const total = asistentes + (act.refuerzos || 0)
          const precio = act.precio || 0
          const porPersona = total > 0 && precio > 0 ? roundDown5(precio / total) : 0

          return (
            <div key={act.id} className="mis-actuaciones-item">
              <div className="mis-actuaciones-info">
                <div className="mis-actuaciones-name">{act.nombre}</div>
                <div className="mis-actuaciones-date">{formatDateShort(act.fecha)}</div>
              </div>
              <div className="mis-actuaciones-amount">
                {porPersona > 0 ? `${porPersona}€` : '—'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Perfil() {
  const { user, userData, isAdmin } = useAuth()
  const { users, loading, approveUser, rejectUser, togglePermission } = useUsers()
  const { events } = useEvents()
  const [showEdit, setShowEdit] = useState(false)
  const [editNombre, setEditNombre] = useState('')
  const [editInstrumento, setEditInstrumento] = useState('')

  const INSTRUMENTOS = [
    'Clarinete', 'Saxofón', 'Trompeta', 'Trombón', 'Tuba',
    'Bombardino', 'Flauta', 'Percusión', 'Caja', 'Bombo', 'Otro'
  ]

  const now = new Date()
  const pastEvents = events.filter((e) => {
    const d = e.fecha?.toDate ? e.fecha.toDate() : new Date(e.fecha)
    return d < now
  })
  const pastActuaciones = pastEvents.filter((e) => e.tipo === 'actuacion')
  const pastEnsayos = pastEvents.filter((e) => e.tipo === 'ensayo')

  const actuacionesAsistidas = pastActuaciones.filter((e) => e.asistencia?.[user?.uid] === 'voy').length
  const ensayosAsistidos = pastEnsayos.filter((e) => e.asistencia?.[user?.uid] === 'voy').length

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
      <div className="page-header" style={{ justifyContent: 'center' }}>
        <img src="/logo_mandanga.png" alt="" className="page-header-logo" />
        <h1 className="page-header-title">Perfil</h1>
      </div>

      <div className="perfil-header">
        <Avatar name={userData?.nombre} />
        <h1 className="perfil-name">{userData?.nombre}</h1>
        <div className="perfil-instrument">{userData?.instrumento}</div>
        <p className="perfil-since">
          En La Mandanga desde el {formatDate(userData?.fechaRegistro)}
        </p>
      </div>

      <div className="stats-section">
        <h3 className="stats-title">Mi asistencia</h3>
        <div className="stats-grid">
          <StatRing
            value={actuacionesAsistidas}
            max={pastActuaciones.length}
            label="Actuaciones"
            color="#E91E7B"
          />
          <StatRing
            value={ensayosAsistidos}
            max={pastEnsayos.length}
            label="Ensayos"
            color="#666666"
          />
        </div>
      </div>

      <MisActuaciones events={events} uid={user?.uid} />

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
                    <span>Gestionar calendario</span>
                    <div
                      className={`toggle${u.permisos?.calendario ? ' toggle-active' : ''}`}
                      onClick={() => togglePermission(u.id, 'calendario', !u.permisos?.calendario)}
                    />
                  </div>
                  <div className="toggle-row">
                    <span>Acceso a Gestión</span>
                    <div
                      className={`toggle${u.permisos?.direccion ? ' toggle-active' : ''}`}
                      onClick={() => togglePermission(u.id, 'direccion', !u.permisos?.direccion)}
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
