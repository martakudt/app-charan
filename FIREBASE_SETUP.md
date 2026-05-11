# Firebase Setup for La Mandanga

## 1. Create Firebase project

1. Go to https://console.firebase.google.com
2. Create new project "la-mandanga"
3. Disable Google Analytics (not needed)

## 2. Enable Authentication

1. Go to Authentication > Sign-in method
2. Enable "Email/Password"

## 3. Create Firestore Database

1. Go to Firestore Database > Create database
2. Select region (europe-west1 for Spain)
3. Start in test mode, then apply rules from `firestore.rules`

## 4. Enable Storage

1. Go to Storage > Get started
2. Select same region
3. Default rules are fine for now

## 5. Get config

1. Go to Project Settings > General > Your apps
2. Click "Web" icon to add a web app
3. Register app name "la-mandanga-web"
4. Copy the config values to `.env`:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## 6. Set yourself as admin

After registering in the app:
1. Go to Firestore > users collection
2. Find your user document
3. Change `estado` to `"aprobado"` and `rol` to `"admin"`

## 7. Deploy Firestore rules

Copy contents of `firestore.rules` to Firestore > Rules tab and publish.

---

## Google Sheets Sync (solo owner)

Para que Marta pueda sincronizar los actos desde la Google Sheet de cuentas:

### 1. Google Cloud Console

1. Ir a https://console.cloud.google.com.
2. Crear o seleccionar un proyecto (puede ser el mismo de Firebase).
3. Habilitar **Google Sheets API** (APIs & Services → Library → buscar "Google Sheets API" → Enable).
4. Crear credenciales OAuth:
   - APIs & Services → Credentials → Create Credentials → OAuth client ID.
   - Si pide configurar OAuth consent screen primero: User Type "External", añadir tu email como Test User, scopes mínimos.
   - Application type: **Web application**.
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `https://<tu-dominio-netlify>` (ej: `https://lamandanga.netlify.app`)
   - Authorized redirect URIs: dejar vacío (usamos token client, no redirect).
5. Copiar el Client ID generado.

### 2. Variables de entorno

En `.env` local:
```
VITE_GOOGLE_OAUTH_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

En Netlify: Site Settings → Environment Variables → añadir `VITE_GOOGLE_OAUTH_CLIENT_ID`.

### 3. Reglas Firestore

Desplegar `firestore.rules` desde Firebase Console (Rules → Edit → pegar contenido del fichero → Publish).

### 4. Configuración inicial en la app

1. Abrir la app como `marta.torres@quantia.es`.
2. Ir a Gestión.
3. Pulsar Configurar en el bloque "Sincronización Google Sheets".
4. Pegar la URL de la Google Sheet CuentasCharanga.
5. Pulsar Sincronizar 2026, autorizar Google en el popup, revisar la vista previa, confirmar.
