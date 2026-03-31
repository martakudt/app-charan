import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { logout } from '../services/auth'
import { updateUser, updateEvent } from '../services/firestore'
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

function roundDown5(n) {
  return Math.floor(n / 5) * 5
}

function formatDateShort(timestamp) {
  if (!timestamp) return ''
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function EconomiaSection({ actuaciones }) {
  const [editingId, setEditingId] = useState(null)
  const [editPrecio, setEditPrecio] = useState('')
  const [editRefuerzos, setEditRefuerzos] = useState('')

  function openEdit(act) {
    setEditingId(act.id)
    setEditPrecio(act.precio ?? '')
    setEditRefuerzos(act.refuerzos ?? 0)
  }

  async function handleSave() {
    await updateEvent(editingId, {
      precio: Number(editPrecio) || 0,
      refuerzos: Number(editRefuerzos) || 0,
    })
    setEditingId(null)
  }

  const totalIngresos = actuaciones.reduce((sum, a) => sum + (a.precio || 0), 0)
  const totalBote = actuaciones.reduce((sum, a) => {
    if (!a.precio) return sum
    const asistentes = Object.values(a.asistencia || {}).filter((v) => v === 'voy').length
    const total = asistentes + (a.refuerzos || 0)
    if (total === 0) return sum
    const porPersona = roundDown5(a.precio / total)
    return sum + (a.precio - porPersona * total)
  }, 0)

  return (
    <div className="economia-section">
      <h3 className="economia-title">Economía por actuación</h3>

      <div className="economia-totals">
        <div className="economia-total-item">
          <span className="economia-total-value">{totalIngresos}€</span>
          <span className="economia-total-label">Total ingresos</span>
        </div>
        <div className="economia-total-item">
          <span className="economia-total-value economia-bote">{totalBote}€</span>
          <span className="economia-total-label">Bote acumulado</span>
        </div>
      </div>

      <div className="economia-list">
        {actuaciones.map((act) => {
          const asistentes = Object.values(act.asistencia || {}).filter((v) => v === 'voy').length
          const refuerzos = act.refuerzos || 0
          const totalPersonas = asistentes + refuerzos
          const precio = act.precio || 0
          const porPersona = totalPersonas > 0 ? roundDown5(precio / totalPersonas) : 0
          const bote = precio > 0 ? precio - porPersona * totalPersonas : 0

          return (
            <div key={act.id} className="economia-card">
              <div className="economia-card-header">
                <div>
                  <div className="economia-card-name">{act.nombre}</div>
                  <div className="economia-card-date">{formatDateShort(act.fecha)} · {act.ubicacion}</div>
                </div>
                <button className="economia-edit-btn" onClick={() => openEdit(act)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </div>

              <div className="economia-card-stats">
                <div className="economia-stat">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <span>{asistentes} miembros{refuerzos > 0 ? ` + ${refuerzos} refuerzos` : ''}</span>
                </div>
                {precio > 0 ? (
                  <>
                    <div className="economia-stat">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                      <span>{precio}€ total</span>
                    </div>
                    <div className="economia-resultado">
                      <span className="economia-por-persona">{porPersona}€/persona</span>
                      <span className="economia-bote-badge">Bote: {bote}€</span>
                    </div>
                  </>
                ) : (
                  <div className="economia-sin-precio">Sin precio asignado</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {editingId && (
        <Modal onClose={() => setEditingId(null)}>
          <h3 style={{ marginBottom: 16 }}>Editar datos económicos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="form-label">Precio del acto (€)</label>
              <input
                type="number"
                placeholder="0"
                value={editPrecio}
                onChange={(e) => setEditPrecio(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="form-label">Refuerzos (personas extra)</label>
              <input
                type="number"
                placeholder="0"
                value={editRefuerzos}
                onChange={(e) => setEditRefuerzos(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <Button onClick={handleSave}>Guardar</Button>
            <Button variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
          </div>
        </Modal>
      )}
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
    .sort((a, b) => {
      const da = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha)
      const db = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha)
      return db - da
    })
  const pastEnsayos = pastEvents.filter((e) => e.tipo === 'ensayo')

  const approvedUsers = users.filter((u) => u.estado === 'aprobado')

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

      <EconomiaSection actuaciones={pastActuaciones} />
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
