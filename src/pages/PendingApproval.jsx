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
