import { useState } from 'react'
import Button from '../components/ui/Button'

export default function FolderForm({ onSubmit, onClose }) {
  const [nombre, setNombre] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!nombre.trim()) return
    onSubmit(nombre.trim())
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3 style={{ marginBottom: 16 }}>Nueva carpeta</h3>
      <input
        placeholder="Nombre de la carpeta"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        autoFocus
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Button type="submit">Crear</Button>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
      </div>
    </form>
  )
}
