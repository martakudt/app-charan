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

function MiniAvatar({ name }) {
  return (
    <div className="mini-avatar">
      {getInitials(name)}
    </div>
  )
}

function DireccionSection({ users, events }) {
  const now = new Date()
  const pastEvents = events.filter((e) => {
    const d = e.fecha?.toDate ? e.fecha.toDate() : new Date(e.fecha)
    return d < now
  })
  const pastActuaciones = pastEvents.filter((e) => e.tipo === 'actuacion')
  const pastEnsayos = pastEvents.filter((e) => e.tipo === 'ensayo')

  const approvedUsers = users.filter((u) => u.estado === 'aprobado')

  // Build stats for each user
  const memberStats = approvedUsers.map((u) => {
    const actAsistidas = pastActuaciones.filter((e) => e.asistencia?.[u.id] === 'voy').length
    const ensAsistidos = pastEnsayos.filter((e) => e.asistencia?.[u.id] === 'voy').length
    const totalPast = pastEvents.length
    const totalAsistidos = pastEvents.filter((e) => e.asistencia?.[u.id] === 'voy').length
    const pctTotal = totalPast > 0 ? Math.round((totalAsistidos / totalPast) * 100) : 0

    return {
      ...u,
      actAsistidas,
      actTotal: pastActuaciones.length,
      ensAsistidos,
      ensTotal: pastEnsayos.length,
      pctTotal,
    }
  }).sort((a, b) => b.pctTotal - a.pctTotal)

  return (
    <div className="direccion-section">
      <h2>Dirección</h2>
      <p className="direccion-subtitle">Asistencia de todos los miembros</p>

      <div className="direccion-summary">
        <div className="direccion-summary-item">
          <span className="direccion-summary-value">{pastActuaciones.length}</span>
          <span className="direccion-summary-label">Actuaciones</span>
        </div>
        <div className="direccion-summary-item">
          <span className="direccion-summary-value">{pastEnsayos.length}</span>
          <span className="direccion-summary-label">Ensayos</span>
        </div>
        <div className="direccion-summary-item">
          <span className="direccion-summary-value">{approvedUsers.length}</span>
          <span className="direccion-summary-label">Miembros</span>
        </div>
      </div>

      <div className="direccion-table">
        <div className="direccion-table-header">
          <span className="direccion-col-name">Miembro</span>
          <span className="direccion-col-stat">Act.</span>
          <span className="direccion-col-stat">Ens.</span>
          <span className="direccion-col-stat">Total</span>
        </div>
        {memberStats.map((m) => (
          <div key={m.id} className="direccion-table-row">
            <div className="direccion-col-name">
              <MiniAvatar name={m.nombre} />
              <div>
                <div className="direccion-member-name">{m.nombre}</div>
                <div className="direccion-member-instrument">{m.instrumento}</div>
              </div>
            </div>
            <span className="direccion-col-stat">
              <span className="direccion-stat-value">{m.actAsistidas}</span>
              <span className="direccion-stat-max">/{m.actTotal}</span>
            </span>
            <span className="direccion-col-stat">
              <span className="direccion-stat-value">{m.ensAsistidos}</span>
              <span className="direccion-stat-max">/{m.ensTotal}</span>
            </span>
            <span className="direccion-col-stat">
              <span className={`direccion-pct ${m.pctTotal >= 75 ? 'pct-high' : m.pctTotal >= 50 ? 'pct-mid' : 'pct-low'}`}>
                {m.pctTotal}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Perfil() {
  const { user, userData, isAdmin, canAccessDireccion } = useAuth()
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

      <div className="perfil-actions">
        <Button variant="secondary" onClick={openEdit}>Editar perfil</Button>
        <Button variant="ghost" onClick={logout}>Cerrar sesión</Button>
      </div>

      {canAccessDireccion && (
        <DireccionSection users={users} events={events} />
      )}

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
                  <div className="toggle-row">
                    <span>Acceso a Dirección</span>
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
