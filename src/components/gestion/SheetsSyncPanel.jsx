import { useState, useEffect } from 'react'
import Button from '../ui/Button'
import SheetsConfigModal from './SheetsConfigModal'
import SheetsSyncPreviewModal from './SheetsSyncPreviewModal'
import { getSheetsConfig } from '../../services/sheetsConfig'
import { prepareSync } from '../../services/sheetsSync'
import { isOAuthConfigured } from '../../services/googleAuth'
import './sheets-sync.css'

function formatLastSync(ts) {
  if (!ts) return 'nunca'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    + ', ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

export default function SheetsSyncPanel({ year, eventos, users, currentUserEmail }) {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showConfig, setShowConfig] = useState(false)
  const [preview, setPreview] = useState(null) // { diff, tabName }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    let cancelled = false
    getSheetsConfig()
      .then((c) => { if (!cancelled) { setConfig(c); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  async function handleSync() {
    setError('')
    setToast('')
    setBusy(true)
    try {
      const { diff, tabName } = await prepareSync({ year, eventos, users })
      setPreview({ diff, tabName })
    } catch (e) {
      setError(e.message || 'Error al preparar sync.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return null
  if (!isOAuthConfigured()) {
    return (
      <div className="sheets-sync-panel">
        <div className="sheets-sync-title">Sincronización Google Sheets</div>
        <div className="sheets-sync-empty">
          OAuth no configurado. Falta VITE_GOOGLE_OAUTH_CLIENT_ID en variables de entorno.
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="sheets-sync-panel">
        <div className="sheets-sync-title">Sincronización Google Sheets</div>
        {config?.spreadsheetId ? (
          <>
            <div className="sheets-sync-info">
              Hoja configurada · Pestaña: {year}
            </div>
            <div className="sheets-sync-meta">
              Última sync: {formatLastSync(config.ultimaSync)}
              {config.ultimaSyncResultado && config.ultimaSync && (
                <> · {config.ultimaSyncResultado.creados} creados, {config.ultimaSyncResultado.actualizados} actualizados</>
              )}
            </div>
          </>
        ) : (
          <div className="sheets-sync-empty">No configurado.</div>
        )}
        {error && <div className="preview-error">{error}</div>}
        {toast && <div className="preview-warn">{toast}</div>}
        <div className="sheets-sync-actions">
          <Button variant="secondary" size="sm" onClick={() => setShowConfig(true)} disabled={busy}>
            Configurar
          </Button>
          <Button size="sm" onClick={handleSync} disabled={busy || !config?.spreadsheetId}>
            {busy ? 'Cargando...' : `Sincronizar ${year}`}
          </Button>
        </div>
      </div>

      {showConfig && (
        <SheetsConfigModal
          initialUrl={config?.spreadsheetUrl || ''}
          onClose={() => setShowConfig(false)}
          onSaved={(c) => setConfig((prev) => ({ ...(prev || {}), ...c }))}
        />
      )}

      {preview && (
        <SheetsSyncPreviewModal
          diff={preview.diff}
          tabName={preview.tabName}
          currentUserEmail={currentUserEmail}
          onClose={() => setPreview(null)}
          onApplied={(result) => {
            setToast(`Sincronizado: ${result.actualizados} actualizados, ${result.creados} creados.`)
            getSheetsConfig().then(setConfig).catch(() => {})
          }}
        />
      )}
    </>
  )
}
