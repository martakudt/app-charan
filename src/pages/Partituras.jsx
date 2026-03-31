import { useState, useEffect } from 'react'
import { listFolder, isFolder } from '../services/drive'
import './partituras.css'

const ROOT_FOLDER_ID = import.meta.env.VITE_DRIVE_ROOT_FOLDER_ID

function FolderIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}

export default function Partituras() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [breadcrumbs, setBreadcrumbs] = useState([
    { id: ROOT_FOLDER_ID, name: 'Partituras' }
  ])

  const currentFolderId = breadcrumbs[breadcrumbs.length - 1].id

  useEffect(() => {
    setLoading(true)
    setError('')
    listFolder(currentFolderId)
      .then(setFiles)
      .catch(() => setError('Error al cargar las partituras'))
      .finally(() => setLoading(false))
  }, [currentFolderId])

  function openFolder(file) {
    setBreadcrumbs((prev) => [...prev, { id: file.id, name: file.name }])
  }

  function goToBreadcrumb(index) {
    setBreadcrumbs((prev) => prev.slice(0, index + 1))
  }

  function handleFileClick(file) {
    if (isFolder(file)) {
      openFolder(file)
    } else {
      window.open(file.webViewLink, '_blank')
    }
  }

  const folders = files.filter(isFolder)
  const documents = files.filter((f) => !isFolder(f))

  return (
    <div>
      <div className="page-header">
        <img src="/logo_mandanga.png" alt="" className="page-header-logo" />
        <h1 className="page-header-title">Partituras</h1>
      </div>

      <div className="breadcrumbs">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.id} className="breadcrumb-item">
            {i > 0 && <span className="breadcrumb-sep">/</span>}
            <button
              className={`breadcrumb-btn${i === breadcrumbs.length - 1 ? ' breadcrumb-active' : ''}`}
              onClick={() => goToBreadcrumb(i)}
            >
              {crumb.name}
            </button>
          </span>
        ))}
      </div>

      {loading ? (
        <div className="partituras-loading">
          <div className="partituras-spinner" />
          <p>Cargando...</p>
        </div>
      ) : error ? (
        <div className="partituras-error">
          <p>{error}</p>
          <button className="partituras-retry" onClick={() => goToBreadcrumb(0)}>Reintentar</button>
        </div>
      ) : files.length === 0 ? (
        <div className="partituras-empty">
          <FileIcon />
          <p>Esta carpeta está vacía</p>
        </div>
      ) : (
        <div className="folder-grid">
          {folders.map((file) => (
            <button key={file.id} className="folder-card" onClick={() => handleFileClick(file)}>
              <div className="folder-icon-wrapper">
                <FolderIcon />
              </div>
              <div className="folder-info">
                <div className="folder-name">{file.name}</div>
                <div className="folder-hint">Carpeta</div>
              </div>
              <ChevronRight />
            </button>
          ))}

          {documents.map((file) => (
            <button key={file.id} className="folder-card" onClick={() => handleFileClick(file)}>
              <div className="folder-icon-wrapper folder-icon-file">
                <FileIcon />
              </div>
              <div className="folder-info">
                <div className="folder-name">{file.name}</div>
                <div className="folder-hint">Abrir partitura</div>
              </div>
              <ChevronRight />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
