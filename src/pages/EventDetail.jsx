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
    { key: 'voy', label: 'Voy', emoji: '✅', color: 'var(--color-success)' },
    { key: 'nose', label: 'No sé', emoji: '🤷', color: 'var(--color-warning)' },
    { key: 'no', label: 'No voy', emoji: '❌', color: 'var(--color-danger)' },
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
        <span>📅 {formatDate(event.fecha)}</span>
        <span>📍 {event.ubicacion}</span>
      </div>

      {event.descripcion && (
        <p className="event-detail-description">{event.descripcion}</p>
      )}

      <div className="vote-section">
        <h3>¿Vas a ir?</h3>
        <div className="vote-buttons">
          <button
            className={`vote-btn${myVote === 'voy' ? ' vote-btn-active' : ''}`}
            style={{ background: '#dcfce7', color: 'var(--color-success)' }}
            onClick={() => handleVote('voy')}
          >
            ✅ Voy
          </button>
          <button
            className={`vote-btn${myVote === 'nose' ? ' vote-btn-active' : ''}`}
            style={{ background: '#fef3c7', color: 'var(--color-warning)' }}
            onClick={() => handleVote('nose')}
          >
            🤷 No sé
          </button>
          <button
            className={`vote-btn${myVote === 'no' ? ' vote-btn-active' : ''}`}
            style={{ background: '#fee2e2', color: 'var(--color-danger)' }}
            onClick={() => handleVote('no')}
          >
            ❌ No voy
          </button>
        </div>
      </div>

      <Card>
        <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>Asistencia</h3>
        {attendanceGroups.map((group) => {
          const uids = Object.entries(event.asistencia || {})
            .filter(([, v]) => v === group.key)
            .map(([uid]) => uid)

          return (
            <div key={group.key} className="attendance-group">
              <h4>
                {group.emoji} {group.label} ({uids.length})
              </h4>
              {uids.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', paddingLeft: 12 }}>Nadie</p>
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
