const SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly'
const CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID

let tokenInMemory = null
let tokenExpiresAt = 0

export function isOAuthConfigured() {
  return Boolean(CLIENT_ID)
}

function gisReady() {
  return typeof window !== 'undefined'
    && window.google
    && window.google.accounts
    && window.google.accounts.oauth2
}

export function getCachedToken() {
  if (!tokenInMemory) return null
  if (Date.now() >= tokenExpiresAt - 60_000) return null // refresh 1 min before expiry
  return tokenInMemory
}

export function clearToken() {
  tokenInMemory = null
  tokenExpiresAt = 0
}

async function waitForGis(timeoutMs = 3000) {
  const start = Date.now()
  while (!gisReady()) {
    if (Date.now() - start > timeoutMs) return false
    await new Promise((r) => setTimeout(r, 100))
  }
  return true
}

export async function requestSheetsToken() {
  if (!isOAuthConfigured()) {
    throw new Error('OAuth no configurado: falta VITE_GOOGLE_OAUTH_CLIENT_ID')
  }

  const ready = await waitForGis()
  if (!ready) {
    throw new Error('Google Identity Services no está disponible. ¿Has cargado el script?')
  }

  const cached = getCachedToken()
  if (cached) return cached

  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (response) => {
        if (response.error) {
          reject(new Error('Permiso denegado por Google: ' + response.error))
          return
        }
        tokenInMemory = response.access_token
        tokenExpiresAt = Date.now() + (response.expires_in || 3600) * 1000
        resolve(tokenInMemory)
      },
    })
    tokenClient.requestAccessToken({ prompt: '' })
  })
}
