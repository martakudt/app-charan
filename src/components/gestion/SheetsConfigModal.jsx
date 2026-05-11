import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { extractSpreadsheetId } from '../../services/sheetsApi'
import { saveSheetsConfig } from '../../services/sheetsConfig'
import './sheets-sync.css'

export default function SheetsConfigModal({ initialUrl = '', onClose, onSaved }) {
  const [url, setUrl] = useState(initialUrl)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setError('')
    const id = extractSpreadsheetId(url)
    if (!id) {
      setError('No reconozco esa URL. Pega el enlace completo de la hoja.')
      return
    }
    setSaving(true)
    try {
      await saveSheetsConfig({ spreadsheetId: id, spreadsheetUrl: url })
      onSaved?.({ spreadsheetId: id, spreadsheetUrl: url })
      onClose?.()
    } catch (e) {
      setError(e.message || 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3 style={{ marginBottom: 16 }}>Configurar Google Sheets</h3>
      <label className="form-label">URL de la hoja</label>
      <input
        type="url"
        placeholder="https://docs.google.com/spreadsheets/d/..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        autoFocus
      />
      <div style={{ fontSize: 12, color: '#777', marginTop: 6 }}>
        Pega la URL completa de tu hoja CuentasCharanga.
      </div>
      {error && <div className="preview-error">{error}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
      </div>
    </Modal>
  )
}
