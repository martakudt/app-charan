# La Mandanga App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a PWA for the 16 members of Charanga La Mandanga to manage sheet music (Google Drive links), coordinate event attendance via voting, and administer members with granular permissions.

**Architecture:** React SPA with Vite, Firebase for auth/database/storage, deployed as a PWA on Netlify. Three main sections (Agenda, Partituras, Perfil) with bottom tab navigation. Firebase Firestore for real-time data, Firebase Auth for user management, Firebase Storage for event photos.

**Tech Stack:** React 18, Vite 6, Firebase 10 (Auth, Firestore, Storage), React Router 7, CSS custom properties, Vite PWA plugin, Netlify

---

## File Structure

```
app-charan/
  index.html
  vite.config.js
  package.json
  .gitignore
  .env                          Firebase config (not committed)
  .env.example                  Template for .env
  public/
    logo.svg                    La Mandanga logo
  src/
    main.jsx                    App entry point
    App.jsx                     Router + AuthContext provider
    styles/
      variables.css             Color tokens + typography
      global.css                Reset + base styles
    services/
      firebase.js               Firebase init from env vars
      auth.js                   login, register, logout
      firestore.js              CRUD for users, events, folders, scores
      storage.js                Upload event images
    context/
      AuthContext.jsx            Auth state + user data + permissions
    hooks/
      useEvents.js              Subscribe to events, vote, CRUD
      useScores.js              Subscribe to folders/scores, CRUD
      useUsers.js               Admin: list users, approve, set permissions
    components/
      ui/
        Button.jsx              Primary/secondary/danger variants
        Card.jsx                White rounded card
        Modal.jsx               Overlay modal
        FAB.jsx                 Floating action button
        EmptyState.jsx          Icon + message for empty lists
        Chip.jsx                Filter chip (active/inactive)
      layout/
        BottomNav.jsx           3-tab bottom navigation
        AppLayout.jsx           Layout wrapper with BottomNav
    pages/
      Login.jsx                 Login + register forms
      PendingApproval.jsx       Waiting screen
      Agenda.jsx                Event list with tabs + filters
      EventDetail.jsx           Event info + voting + attendance list
      EventForm.jsx             Create/edit event form
      Partituras.jsx            Folder grid
      Carpeta.jsx               Scores list inside a folder
      ScoreForm.jsx             Add score form (name + Drive URL)
      FolderForm.jsx            Add folder form
      Perfil.jsx                User profile + admin panel
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `.gitignore`, `.env.example`, `src/main.jsx`, `src/App.jsx`

- [ ] **Step 1: Initialize project with Vite**

```bash
cd /c/Users/MartaTorresGómez/Documents/zcosas/app-charan
npm create vite@latest . -- --template react
```

Select "React" and "JavaScript" if prompted. Since the directory has files, Vite will ask to proceed — say yes.

- [ ] **Step 2: Install dependencies**

```bash
npm install firebase react-router-dom
npm install -D vite-plugin-pwa
```

- [ ] **Step 3: Clean up Vite boilerplate**

Delete these files that Vite created (we'll replace them):
- `src/App.css`
- `src/index.css`
- `src/assets/react.svg`
- `public/vite.svg`

```bash
rm src/App.css src/index.css src/assets/react.svg public/vite.svg
```

- [ ] **Step 4: Create `.gitignore`**

Replace the Vite-generated `.gitignore` with:

```
node_modules
dist
.env
.env.local
```

- [ ] **Step 5: Create `.env.example`**

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

- [ ] **Step 6: Configure Vite with PWA plugin**

`vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'La Mandanga',
        short_name: 'Mandanga',
        description: 'App de la Charanga La Mandanga',
        start_url: '/',
        display: 'standalone',
        background_color: '#FFF5F8',
        theme_color: '#E91E7B',
        orientation: 'portrait',
        icons: [
          {
            src: '/logo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      }
    })
  ]
})
```

- [ ] **Step 7: Write `index.html`**

Replace the Vite-generated `index.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="theme-color" content="#E91E7B">
  <link rel="apple-touch-icon" href="/logo.svg">
  <title>La Mandanga</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 8: Write `src/main.jsx`**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/variables.css'
import './styles/global.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 9: Write placeholder `src/App.jsx`**

```jsx
export default function App() {
  return <h1>La Mandanga</h1>
}
```

- [ ] **Step 10: Convert logo PDF to SVG and place in `public/`**

The logo is at `La_Mandanga_logo.pdf`. We need an SVG version for the PWA icon. Since PDF-to-SVG conversion in CLI is unreliable, create a simple SVG placeholder using the logo colors. The user can replace it with the real vectorized logo later.

Create `public/logo.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="95" fill="#E91E7B"/>
  <circle cx="100" cy="100" r="75" fill="#1A1A1A" stroke="#E91E7B" stroke-width="4"/>
  <text x="100" y="80" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="22" fill="#E91E7B" font-weight="bold">CHARANGA</text>
  <text x="100" y="115" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="28" fill="white" font-weight="bold">LA</text>
  <text x="100" y="148" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="26" fill="white" font-weight="bold">MANDANGA</text>
</svg>
```

- [ ] **Step 11: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite dev server starts, shows "La Mandanga" at `http://localhost:5173`.

- [ ] **Step 12: Initialize git and commit**

```bash
git init
git add package.json vite.config.js index.html .gitignore .env.example public/logo.svg src/main.jsx src/App.jsx
git commit -m "feat: scaffold Vite + React project with PWA config"
```

---

## Task 2: Styles — CSS Variables and Global Styles

**Files:**
- Create: `src/styles/variables.css`, `src/styles/global.css`

- [ ] **Step 1: Create `src/styles/variables.css`**

```css
:root {
  --color-primary: #E91E7B;
  --color-primary-light: #FFF5F8;
  --color-primary-hover: #D11A6E;
  --color-text: #1A1A1A;
  --color-text-secondary: #666666;
  --color-surface: #FFFFFF;
  --color-background: #FFF5F8;
  --color-border: #F0E0E8;
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;

  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --radius: 12px;
  --radius-sm: 8px;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.12);
  --nav-height: 64px;
}
```

- [ ] **Step 2: Create `src/styles/global.css`**

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  height: 100%;
  font-family: var(--font-family);
  background: var(--color-background);
  color: var(--color-text);
  -webkit-font-smoothing: antialiased;
}

