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
