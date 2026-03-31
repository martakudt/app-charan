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
]

const STRIPE_COLORS = {
  actuacion: '#E91E7B',
  ensayo: '#666666',
  otro: '#F59E0B',
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function formatDate(timestamp) {
  if (!timestamp) return ''
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return d.toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

function toDate(timestamp) {
  if (!timestamp) return new Date()
  return timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days = []

  // Monday = 0, Sunday = 6
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  // Fill leading empty days
  for (let i = 0; i < startDow; i++) {
    days.push(null)
  }

  // Fill month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }

  return days
}

function Calendar({ events, selectedDate, onSelectDate }) {
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const days = getCalendarDays(viewDate.year, viewDate.month)
  const today = new Date()

  const monthLabel = new Date(viewDate.year, viewDate.month).toLocaleDateString('es-ES', {
    month: 'long'
  }) + ' ' + viewDate.year

  function prevMonth() {
    setViewDate((v) => {
      const d = new Date(v.year, v.month - 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  function nextMonth() {
    setViewDate((v) => {
      const d = new Date(v.year, v.month + 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  function getEventTypesForDay(day) {
    if (!day) return new Set()
    const types = new Set()
    events.forEach((e) => {
      const eDate = toDate(e.fecha)
      if (sameDay(eDate, day)) {
        types.add(e.tipo)
      }
    })
    return types
  }

  function handleDayClick(day) {
    if (!day) return
    if (selectedDate && sameDay(selectedDate, day)) {
      onSelectDate(null) // deselect
    } else {
      onSelectDate(day)
    }
  }

  const selectedLabel = selectedDate
    ? selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    : null

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button className="calendar-nav" onClick={prevMonth}>‹</button>
        <span className="calendar-title">{monthLabel}</span>
        <button className="calendar-nav" onClick={nextMonth}>›</button>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map((w) => (
          <div key={w} className="calendar-weekday">{w}</div>
        ))}

        {days.map((day, i) => {
          if (!day) {
            return <div key={`empty-${i}`} className="calendar-day calendar-day-empty" />
          }

          const isToday = sameDay(day, today)
          const isSelected = selectedDate && sameDay(day, selectedDate)
          const eventTypes = getEventTypesForDay(day)

          let className = 'calendar-day'
          if (isToday) className += ' calendar-day-today'
          if (isSelected) className += ' calendar-day-selected'
          if (!isSelected && eventTypes.has('actuacion')) className += ' calendar-day-event'
          if (!isSelected && eventTypes.has('ensayo') && !eventTypes.has('actuacion')) className += ' calendar-day-ensayo'

          return (
            <button key={day.getTime()} className={className} onClick={() => handleDayClick(day)}>
              {day.getDate()}
            </button>
          )
        })}
      </div>

      {selectedLabel && (
        <div className="calendar-selected-label">
          Eventos del {selectedLabel}
        </div>
      )}
    </div>
  )
}

export default function Agenda() {
  const [tab, setTab] = useState('proximos')
  const [filtro, setFiltro] = useState('todos')
  const [selectedDate, setSelectedDate] = useState(null)
  const { canManageEvents } = useAuth()
  const { events, loading } = useEvents()
  const navigate = useNavigate()

  const now = new Date()
  const filtered = events
    .filter((e) => {
      const date = toDate(e.fecha)
      const isFuture = date >= now
      if (tab === 'proximos' && !isFuture) return false
      if (tab === 'anteriores' && isFuture) return false
      if (filtro !== 'todos' && e.tipo !== filtro) return false
      if (selectedDate && !sameDay(date, selectedDate)) return false
      return true
    })
    .sort((a, b) => {
      const da = toDate(a.fecha)
      const db = toDate(b.fecha)
      return tab === 'proximos' ? da - db : db - da
    })

  function countAttendance(asistencia) {
    const vals = Object.values(asistencia || {})
    const voy = vals.filter((v) => v === 'voy').length
    const no = vals.filter((v) => v === 'no').length
    const nose = vals.filter((v) => v === 'nose').length
    return `${voy} Voy · ${no} No · ${nose} NS`
  }

  function handleTabChange(newTab) {
    setTab(newTab)
    setSelectedDate(null)
  }

  return (
    <div>
      <div className="agenda-header">
        <div className="page-header">
          <img src="/logo_mandanga.png" alt="" className="page-header-logo" />
          <h1 className="page-header-title">Agenda</h1>
        </div>
        <div className="agenda-tabs">
          <button
            className={`agenda-tab${tab === 'proximos' ? ' agenda-tab-active' : ''}`}
            onClick={() => handleTabChange('proximos')}
          >
            Próximos
          </button>
          <button
            className={`agenda-tab${tab === 'anteriores' ? ' agenda-tab-active' : ''}`}
            onClick={() => handleTabChange('anteriores')}
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

      <Calendar
        events={events}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>Cargando...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📅"
          title={selectedDate ? 'Sin eventos este día' : 'No hay eventos'}
          message={selectedDate ? 'No hay actos o ensayos para esta fecha.' : (tab === 'proximos' ? 'No tienes actos o ensayos programados.' : 'No hay eventos anteriores.')}
        />
      ) : (
        <div className="event-list">
          {filtered.map((event) => (
            <Card key={event.id} className="event-card" onClick={() => navigate(`/agenda/${event.id}`)}>
              <div style={{ display: 'flex', width: '100%' }}>
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