body {
  overflow-x: hidden;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
}

input, select, textarea {
  font-family: inherit;
  font-size: 1rem;
  padding: 12px 16px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  outline: none;
  width: 100%;
  transition: border-color 0.2s;
}

input:focus, select:focus, textarea:focus {
  border-color: var(--color-primary);
}
```

- [ ] **Step 3: Verify styles load**

```bash
npm run dev
```

Expected: page background is pink-tinted (`#FFF5F8`), "La Mandanga" text is dark.

- [ ] **Step 4: Commit**

```bash
git add src/styles/
git commit -m "feat: add CSS variables and global styles with La Mandanga palette"
```

---

## Task 3: Firebase Services

**Files:**
- Create: `src/services/firebase.js`, `src/services/auth.js`, `src/services/firestore.js`, `src/services/storage.js`

- [ ] **Step 1: Create `src/services/firebase.js`**

```js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
```

- [ ] **Step 2: Create `src/services/auth.js`**

```js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

export async function register(email, password, nombre, instrumento) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  await setDoc(doc(db, 'users', user.uid), {
    email,
    nombre,
    instrumento,
    estado: 'pendiente',
    rol: 'miembro',
    permisos: { partituras: false, calendario: false },
    fechaRegistro: serverTimestamp(),
  })
  return user
}

export async function login(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  return user
}

export async function logout() {
  await signOut(auth)
}
```

- [ ] **Step 3: Create `src/services/firestore.js`**

```js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// --- Users ---

export function subscribeToUser(uid, callback) {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  })
}

export async function getUsers() {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function updateUser(uid, data) {
  await updateDoc(doc(db, 'users', uid), data)
}

// --- Events ---

export function subscribeToEvents(callback) {
  const q = query(collection(db, 'eventos'), orderBy('fecha', 'asc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function addEvent(data) {
  return addDoc(collection(db, 'eventos'), {
    ...data,
    asistencia: {},
  })
}

export async function updateEvent(id, data) {
  await updateDoc(doc(db, 'eventos', id), data)
}

export async function deleteEvent(id) {
  await deleteDoc(doc(db, 'eventos', id))
}

export async function voteEvent(eventId, uid, vote) {
  await updateDoc(doc(db, 'eventos', eventId), {
    [`asistencia.${uid}`]: vote,
  })
}

// --- Folders ---

export function subscribeToFolders(callback) {
  const q = query(collection(db, 'carpetas'), orderBy('orden', 'asc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function addFolder(nombre, orden, uid) {
  return addDoc(collection(db, 'carpetas'), {
    nombre,
    orden,
    creadoPor: uid,
  })
}

export async function deleteFolder(id) {
  await deleteDoc(doc(db, 'carpetas', id))
}

// --- Scores ---

export function subscribeToScores(carpetaId, callback) {
  const q = query(
    collection(db, 'partituras'),
    where('carpetaId', '==', carpetaId)
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function addScore(nombre, urlDrive, carpetaId, uid) {
  return addDoc(collection(db, 'partituras'), {
    nombre,
    urlDrive,
    carpetaId,
    creadoPor: uid,
  })
}

export async function deleteScore(id) {
  await deleteDoc(doc(db, 'partituras', id))
}
```

- [ ] **Step 4: Create `src/services/storage.js`**

```js
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

export async function uploadEventImage(file, eventId) {
  const storageRef = ref(storage, `eventos/${eventId}/${file.name}`)
  const snapshot = await uploadBytes(storageRef, file)
  return getDownloadURL(snapshot.ref)
}
```

- [ ] **Step 5: Commit**

```bash
git add src/services/
git commit -m "feat: add Firebase services for auth, firestore, and storage"
```

---

## Task 4: Auth Context and Routing

**Files:**
- Create: `src/context/AuthContext.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `src/context/AuthContext.jsx`**

```jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../services/firebase'
import { subscribeToUser } from '../services/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(undefined)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user)
      if (!user) {
        setUserData(null)
        setLoading(false)
      }
    })
  }, [])

  useEffect(() => {
    if (!firebaseUser) return
    return subscribeToUser(firebaseUser.uid, (data) => {
      setUserData(data)
      setLoading(false)
    })
  }, [firebaseUser])

  const value = {
    user: firebaseUser,
    userData,
    loading,
    isAdmin: userData?.rol === 'admin',
    canManageScores: userData?.rol === 'admin' || userData?.permisos?.partituras === true,
    canManageEvents: userData?.rol === 'admin' || userData?.permisos?.calendario === true,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 2: Update `src/App.jsx` with routing**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import PendingApproval from './pages/PendingApproval'
import Agenda from './pages/Agenda'
import EventDetail from './pages/EventDetail'
import EventForm from './pages/EventForm'
import Partituras from './pages/Partituras'
import Carpeta from './pages/Carpeta'
import Perfil from './pages/Perfil'
import AppLayout from './components/layout/AppLayout'

function AppRoutes() {
  const { user, userData, loading } = useAuth()

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <img src="/logo.svg" alt="La Mandanga" style={{ width: 80, opacity: 0.6 }} />
    </div>
  }

  if (!user) return <Login />

  if (userData?.estado === 'pendiente') return <PendingApproval />
  if (userData?.estado === 'rechazado') return <Login />
  if (userData?.estado !== 'aprobado') return <Login />

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/agenda" replace />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/agenda/:id" element={<EventDetail />} />
        <Route path="/agenda/nuevo" element={<EventForm />} />
        <Route path="/agenda/:id/editar" element={<EventForm />} />
        <Route path="/partituras" element={<Partituras />} />
        <Route path="/partituras/:carpetaId" element={<Carpeta />} />
        <Route path="/perfil" element={<Perfil />} />
      </Route>
      <Route path="*" element={<Navigate to="/agenda" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
```

- [ ] **Step 3: Create placeholder pages so the app compiles**

Create each file with a minimal export:

`src/pages/Login.jsx`:
```jsx
export default function Login() {
  return <div>Login</div>
}
```

`src/pages/PendingApproval.jsx`:
```jsx
export default function PendingApproval() {
  return <div>Pendiente de aprobación</div>
}
```

`src/pages/Agenda.jsx`:
```jsx
export default function Agenda() {
  return <div>Agenda</div>
}
```

`src/pages/EventDetail.jsx`:
```jsx
export default function EventDetail() {
  return <div>Detalle evento</div>
}
```

`src/pages/EventForm.jsx`:
```jsx
export default function EventForm() {
  return <div>Formulario evento</div>
}
```

`src/pages/Partituras.jsx`:
```jsx
export default function Partituras() {
  return <div>Partituras</div>
}
```

`src/pages/Carpeta.jsx`:
```jsx
export default function Carpeta() {
  return <div>Carpeta</div>
}
```

`src/pages/Perfil.jsx`:
```jsx
export default function Perfil() {
  return <div>Perfil</div>
}
```

- [ ] **Step 4: Create placeholder `AppLayout`**

`src/components/layout/AppLayout.jsx`:
```jsx
import { Outlet } from 'react-router-dom'

export default function AppLayout() {
  return (
    <div>
      <main><Outlet /></main>
    </div>
  )
}
```

- [ ] **Step 5: Verify app compiles and renders**

```bash
npm run dev
```

Expected: App shows "Login" text (since no user is authenticated).

- [ ] **Step 6: Commit**

```bash
git add src/context/ src/App.jsx src/pages/ src/components/
git commit -m "feat: add auth context, routing, and placeholder pages"
```

---

## Task 5: UI Components

**Files:**
- Create: `src/components/ui/Button.jsx`, `Card.jsx`, `Modal.jsx`, `FAB.jsx`, `EmptyState.jsx`, `Chip.jsx`
- Create: `src/components/ui/ui.css`

- [ ] **Step 1: Create `src/components/ui/ui.css`**

```css
/* Button */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 1rem;
  transition: background 0.2s, opacity 0.2s;
  width: 100%;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}
.btn-primary:hover { background: var(--color-primary-hover); }

.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
}

