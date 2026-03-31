import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useFolders, useScoresInFolder } from '../hooks/useScores'
import Card from '../components/ui/Card'
import FAB from '../components/ui/FAB'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import ScoreForm from './ScoreForm'
import './partituras.css'

export default function Carpeta() {
  const { carpetaId } = useParams()
  const navigate = useNavigate()
  const { user, canManageScores } = useAuth()
  const { folders } = useFolders()
  const { scores, loading, addScore, deleteScore } = useScoresInFolder(carpetaId)
  const [showForm, setShowForm] = useState(false)

  const folder = folders.find((f) => f.id === carpetaId)

  async function handleAddScore(nombre, urlDrive) {
    await addScore(nombre, urlDrive, carpetaId, user.uid)
    setShowForm(false)
  }

  async function handleDelete(scoreId) {
    if (!window.confirm('¿Seguro que quieres eliminar esta partitura?')) return
    await deleteScore(scoreId)
  }

  return (
    <div>
      <button
        onClick={() => navigate('/partituras')}
        style={{ marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.9rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        ← Partituras
      </button>

      <h1 className="partituras-title">{folder?.nombre || 'Carpeta'}</h1>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>Cargando...</p>
      ) : scores.length === 0 ? (
        <EmptyState
          icon="📄"
          title="Carpeta vacía"
          message="Todavía no hay partituras en esta carpeta."
        />
      ) : (
        <div className="score-list">
          {scores.map((score) => (
            <Card key={score.id} className="score-item">
              <span className="score-icon">📄</span>
              <span
                className="score-name"
                onClick={() => window.open(score.urlDrive, '_blank')}
              >
                {score.nombre}
              </span>
              {canManageScores && (
                <button
                  className="score-delete"
                  onClick={() => handleDelete(score.id)}
                >
                  🗑️
                </button>
              )}
            </Card>
          ))}
        </div>
      )}

      {canManageScores && <FAB onClick={() => setShowForm(true)} />}

      {showForm && (
        <Modal onClose={() => setShowForm(false)}>
          <ScoreForm onSubmit={handleAddScore} onClose={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  )
}
