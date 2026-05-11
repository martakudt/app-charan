import { useState } from 'react'
import { login, register, resetPassword } from '../services/auth'
import Button from '../components/ui/Button'
import './login.css'

const INSTRUMENTOS = [
  'Clarinete', 'Saxofón', 'Trompeta', 'Trombón', 'Tuba',
  'Bombardino', 'Flauta', 'Percusión', 'Caja', 'Bombo', 'Otro'
]

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [instrumento, setInstrumento] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const isRegister = mode === 'register'
  const isReset = mode === 'reset'

  function switchMode(next) {
    setMode(next)
    setError('')
    setInfo('')
    setPassword('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    try {
      if (isReset) {
        if (!email.trim()) {
          setError('Introduce tu email')
          setLoading(false)
          return
        }
        await resetPassword(email.trim())
        setInfo('Te hemos enviado un email con instrucciones para restablecer tu contraseña.')
      } else if (isRegister) {
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
        'auth/user-not-found': 'No existe ninguna cuenta con ese email',
        'auth/missing-email': 'Introduce tu email',
      }
      setError(messages[err.code] || 'Error al iniciar sesión')
    }
    setLoading(false)
  }

  const subtitle = isReset
    ? 'Restablece tu contraseña'
    : isRegister
    ? 'Crea tu cuenta'
    : 'Inicia sesión para acceder'

  const submitLabel = isReset
    ? 'Enviar email'
    : isRegister
    ? 'Crear cuenta'
    : 'Entrar'

  return (
    <div className="login-screen">
      <div className="login-card">
        <img src="/logo_mandanga.png" alt="La Mandanga" className="login-logo" />
        <h1 className="login-title">La Mandanga</h1>
        <p className="login-subtitle">{subtitle}</p>

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
          {!isReset && (
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          )}
          {!isRegister && !isReset && (
            <button
              type="button"
              className="login-link"
              onClick={() => switchMode('reset')}
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}
          {error && <p className="login-error">{error}</p>}
          {info && <p className="login-info">{info}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Cargando...' : submitLabel}
          </Button>
          {isReset ? (
            <Button variant="secondary" onClick={() => switchMode('login')}>
              Volver
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => switchMode(isRegister ? 'login' : 'register')}>
              {isRegister ? 'Ya tengo cuenta' : 'Crear cuenta'}
            </Button>
          )}
        </form>
      </div>
    </div>
  )
}
