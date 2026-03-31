import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFolders } from '../hooks/useScores'
import Card from '../components/ui/Card'
import FAB from '../components/ui/FAB'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import FolderForm from './FolderForm'
import './partituras.css'

export default function Partituras() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const { user, canManageScores } = useAuth()
  const { folders, loading, addFolder } = useFolders()
  const navigate = useNavigate()

  const filtered = folders.filter((f) =>
    f.nombre.toLowerCase().includes(search.toLowerCase())
  )

  async function handleAddFolder(nombre) {
    await addFolder(nombre, folders.length + 1, user.uid)
    setShowForm(false)
  }

  return (
    <div>
      <div className="page-header">
        <img src="/logo_mandanga.png" alt="" className="page-header-logo" />
        <h1 className="page-header-title">Partituras</h1>
      </div>

      <div className="partituras-search">
        <input
          placeholder="Buscar carpeta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>Cargando...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🎵"
          title="No hay partituras"
          message="Todavía no se han creado carpetas de partituras."
        />
      ) : (
        <div className="folder-grid">
          {filtered.map((folder) => (
            <Card
              key={folder.id}
              className="folder-card"
              onClick={() => navigate(`/partituras/${folder.id}`)}
            >
              <span className="folder-icon">📁</span>
              <div className="folder-info">
                <div className="folder-name">{folder.nombre}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {canManageScores && <FAB onClick={() => setShowForm(true)} />}

      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <FolderForm onSubmit={handleAddFolder} onClose={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  )
}