.btn-danger {
  background: var(--color-danger);
  color: white;
}

.btn-success {
  background: var(--color-success);
  color: white;
}

.btn-warning {
  background: var(--color-warning);
  color: white;
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
}

.btn-sm {
  padding: 8px 16px;
  font-size: 0.875rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Card */
.card {
  background: var(--color-surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 100;
  animation: fadeIn 0.2s;
}

.modal-content {
  background: var(--color-surface);
  border-radius: var(--radius) var(--radius) 0 0;
  padding: 24px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s;
}

.modal-handle {
  width: 40px;
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  margin: 0 auto 16px;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

/* FAB */
.fab {
  position: fixed;
  bottom: calc(var(--nav-height) + 16px);
  right: 16px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-lg);
  z-index: 50;
  transition: transform 0.2s;
}
.fab:active { transform: scale(0.9); }

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
  color: var(--color-text-secondary);
}
.empty-state-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}
.empty-state-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
}

/* Chip */
.chip {
  display: inline-flex;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  border: 2px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  transition: all 0.2s;
}
.chip-active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}
```

- [ ] **Step 2: Create `src/components/ui/Button.jsx`**

```jsx
import './ui.css'

export default function Button({ children, variant = 'primary', size, disabled, onClick, type = 'button' }) {
  const classes = `btn btn-${variant}${size === 'sm' ? ' btn-sm' : ''}`
  return (
    <button className={classes} disabled={disabled} onClick={onClick} type={type}>
      {children}
    </button>
  )
}
```

- [ ] **Step 3: Create `src/components/ui/Card.jsx`**

```jsx
import './ui.css'

