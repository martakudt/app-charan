import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEvents } from '../hooks/useEvents'
import Card from '../components/ui/Card'
import Chip from '../components/ui/Chip'
import FAB from '../components/ui/FAB'
import EmptyState from '../components/ui/EmptyState'
import './agenda.css'

const TIPOS = [
  { value: 'todos', label: 'Todos' },
  { value: 'actuacion', label: 'Actuaciones' },
  { value: 'ensayo', label: 'Ensayos' },
  { value: 'otro', label: 'Otros' },
]

const STRIPE_COLORS = {
  actuacion: '#E91E7B',
  ensayo: '#666666',
  otro: '#F59E0B',
}

function formatDate(timestamp) {
  if (!timestamp) return ''
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return d.toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

export default function Agenda() {
  const [tab, setTab] = useState('proximos')
  const [filtro, setFiltro] = useState('todos')
  const { canManageEvents } = useAuth()
  const { events, loading } = useEvents()
  const navigate = useNavigate()

  const now = new Date()
  const filtered = events
    .filter((e) => {
      const date = e.fecha?.toDate ? e.fecha.toDate() : new Date(e.fecha)
      const isFuture = date >= now
      if (tab === 'proximos' && !isFuture) return false
      if (tab === 'anteriores' && isFuture) return false
      if (filtro !== 'todos' && e.tipo !== filtro) return false
      return true
    })
    .sort((a, b) => {
      const da = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha)
      const db = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha)
      return tab === 'proximos' ? da - db : db - da
    })

  function countAttendance(asistencia) {
    const vals = Object.values(asistencia || {})
    const voy = vals.filter((v) => v === 'voy').length
    const no = vals.filter((v) => v === 'no').length
    const nose = vals.filter((v) => v === 'nose').length
    return `${voy} Voy · ${no} No · ${nose} NS`
  }

  return (
    <div>
      <div className="agenda-header">
        <h1 className="agenda-title">Agenda</h1>
        <div className="agenda-tabs">
          <button
            className={`agenda-tab${tab === 'proximos' ? ' agenda-tab-active' : ''}`}
            onClick={() => setTab('proximos')}
          >
            Próximos
          </button>
          <button
            className={`agenda-tab${tab === 'anteriores' ? ' agenda-tab-active' : ''}`}
            onClick={() => setTab('anteriores')}
          >
            Anteriores
          </button>
        </div>
        <div className="agenda-filters">
          {TIPOS.map((t) => (
            <Chip
              key={t.value}
              label={t.label}
              active={filtro === t.value}
              onClick={() => setFiltro(t.value)}
            />
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>Cargando...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No hay eventos"
          message={tab === 'proximos' ? 'No tienes actos o ensayos programados.' : 'No hay eventos anteriores.'}
        />
      ) : (
        <div className="event-list">
          {filtered.map((event) => (
            <Card key={event.id} className="event-card" onClick={() => navigate(`/agenda/${event.id}`)}>
              {event.imagenUrl && (
                <img src={event.imagenUrl} alt="" className="event-card-image" />
              )}
              <div style={{ display: 'flex' }}>
                <div className="event-stripe" style={{ background: STRIPE_COLORS[event.tipo] || '#ccc' }} />
                <div className="event-card-body">
                  <div className="event-card-name">{event.nombre}</div>
                  <div className="event-card-meta">
                    {formatDate(event.fecha)} · {event.ubicacion}
                  </div>
                  <div className="event-card-attendance">{countAttendance(event.asistencia)}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {canManageEvents && <FAB onClick={() => navigate('/agenda/nuevo')} />}
    </div>
  )
}
