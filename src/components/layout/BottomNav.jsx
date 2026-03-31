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
