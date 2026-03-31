import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEvents } from '../hooks/useEvents'
import { getUsers } from '../services/firestore'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import './event-detail.css'

const TYPE_COLORS = {
  actuacion: '#E91E7B',
  ensayo: '#666666',
  otro: '#F59E0B',
}

const TYPE_LABELS = {
  actuacion: 'Actuación',
  ensayo: 'Ensayo',
  otro: 'Otro',
}

function formatDate(timestamp) {
  if (!timestamp) return ''
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return d.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, canManageEvents } = useAuth()
  const { events, voteEvent } = useEvents()
  const [users, setUsers] = useState([])

  const event = events.find((e) => e.id === id)

  useEffect(() => {
    getUsers().then(setUsers)
  }, [])

  if (!event) {
    return <p style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>Cargando evento...</p>
  }

  const myVote = event.asistencia?.[user.uid]

  async function handleVote(vote) {
    await voteEvent(id, user.uid, vote)
  }

  function getUserInfo(uid) {
    return users.find((u) => u.id === uid) || { nombre: 'Desconocido', instrumento: '' }
  }

  const attendanceGroups = [
    { key: 'voy', label: 'Asisten', color: 'var(--color-success)', dotColor: '#22C55E' },
    { key: 'nose', label: 'Pendiente', color: 'var(--color-warning)', dotColor: '#F59E0B' },
    { key: 'no', label: 'No asisten', color: 'var(--color-danger)', dotColor: '#EF4444' },
  ]

  return (
    <div className="event-detail">
      <button className="event-detail-back" onClick={() => navigate('/agenda')}>
        ← Agenda
      </button>

      {event.imagenUrl && (
        <img src={event.imagenUrl} alt="" className="event-detail-image" />
      )}

      <span
        className="event-detail-type"
        style={{ background: TYPE_COLORS[event.tipo] }}
      >
        {TYPE_LABELS[event.tipo]}
      </span>

      <h1 className="event-detail-title">{event.nombre}</h1>

      <div className="event-detail-info">
        <div className="event-detail-info-row">
          <svg className="event-detail-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>{formatDate(event.fecha)}</span>
        </div>
        <div className="event-detail-info-row">
          <svg className="event-detail-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span>{event.ubicacion}</span>
        </div>
      </div>

      {event.descripcion && (
        <p className="event-detail-description">{event.descripcion}</p>
      )}

      <div className="vote-section">
        <h3>Tu respuesta</h3>
        <div className="vote-buttons">
          <button
            className={`vote-btn${myVote === 'voy' ? ' vote-btn-active vote-voy' : ''}`}
            onClick={() => handleVote('voy')}
          >
            <span className="vote-btn-icon" style={{ background: '#22C55E' }}>✓</span>
            Voy
          </button>
          <button
            className={`vote-btn${myVote === 'nose' ? ' vote-btn-active vote-nose' : ''}`}
            onClick={() => handleVote('nose')}
          >
            <span className="vote-btn-icon" style={{ background: '#F59E0B' }}>?</span>
            No sé
          </button>
          <button
            className={`vote-btn${myVote === 'no' ? ' vote-btn-active vote-no' : ''}`}
            onClick={() => handleVote('no')}
          >
            <span className="vote-btn-icon" style={{ background: '#EF4444' }}>✕</span>
            No voy
          </button>
        </div>
      </div>

      <Card className="attendance-card">
        <div className="attendance-header">Asistencia</div>
        {attendanceGroups.map((group) => {
          const uids = Object.entries(event.asistencia || {})
            .filter(([, v]) => v === group.key)
            .map(([uid]) => uid)

          return (
            <div key={group.key} className="attendance-group">
              <div className="attendance-group-header">
                <span className="attendance-group-dot" style={{ background: group.dotColor }} />
                <span>{group.label}</span>
                <span className="attendance-group-count">({uids.length})</span>
              </div>
              {uids.length === 0 ? (
                <p className="attendance-empty">Nadie</p>
              ) : (
                <div className="attendance-list">
                  {uids.map((uid) => {
                    const u = getUserInfo(uid)
                    return (
                      <div key={uid} className="attendance-item">
                        <span>{u.nombre}</span>
                        <span className="attendance-instrument">{u.instrumento}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </Card>

      {canManageEvents && (
        <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={() => navigate(`/agenda/${id}/editar`)}>
            Editar
          </Button>
        </div>
      )}
    </div>
  )
}