export default function Card({ children, className = '', onClick, style }) {
  return (
    <div className={`card ${className}`} onClick={onClick} style={style}>
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Create `src/components/ui/Modal.jsx`**

```jsx
import './ui.css'

export default function Modal({ children, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create `src/components/ui/FAB.jsx`**

```jsx
import './ui.css'

export default function FAB({ onClick }) {
  return (
    <button className="fab" onClick={onClick} aria-label="Añadir">
      +
    </button>
  )
}
```

- [ ] **Step 6: Create `src/components/ui/EmptyState.jsx`**

```jsx
import './ui.css'

export default function EmptyState({ icon, title, message }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      <p>{message}</p>
    </div>
  )
}
```

- [ ] **Step 7: Create `src/components/ui/Chip.jsx`**

```jsx
import './ui.css'

export default function Chip({ label, active, onClick }) {
  return (
    <button className={`chip${active ? ' chip-active' : ''}`} onClick={onClick}>
      {label}
    </button>
  )
}
```

- [ ] **Step 8: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add UI components (Button, Card, Modal, FAB, EmptyState, Chip)"
```

---

## Task 6: Bottom Navigation and Layout

**Files:**
- Create: `src/components/layout/BottomNav.jsx`, `src/components/layout/layout.css`
- Modify: `src/components/layout/AppLayout.jsx`

- [ ] **Step 1: Create `src/components/layout/layout.css`**

```css
.app-layout {
  min-height: 100vh;
  padding-bottom: var(--nav-height);
}

.app-main {
  padding: 16px;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--nav-height);
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: space-around;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
  z-index: 90;
}

.nav-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 16px;
  background: none;
  color: var(--color-text-secondary);
  font-size: 0.7rem;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-tab-active {
  color: var(--color-primary);
}

.nav-tab-icon {
  font-size: 24px;
}
```

- [ ] **Step 2: Create `src/components/layout/BottomNav.jsx`**

```jsx
import { useLocation, useNavigate } from 'react-router-dom'
import './layout.css'

const tabs = [
  { path: '/agenda', label: 'Agenda', icon: '📅' },
  { path: '/partituras', label: 'Partituras', icon: '🎵' },
  { path: '/perfil', label: 'Perfil', icon: '👤' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const active = location.pathname.startsWith(tab.path)
        return (
          <button
            key={tab.path}
            className={`nav-tab${active ? ' nav-tab-active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <span className="nav-tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 3: Update `src/components/layout/AppLayout.jsx`**

```jsx
import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import './layout.css'

export default function AppLayout() {
  return (
    <div className="app-layout">
      <main className="app-main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 4: Verify navigation renders**

```bash
npm run dev
```

Expected: bottom nav with 3 tabs visible, clicking tabs changes route.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/
git commit -m "feat: add bottom navigation and app layout"
```

---

## Task 7: Login and Registration Page

**Files:**
- Modify: `src/pages/Login.jsx`
- Create: `src/pages/login.css`

- [ ] **Step 1: Create `src/pages/login.css`**

```css
.login-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background);
  padding: 24px;
}

.login-card {
  background: var(--color-surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  padding: 40px 24px;
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.login-logo {
  width: 120px;
  height: 120px;
  margin: 0 auto 24px;
}

.login-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.login-subtitle {
  color: var(--color-text-secondary);
  margin-bottom: 32px;
  font-size: 0.9rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.login-error {
  color: var(--color-danger);
  font-size: 0.875rem;
  min-height: 20px;
}

.login-toggle {
  color: var(--color-primary);
  font-size: 0.875rem;
  background: none;
  margin-top: 8px;
}
```

- [ ] **Step 2: Implement `src/pages/Login.jsx`**

```jsx
import { useState } from 'react'
import { login, register } from '../services/auth'
import Button from '../components/ui/Button'
import './login.css'

const INSTRUMENTOS = [
  'Clarinete', 'Saxofón', 'Trompeta', 'Trombón', 'Tuba',
  'Bombardino', 'Flauta', 'Percusión', 'Caja', 'Bombo', 'Otro'
]

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [instrumento, setInstrumento] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isRegister) {
        if (!nombre.trim() || !instrumento) {
          setError('Rellena todos los campos')
          setLoading(false)
          return
        }
        await register(email, password, nombre.trim(), instrumento)
      } else {
        await login(email, password)
      }
    } catch (err) {
      const messages = {
        'auth/invalid-credential': 'Email o contraseña incorrectos',
        'auth/email-already-in-use': 'Este email ya está registrado',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
        'auth/invalid-email': 'Email no válido',
      }
      setError(messages[err.code] || 'Error al iniciar sesión')
    }
    setLoading(false)
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <img src="/logo.svg" alt="La Mandanga" className="login-logo" />
        <h1 className="login-title">La Mandanga</h1>
        <p className="login-subtitle">
          {isRegister ? 'Crea tu cuenta' : 'Inicia sesión para acceder'}
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <input
                type="text"
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              <select
                value={instrumento}
                onChange={(e) => setInstrumento(e.target.value)}
              >
                <option value="">Selecciona instrumento</option>
                {INSTRUMENTOS.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
          <p className="login-error">{error}</p>
          <Button type="submit" disabled={loading}>
            {loading ? 'Cargando...' : isRegister ? 'Crear cuenta' : 'Entrar'}
          </Button>
          <Button variant="secondary" onClick={() => { setIsRegister(!isRegister); setError('') }}>
            {isRegister ? 'Ya tengo cuenta' : 'Crear cuenta'}
          </Button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify login page renders**

```bash
npm run dev
```

Expected: Login screen with logo, form fields, and buttons styled in La Mandanga colors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Login.jsx src/pages/login.css
git commit -m "feat: implement login and registration page"
```

---

## Task 8: Pending Approval Page

**Files:**
- Modify: `src/pages/PendingApproval.jsx`

- [ ] **Step 1: Implement `src/pages/PendingApproval.jsx`**

```jsx
import { logout } from '../services/auth'
import Button from '../components/ui/Button'
import './login.css'

export default function PendingApproval() {
  return (
    <div className="login-screen">
      <div className="login-card">
        <div style={{ fontSize: 64, marginBottom: 24 }}>⏳</div>
        <h1 className="login-title">Cuenta pendiente</h1>
        <p className="login-subtitle">
          Tu cuenta está esperando aprobación. El administrador la activará pronto.
        </p>
        <Button variant="ghost" onClick={logout}>Cerrar sesión</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/PendingApproval.jsx
git commit -m "feat: implement pending approval screen"
```

---

## Task 9: Agenda Page — Event List

**Files:**
- Modify: `src/pages/Agenda.jsx`
- Create: `src/pages/agenda.css`
- Create: `src/hooks/useEvents.js`

- [ ] **Step 1: Create `src/hooks/useEvents.js`**

```js
import { useState, useEffect } from 'react'
import { subscribeToEvents, voteEvent, addEvent, updateEvent, deleteEvent } from '../services/firestore'

export function useEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeToEvents((data) => {
      setEvents(data)
      setLoading(false)
    })
    return unsub
  }, [])

  return { events, loading, voteEvent, addEvent, updateEvent, deleteEvent }
}
```

- [ ] **Step 2: Create `src/pages/agenda.css`**

```css
.agenda-header {
  margin-bottom: 16px;
}

.agenda-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.agenda-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--color-border);
  margin-bottom: 12px;
}

.agenda-tab {
  flex: 1;
  padding: 10px;
  text-align: center;
  font-weight: 600;
  font-size: 0.9rem;
  background: none;
  color: var(--color-text-secondary);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
}

.agenda-tab-active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.agenda-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-card {
  display: flex;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s;
}
.event-card:active { transform: scale(0.98); }

.event-stripe {
  width: 5px;
  flex-shrink: 0;
  border-radius: var(--radius) 0 0 var(--radius);
}

.event-card-body {
  flex: 1;
  padding: 14px;
}

.event-card-image {
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: var(--radius) var(--radius) 0 0;
}

.event-card-name {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 4px;
}

.event-card-meta {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.event-card-attendance {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}
```

- [ ] **Step 3: Implement `src/pages/Agenda.jsx`**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEvents } from '../hooks/useEvents'
import Card from '../components/ui/Card'
import Chip from '../components/ui/Chip'
import FAB from '../components/ui/FAB'
import EmptyState from '../components/ui/EmptyState'
import './agenda.css'

const TIPOS = [
  { value: 'todos', label: 'Todos' },
  { value: 'actuacion', label: 'Actuaciones' },
  { value: 'ensayo', label: 'Ensayos' },
  { value: 'otro', label: 'Otros' },
]

const STRIPE_COLORS = {
  actuacion: '#E91E7B',
  ensayo: '#666666',
  otro: '#F59E0B',
}

function formatDate(timestamp) {
  if (!timestamp) return ''
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return d.toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

export default function Agenda() {
  const [tab, setTab] = useState('proximos')
  const [filtro, setFiltro] = useState('todos')
  const { canManageEvents } = useAuth()
  const { events, loading } = useEvents()
  const navigate = useNavigate()

  const now = new Date()
  const filtered = events
    .filter((e) => {
      const date = e.fecha?.toDate ? e.fecha.toDate() : new Date(e.fecha)
      const isFuture = date >= now
      if (tab === 'proximos' && !isFuture) return false
      if (tab === 'anteriores' && isFuture) return false
      if (filtro !== 'todos' && e.tipo !== filtro) return false
      return true
    })
    .sort((a, b) => {
      const da = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha)
      const db = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha)
      return tab === 'proximos' ? da - db : db - da
    })

  function countAttendance(asistencia) {
    const vals = Object.values(asistencia || {})
    const voy = vals.filter((v) => v === 'voy').length
    const no = vals.filter((v) => v === 'no').length
    const nose = vals.filter((v) => v === 'nose').length
    return `${voy} Voy · ${no} No · ${nose} NS`
  }

  return (
    <div>
      <div className="agenda-header">
        <h1 className="agenda-title">Agenda</h1>
        <div className="agenda-tabs">
          <button
            className={`agenda-tab${tab === 'proximos' ? ' agenda-tab-active' : ''}`}
            onClick={() => setTab('proximos')}
          >
            Próximos
          </button>
          <button
            className={`agenda-tab${tab === 'anteriores' ? ' agenda-tab-active' : ''}`}
            onClick={() => setTab('anteriores')}
          >
            Anteriores
          </button>
        </div>
        <div className="agenda-filters">
          {TIPOS.map((t) => (
            <Chip
              key={t.value}
              label={t.label}
              active={filtro === t.value}
              onClick={() => setFiltro(t.value)}
            />
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>Cargando...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No hay eventos"
          message={tab === 'proximos' ? 'No tienes actos o ensayos programados.' : 'No hay eventos anteriores.'}
        />
      ) : (
        <div className="event-list">
          {filtered.map((event) => (
            <Card key={event.id} className="event-card" onClick={() => navigate(`/agenda/${event.id}`)}>
              {event.imagenUrl && (
                <img src={event.imagenUrl} alt="" className="event-card-image" />
              )}
              <div style={{ display: 'flex' }}>
                <div className="event-stripe" style={{ background: STRIPE_COLORS[event.tipo] || '#ccc' }} />
                <div className="event-card-body">
                  <div className="event-card-name">{event.nombre}</div>
                  <div className="event-card-meta">
                    {formatDate(event.fecha)} · {event.ubicacion}
                  </div>
                  <div className="event-card-attendance">{countAttendance(event.asistencia)}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {canManageEvents && <FAB onClick={() => navigate('/agenda/nuevo')} />}
    </div>
  )
}
```

- [ ] **Step 4: Verify agenda page renders**

```bash
npm run dev
```

Expected: Agenda page with tabs, filters, and empty state message.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useEvents.js src/pages/Agenda.jsx src/pages/agenda.css
git commit -m "feat: implement agenda page with event list, tabs, and filters"
```

---

## Task 10: Event Detail Page with Voting

**Files:**
- Modify: `src/pages/EventDetail.jsx`
- Create: `src/pages/event-detail.css`

- [ ] **Step 1: Create `src/pages/event-detail.css`**

```css
.event-detail {
  padding-bottom: 24px;
}

.event-detail-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
  color: var(--color-primary);
  background: none;
  margin-bottom: 16px;
}

.event-detail-image {
  width: calc(100% + 32px);
  margin: -16px -16px 16px;
  height: 200px;
  object-fit: cover;
}

.event-detail-type {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  margin-bottom: 8px;
}

.event-detail-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.event-detail-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.event-detail-description {
  margin-bottom: 24px;
  line-height: 1.5;
}

.vote-section {
  margin-bottom: 24px;
}

.vote-section h3 {
  font-size: 1rem;
  margin-bottom: 12px;
}

.vote-buttons {
  display: flex;
  gap: 8px;
}

.vote-btn {
  flex: 1;
  padding: 12px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.9rem;
  text-align: center;
  border: 2px solid transparent;
  opacity: 0.5;
  transition: all 0.2s;
}

.vote-btn-active {
  opacity: 1;
  border-color: currentColor;
  transform: scale(1.05);
}

.attendance-group {
  margin-bottom: 16px;
}

.attendance-group h4 {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.attendance-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.attendance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--color-background);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
}

.attendance-instrument {
  color: var(--color-text-secondary);
  font-size: 0.8rem;
}
```

- [ ] **Step 2: Implement `src/pages/EventDetail.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEvents } from '../hooks/useEvents'
import { getUsers } from '../services/firestore'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import './event-detail.css'

const TYPE_COLORS = {
  actuacion: '#E91E7B',
  ensayo: '#666666',
  otro: '#F59E0B',
}

const TYPE_LABELS = {
  actuacion: 'Actuación',
  ensayo: 'Ensayo',
  otro: 'Otro',
}

function formatDate(timestamp) {
  if (!timestamp) return ''
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return d.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, canManageEvents } = useAuth()
  const { events, voteEvent } = useEvents()
  const [users, setUsers] = useState([])

  const event = events.find((e) => e.id === id)

  useEffect(() => {
    getUsers().then(setUsers)
  }, [])

  if (!event) {
    return <p style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>Cargando evento...</p>
  }

  const myVote = event.asistencia?.[user.uid]

  async function handleVote(vote) {
    await voteEvent(id, user.uid, vote)
  }

  function getUserInfo(uid) {
    return users.find((u) => u.id === uid) || { nombre: 'Desconocido', instrumento: '' }
  }

  const attendanceGroups = [
    { key: 'voy', label: 'Voy', emoji: '✅', color: 'var(--color-success)' },
    { key: 'nose', label: 'No sé', emoji: '🤷', color: 'var(--color-warning)' },
    { key: 'no', label: 'No voy', emoji: '❌', color: 'var(--color-danger)' },
  ]

  return (
    <div className="event-detail">
      <button className="event-detail-back" onClick={() => navigate('/agenda')}>
        ← Agenda
      </button>

      {event.imagenUrl && (
        <img src={event.imagenUrl} alt="" className="event-detail-image" />
      )}

      <span
        className="event-detail-type"
        style={{ background: TYPE_COLORS[event.tipo] }}
      >
        {TYPE_LABELS[event.tipo]}
      </span>

      <h1 className="event-detail-title">{event.nombre}</h1>

      <div className="event-detail-info">
        <span>📅 {formatDate(event.fecha)}</span>
        <span>📍 {event.ubicacion}</span>
      </div>

      {event.descripcion && (
        <p className="event-detail-description">{event.descripcion}</p>
      )}

      <div className="vote-section">
        <h3>¿Vas a ir?</h3>
        <div className="vote-buttons">
          <button
            className={`vote-btn${myVote === 'voy' ? ' vote-btn-active' : ''}`}
            style={{ background: '#dcfce7', color: 'var(--color-success)' }}
            onClick={() => handleVote('voy')}
          >
            ✅ Voy
          </button>
          <button
            className={`vote-btn${myVote === 'nose' ? ' vote-btn-active' : ''}`}
            style={{ background: '#fef3c7', color: 'var(--color-warning)' }}
            onClick={() => handleVote('nose')}
          >
            🤷 No sé
          </button>
          <button
            className={`vote-btn${myVote === 'no' ? ' vote-btn-active' : ''}`}
            style={{ background: '#fee2e2', color: 'var(--color-danger)' }}
            onClick={() => handleVote('no')}
          >
            ❌ No voy
          </button>
        </div>
      </div>

      <Card>
        <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>Asistencia</h3>
        {attendanceGroups.map((group) => {
          const uids = Object.entries(event.asistencia || {})
            .filter(([, v]) => v === group.key)
            .map(([uid]) => uid)

          return (
            <div key={group.key} className="attendance-group">
              <h4>
                {group.emoji} {group.label} ({uids.length})
              </h4>
              {uids.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', paddingLeft: 12 }}>Nadie</p>
              ) : (
                <div className="attendance-list">
                  {uids.map((uid) => {
                    const u = getUserInfo(uid)
                    return (
                      <div key={uid} className="attendance-item">
                        <span>{u.nombre}</span>
                        <span className="attendance-instrument">{u.instrumento}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </Card>

      {canManageEvents && (
        <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={() => navigate(`/agenda/${id}/editar`)}>
            Editar
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/EventDetail.jsx src/pages/event-detail.css
git commit -m "feat: implement event detail page with voting and attendance list"
```

---

## Task 11: Event Form (Create / Edit)

**Files:**
- Modify: `src/pages/EventForm.jsx`
- Create: `src/pages/event-form.css`

- [ ] **Step 1: Create `src/pages/event-form.css`**

```css
.event-form {
  padding-bottom: 24px;
}

.event-form h1 {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--color-text-secondary);
}

.form-row {
  display: flex;
  gap: 8px;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 24px;
}

.image-preview {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  margin-top: 8px;
}
```

- [ ] **Step 2: Implement `src/pages/EventForm.jsx`**

```jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEvents } from '../hooks/useEvents'
import { uploadEventImage } from '../services/storage'
import Button from '../components/ui/Button'
import './event-form.css'

export default function EventForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { events, addEvent, updateEvent, deleteEvent } = useEvents()
  const isEdit = Boolean(id)
  const existing = isEdit ? events.find((e) => e.id === id) : null

  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('actuacion')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (existing) {
      setNombre(existing.nombre || '')
      setTipo(existing.tipo || 'actuacion')
      setUbicacion(existing.ubicacion || '')
      setDescripcion(existing.descripcion || '')
      setImagePreview(existing.imagenUrl || '')
      if (existing.fecha) {
        const d = existing.fecha.toDate ? existing.fecha.toDate() : new Date(existing.fecha)
        setFecha(d.toISOString().split('T')[0])
        setHora(d.toTimeString().slice(0, 5))
      }
    }
  }, [existing])

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nombre.trim() || !fecha || !hora || !ubicacion.trim()) {
      setError('Rellena nombre, fecha, hora y ubicación')
      return
    }
    setLoading(true)
    setError('')

    try {
      const fechaDate = new Date(`${fecha}T${hora}`)
      let imagenUrl = isEdit ? (existing?.imagenUrl || '') : ''

      if (imageFile) {
        const tempId = isEdit ? id : Date.now().toString()
        imagenUrl = await uploadEventImage(imageFile, tempId)
      }

      const data = {
        nombre: nombre.trim(),
        tipo,
        fecha: fechaDate,
        ubicacion: ubicacion.trim(),
        descripcion: descripcion.trim(),
        imagenUrl,
        creadoPor: user.uid,
      }

      if (isEdit) {
        await updateEvent(id, data)
        navigate(`/agenda/${id}`)
      } else {
        const ref = await addEvent(data)
        navigate(`/agenda/${ref.id}`)
      }
    } catch (err) {
      setError('Error al guardar el evento')
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!window.confirm('¿Seguro que quieres eliminar este evento?')) return
    setLoading(true)
    await deleteEvent(id)
    navigate('/agenda')
  }

  return (
    <div className="event-form">
      <button className="event-detail-back" onClick={() => navigate(-1)}>
        ← Volver
      </button>
      <h1>{isEdit ? 'Editar evento' : 'Nuevo evento'}</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Fiestas de Landete" />
        </div>

        <div className="form-group">
          <label className="form-label">Tipo</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="actuacion">Actuación</option>
            <option value="ensayo">Ensayo</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Hora</label>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Ubicación</label>
          <input value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Plaza Mayor, Landete" />
        </div>

        <div className="form-group">
          <label className="form-label">Descripción (opcional)</label>
          <textarea rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Detalles del evento..." />
        </div>

        <div className="form-group">
          <label className="form-label">Foto (opcional)</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imagePreview && <img src={imagePreview} alt="Preview" className="image-preview" />}
        </div>

        {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: 8 }}>{error}</p>}

        <div className="form-actions">
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
          {isEdit && (
            <Button variant="danger" onClick={handleDelete} disabled={loading}>
              Eliminar evento
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/EventForm.jsx src/pages/event-form.css
git commit -m "feat: implement event create/edit form with image upload"
```

---

## Task 12: Partituras — Folder List

**Files:**
- Modify: `src/pages/Partituras.jsx`
- Create: `src/pages/partituras.css`
- Create: `src/hooks/useScores.js`
- Create: `src/pages/FolderForm.jsx`

- [ ] **Step 1: Create `src/hooks/useScores.js`**

```js
import { useState, useEffect } from 'react'
import {
  subscribeToFolders,
  subscribeToScores,
  addFolder,
  deleteFolder,
  addScore,
  deleteScore,
} from '../services/firestore'

export function useFolders() {
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeToFolders((data) => {
      setFolders(data)
      setLoading(false)
    })
    return unsub
  }, [])

  return { folders, loading, addFolder, deleteFolder }
}

export function useScoresInFolder(carpetaId) {
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!carpetaId) return
    const unsub = subscribeToScores(carpetaId, (data) => {
      setScores(data)
      setLoading(false)
    })
    return unsub
  }, [carpetaId])

  return { scores, loading, addScore, deleteScore }
}
```

- [ ] **Step 2: Create `src/pages/partituras.css`**

```css
.partituras-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.partituras-search {
  margin-bottom: 16px;
}

.folder-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.folder-card {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.15s;
}
.folder-card:active { transform: scale(0.98); }

.folder-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.folder-info {
  flex: 1;
}

.folder-name {
  font-weight: 600;
  font-size: 1rem;
}

.folder-count {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.score-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
  transition: transform 0.15s;
}
.score-item:active { transform: scale(0.98); }

.score-icon {
  font-size: 24px;
  color: var(--color-danger);
  flex-shrink: 0;
}

.score-name {
  flex: 1;
  font-weight: 500;
}

.score-delete {
  background: none;
  color: var(--color-text-secondary);
  font-size: 18px;
  padding: 4px 8px;
}
```

- [ ] **Step 3: Create `src/pages/FolderForm.jsx`**

```jsx
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
```

- [ ] **Step 4: Implement `src/pages/Partituras.jsx`**

```jsx
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
      <h1 className="partituras-title">Partituras</h1>

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
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useScores.js src/pages/Partituras.jsx src/pages/partituras.css src/pages/FolderForm.jsx
git commit -m "feat: implement partituras folder list with search and creation"
```

---

## Task 13: Carpeta Page — Score List

**Files:**
- Modify: `src/pages/Carpeta.jsx`
- Create: `src/pages/ScoreForm.jsx`

- [ ] **Step 1: Create `src/pages/ScoreForm.jsx`**

```jsx
import { useState } from 'react'
import Button from '../components/ui/Button'

export default function ScoreForm({ onSubmit, onClose }) {
  const [nombre, setNombre] = useState('')
  const [urlDrive, setUrlDrive] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!nombre.trim() || !urlDrive.trim()) return
    onSubmit(nombre.trim(), urlDrive.trim())
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3 style={{ marginBottom: 16 }}>Nueva partitura</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          placeholder="Nombre de la pieza"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          autoFocus
        />
        <input
          placeholder="Enlace de Google Drive"
          value={urlDrive}
          onChange={(e) => setUrlDrive(e.target.value)}
          type="url"
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Button type="submit">Guardar</Button>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Implement `src/pages/Carpeta.jsx`**

```jsx
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
        className="event-detail-back"
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
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Carpeta.jsx src/pages/ScoreForm.jsx
git commit -m "feat: implement folder detail page with score list and management"
```

---

## Task 14: Perfil Page and Admin Panel

**Files:**
- Modify: `src/pages/Perfil.jsx`
- Create: `src/pages/perfil.css`
- Create: `src/hooks/useUsers.js`

- [ ] **Step 1: Create `src/hooks/useUsers.js`**

```js
import { useState, useEffect } from 'react'
import { getUsers, updateUser } from '../services/firestore'

export function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  async function refresh() {
    const data = await getUsers()
    setUsers(data)
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  async function approveUser(uid) {
    await updateUser(uid, { estado: 'aprobado' })
    refresh()
  }

  async function rejectUser(uid) {
    await updateUser(uid, { estado: 'rechazado' })
    refresh()
  }

  async function togglePermission(uid, permission, value) {
    await updateUser(uid, { [`permisos.${permission}`]: value })
    refresh()
  }

  return { users, loading, approveUser, rejectUser, togglePermission }
}
```

- [ ] **Step 2: Create `src/pages/perfil.css`**

```css
.perfil-header {
  text-align: center;
  padding: 24px 0;
}

.perfil-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.perfil-instrument {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  background: var(--color-surface);
  border-radius: 20px;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  box-shadow: var(--shadow);
  margin-bottom: 8px;
}

.perfil-since {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.perfil-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 24px;
  margin-bottom: 32px;
}

.admin-section {
  margin-top: 16px;
}

.admin-section h2 {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--color-border);
}

.admin-section h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.pending-card {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.pending-info {
  flex: 1;
}

.pending-name {
  font-weight: 600;
}

.pending-meta {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.pending-actions {
  display: flex;
  gap: 6px;
}

.pending-btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
}

.member-card {
  margin-bottom: 10px;
  padding: 12px;
}

.member-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.member-name {
  font-weight: 600;
}

.member-instrument {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 0.85rem;
}

.toggle {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.toggle-active {
  background: var(--color-primary);
}

.toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}

.toggle-active::after {
  transform: translateX(20px);
}

.member-count {
  text-align: center;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin-top: 16px;
  padding: 12px;
  background: var(--color-surface);
  border-radius: var(--radius-sm);
}
```

- [ ] **Step 3: Implement `src/pages/Perfil.jsx`**

```jsx
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { logout } from '../services/auth'
import { updateUser } from '../services/firestore'
import { useUsers } from '../hooks/useUsers'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import './perfil.css'

function formatDate(timestamp) {
  if (!timestamp) return ''
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Perfil() {
  const { user, userData, isAdmin } = useAuth()
  const { users, loading, approveUser, rejectUser, togglePermission } = useUsers()
  const [showEdit, setShowEdit] = useState(false)
  const [editNombre, setEditNombre] = useState('')
  const [editInstrumento, setEditInstrumento] = useState('')

  const INSTRUMENTOS = [
    'Clarinete', 'Saxofón', 'Trompeta', 'Trombón', 'Tuba',
    'Bombardino', 'Flauta', 'Percusión', 'Caja', 'Bombo', 'Otro'
  ]

  function openEdit() {
    setEditNombre(userData?.nombre || '')
    setEditInstrumento(userData?.instrumento || '')
    setShowEdit(true)
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    if (!editNombre.trim() || !editInstrumento) return
    await updateUser(user.uid, {
      nombre: editNombre.trim(),
      instrumento: editInstrumento,
    })
    setShowEdit(false)
  }

  const pendingUsers = users.filter((u) => u.estado === 'pendiente')
  const approvedUsers = users.filter((u) => u.estado === 'aprobado' && u.id !== user.uid)

  return (
    <div>
      <div className="perfil-header">
        <h1 className="perfil-name">{userData?.nombre}</h1>
        <div className="perfil-instrument">🎵 {userData?.instrumento}</div>
        <p className="perfil-since">
          En La Mandanga desde el {formatDate(userData?.fechaRegistro)}
        </p>
      </div>

      <div className="perfil-actions">
        <Button variant="secondary" onClick={openEdit}>Editar perfil</Button>
        <Button variant="ghost" onClick={logout}>Cerrar sesión</Button>
      </div>

      {isAdmin && (
        <div className="admin-section">
          <h2>Administración</h2>

          {pendingUsers.length > 0 && (
            <>
              <h3>Solicitudes pendientes</h3>
              {pendingUsers.map((u) => (
                <Card key={u.id} className="pending-card">
                  <div className="pending-info">
                    <div className="pending-name">{u.nombre}</div>
                    <div className="pending-meta">{u.email} · {u.instrumento}</div>
                  </div>
                  <div className="pending-actions">
                    <button
                      className="pending-btn"
                      style={{ background: 'var(--color-success)' }}
                      onClick={() => approveUser(u.id)}
                    >
                      ✓
                    </button>
                    <button
                      className="pending-btn"
                      style={{ background: 'var(--color-danger)' }}
                      onClick={() => rejectUser(u.id)}
                    >
                      ✗
                    </button>
                  </div>
                </Card>
              ))}
            </>
          )}

          <h3 style={{ marginTop: 24 }}>Miembros</h3>
          {loading ? (
            <p style={{ color: 'var(--color-text-secondary)' }}>Cargando...</p>
          ) : (
            <>
              {approvedUsers.map((u) => (
                <Card key={u.id} className="member-card">
                  <div className="member-header">
                    <span className="member-name">{u.nombre}</span>
                    <span className="member-instrument">{u.instrumento}</span>
                  </div>
                  <div className="toggle-row">
                    <span>Gestionar partituras</span>
                    <div
                      className={`toggle${u.permisos?.partituras ? ' toggle-active' : ''}`}
                      onClick={() => togglePermission(u.id, 'partituras', !u.permisos?.partituras)}
                    />
                  </div>
                  <div className="toggle-row">
                    <span>Gestionar calendario</span>
                    <div
                      className={`toggle${u.permisos?.calendario ? ' toggle-active' : ''}`}
                      onClick={() => togglePermission(u.id, 'calendario', !u.permisos?.calendario)}
                    />
                  </div>
                </Card>
              ))}
              <div className="member-count">
                {users.filter((u) => u.estado === 'aprobado').length}/16 miembros activos
              </div>
            </>
          )}
        </div>
      )}

      {showEdit && (
        <Modal onClose={() => setShowEdit(false)}>
          <form onSubmit={handleSaveProfile}>
            <h3 style={{ marginBottom: 16 }}>Editar perfil</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                placeholder="Nombre"
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
              />
              <select
                value={editInstrumento}
                onChange={(e) => setEditInstrumento(e.target.value)}
              >
                {INSTRUMENTOS.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <Button type="submit">Guardar</Button>
              <Button variant="ghost" onClick={() => setShowEdit(false)}>Cancelar</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useUsers.js src/pages/Perfil.jsx src/pages/perfil.css
git commit -m "feat: implement profile page with admin panel for user and permission management"
```

---

## Task 15: Firebase Setup and Firestore Rules

**Files:**
- Create: `firestore.rules`

- [ ] **Step 1: Create `firestore.rules`**

This file documents the rules to apply in the Firebase Console (Firestore > Rules):

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isApproved() {
      return request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.estado == 'aprobado';
    }

    function isAdmin() {
      return request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.rol == 'admin';
    }

    function hasPermission(perm) {
      let userData = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
      return userData.rol == 'admin' || userData.permisos[perm] == true;
    }

    // Users
    match /users/{uid} {
      // Anyone authenticated can create their own user doc (registration)
      allow create: if request.auth != null && request.auth.uid == uid
        && request.resource.data.estado == 'pendiente';
      // Users can read their own doc; approved users can read all
      allow read: if request.auth != null
        && (request.auth.uid == uid || isApproved());
      // Users can update their own name/instrument; admin can update anything
      allow update: if request.auth != null
        && (request.auth.uid == uid || isAdmin());
    }

    // Events
    match /eventos/{eventId} {
      allow read: if isApproved();
      allow create, delete: if isApproved() && hasPermission('calendario');
      // Allow update for event managers AND for any approved user voting
      allow update: if isApproved();
    }

    // Folders
    match /carpetas/{folderId} {
      allow read: if isApproved();
      allow create, update, delete: if isApproved() && hasPermission('partituras');
    }

    // Scores
    match /partituras/{scoreId} {
      allow read: if isApproved();
      allow create, update, delete: if isApproved() && hasPermission('partituras');
    }
  }
}
```

- [ ] **Step 2: Create a setup instructions file**

Create `FIREBASE_SETUP.md`:

```markdown
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
```

- [ ] **Step 3: Commit**

```bash
git add firestore.rules FIREBASE_SETUP.md
git commit -m "docs: add Firestore security rules and Firebase setup instructions"
```

---

## Task 16: Netlify Deploy Config

**Files:**
- Create: `netlify.toml`
- Create: `public/_redirects`

- [ ] **Step 1: Create `netlify.toml`**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

- [ ] **Step 2: Create `public/_redirects`**

```
/*    /index.html   200
```

This is a backup for the redirect rule (Netlify picks it up from public/).

- [ ] **Step 3: Verify build works**

```bash
npm run build
```

Expected: Build succeeds, output in `dist/` folder.

- [ ] **Step 4: Commit**

```bash
git add netlify.toml public/_redirects
git commit -m "feat: add Netlify deployment config with SPA redirects"
```

---

## Task 17: Final Verification

- [ ] **Step 1: Run dev server and check all routes**

```bash
npm run dev
```

Verify:
- `/` redirects to `/agenda`
- Login screen shows with logo and form
- Bottom nav has 3 tabs
- All routes render without errors

- [ ] **Step 2: Run production build**

```bash
npm run build && npm run preview
```

Expected: Production build works, preview server serves the app correctly.

- [ ] **Step 3: Final commit with all remaining files**

```bash
git status
```

Add any unstaged files and create a final commit if needed:

```bash
git add -A
git commit -m "chore: final cleanup and verification"
```
