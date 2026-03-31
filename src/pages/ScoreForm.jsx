import { useState } from 'react'
import Button from '../components/ui/Button'

export default function ScoreForm({ onSubmit, onClose }) {
  const [nombre, setNombre] = useState('')
  const [urlDrive, setUrlDrive] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!nombre.trim() || !urlDrive.trim()) return
    onSubmit(nombre.trim(), urlDrive.trim())
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3 style={{ marginBottom: 16 }}>Nueva partitura</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          placeholder="Nombre de la pieza"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          autoFocus
        />
        <input
          placeholder="Enlace de Google Drive"
          value={urlDrive}
          onChange={(e) => setUrlDrive(e.target.value)}
          type="url"
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Button type="submit">Guardar</Button>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
      </div>
    </form>
  )
}
