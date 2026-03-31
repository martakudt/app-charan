import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './layout.css'

function IconAgenda({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--color-primary)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

function IconPartituras({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--color-primary)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  )
}

function IconGestion({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--color-primary)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
    </svg>
  )
}

function IconPerfil({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--color-primary)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { canAccessDireccion } = useAuth()

  const tabs = [
    { path: '/agenda', label: 'Agenda', Icon: IconAgenda },
    { path: '/partituras', label: 'Partituras', Icon: IconPartituras },
    ...(canAccessDireccion ? [{ path: '/gestion', label: 'Gestión', Icon: IconGestion }] : []),
    { path: '/perfil', label: 'Perfil', Icon: IconPerfil },
  ]

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
            <tab.Icon active={active} />
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
