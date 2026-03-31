import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEvents } from '../hooks/useEvents'
import Button from '../components/ui/Button'
import './event-form.css'

export default function EventForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { events, addEvent, updateEvent, deleteEvent } = useEvents()
  const isEdit = Boolean(id)
  const existing = isEdit ? events.find((e) => e.id === id) : null

  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('actuacion')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [duracion, setDuracion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (existing) {
      setNombre(existing.nombre || '')
      setTipo(existing.tipo || 'actuacion')
      setUbicacion(existing.ubicacion || '')
      setDescripcion(existing.descripcion || '')
      setDuracion(existing.duracion || '')
      if (existing.fecha) {
        const d = existing.fecha.toDate ? existing.fecha.toDate() : new Date(existing.fecha)
        setFecha(d.toISOString().split('T')[0])
        setHora(d.toTimeString().slice(0, 5))
      }
    }
  }, [existing])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nombre.trim() || !fecha || !hora || !ubicacion.trim()) {
      setError('Rellena nombre, fecha, hora y ubicación')
      return
    }
    setLoading(true)
    setError('')

    try {
      const fechaDate = new Date(`${fecha}T${hora}`)

      const data = {
        nombre: nombre.trim(),
        tipo,
        fecha: fechaDate,
        ubicacion: ubicacion.trim(),
        descripcion: descripcion.trim(),
        duracion: duracion.trim(),
        creadoPor: user.uid,
      }

      if (isEdit) {
        await updateEvent(id, data)
        navigate(`/agenda/${id}`)
      } else {
        const ref = await addEvent(data)
        navigate(`/agenda/${ref.id}`)
      }
    } catch (err) {
      setError('Error al guardar el evento')
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!window.confirm('¿Seguro que quieres eliminar este evento?')) return
    setLoading(true)
    await deleteEvent(id)
    navigate('/agenda')
  }

  return (
    <div className="event-form">
      <button className="event-detail-back" onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.9rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
        ← Volver
      </button>
      <h1>{isEdit ? 'Editar evento' : 'Nuevo evento'}</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Fiestas de Landete" />
        </div>

        <div className="form-group">
          <label className="form-label">Tipo</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="actuacion">Actuación</option>
            <option value="ensayo">Ensayo</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Hora</label>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Ubicación</label>
          <input value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Plaza Mayor, Landete" />
        </div>

        <div className="form-group">
          <label className="form-label">Duración (opcional)</label>
          <input value={duracion} onChange={(e) => setDuracion(e.target.value)} placeholder="Ej: 4 horas, mañana y tarde..." />
        </div>

        <div className="form-group">
          <label className="form-label">Descripción (opcional)</label>
          <textarea rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Detalles del evento..." />
        </div>

        {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: 8 }}>{error}</p>}

        <div className="form-actions">
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
          {isEdit && (
            <Button variant="danger" onClick={handleDelete} disabled={loading}>
              Eliminar evento
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
