import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { applyDiff } from '../../services/sheetsSync'
import './sheets-sync.css'

function formatShort(date) {
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtEur(n) {
  return new Intl.NumberFormat('de-DE').format(n || 0) + '€'
}

function CambioLine({ label, change }) {
  if (!change) return null
  return (
    <div className="preview-item-meta">
      {label}: {typeof change.antes === 'number' && label.includes('€') ? fmtEur(change.antes) : change.antes}
      {' -> '}
      {typeof change.despues === 'number' && label.includes('€') ? fmtEur(change.despues) : change.despues}
    </div>
  )
}

export default function SheetsSyncPreviewModal({ diff, tabName, currentUserEmail, onClose, onApplied }) {
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState('')

  const nada = diff.aCrear.length === 0 && diff.aActualizar.length === 0

  async function handleConfirm() {
    setApplying(true)
    setError('')
    try {
      const result = await applyDiff({ diff, currentUserEmail })
      onApplied?.(result)
      onClose?.()
    } catch (e) {
      setError(e.message || 'Error al sincronizar.')
      setApplying(false)
    }
  }

  return (
    <Modal onClose={applying ? undefined : onClose}>
      <h3 style={{ marginBottom: 4 }}>Vista previa de sincronización</h3>
      <div className="sheets-sync-meta">Pestaña: {tabName}</div>

      {nada && (
        <div className="preview-warn" style={{ marginTop: 16 }}>
          Ya está todo sincronizado. No hay cambios.
        </div>
      )}

      {diff.aCrear.length > 0 && (
        <div className="preview-section">
          <div className="preview-section-title">Crear ({diff.aCrear.length})</div>
          {diff.aCrear.map((item, i) => (
            <div key={i} className="preview-item">
              <div>{formatShort(item.candidate.fecha)}  ·  {item.candidate.nombre}  ·  {fmtEur(item.candidate.precio)}</div>
              <div className="preview-item-meta">
                {Object.keys(item.asistenciaResuelta).length} miembros
                {item.candidate.refuerzos.length > 0 ? ` + ${item.candidate.refuerzos.length} refuerzos` : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {diff.aActualizar.length > 0 && (
        <div className="preview-section">
          <div className="preview-section-title">Actualizar ({diff.aActualizar.length})</div>
          {diff.aActualizar.map((item, i) => (
            <div key={i} className="preview-item">
              <div>{formatShort(item.candidate.fecha)}  ·  {item.candidate.nombre}</div>
              <CambioLine label="precio" change={item.cambios.precio} />
              <CambioLine label="precio total" change={item.cambios.precioTotal} />
              <CambioLine label="asistentes" change={item.cambios.asistenciaCount} />
              <CambioLine label="refuerzos" change={item.cambios.refuerzosCount} />
            </div>
          ))}
        </div>
      )}

      {diff.soloEnApp.length > 0 && (
        <div className="preview-section">
          <div className="preview-section-title">En la app pero no en la GS ({diff.soloEnApp.length})</div>
          {diff.soloEnApp.map((e) => {
            const d = e.fecha?.toDate ? e.fecha.toDate() : new Date(e.fecha)
            return (
              <div key={e.id} className="preview-item">
                {formatShort(d)}  ·  {e.nombre}  (no se toca)
              </div>
            )
          })}
        </div>
      )}

      {diff.miembrosNoVinculados.length > 0 && (
        <div className="preview-warn">
          Miembros sin vincular: {diff.miembrosNoVinculados.join(', ')}.
          Configura su claveHistorico en Perfil para que su asistencia se cuente.
        </div>
      )}

      {error && <div className="preview-error">{error}</div>}

      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose} disabled={applying}>Cancelar</Button>
        <Button onClick={handleConfirm} disabled={applying || nada}>
          {applying ? 'Sincronizando...' : 'Confirmar sync'}
        </Button>
      </div>
    </Modal>
  )
}
