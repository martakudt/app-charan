const API_KEY = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY
const BASE_URL = 'https://www.googleapis.com/drive/v3/files'

export async function listFolder(folderId) {
  const query = `'${folderId}' in parents and trashed = false`
  const fields = 'files(id,name,mimeType,webViewLink,iconLink,thumbnailLink)'
  const orderBy = 'folder,name'

  const url = `${BASE_URL}?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=${encodeURIComponent(orderBy)}&key=${API_KEY}`

  const res = await fetch(url)
  if (!res.ok) throw new Error('Error al cargar carpeta')
  const data = await res.json()
  const files = data.files || []
  return files.sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }))
}

export function isFolder(file) {
  return file.mimeType === 'application/vnd.google-apps.folder'
}
