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
        <img src="/logo_mandanga.png" alt="La Mandanga" className="login-logo" />
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
