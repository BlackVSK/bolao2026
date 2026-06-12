import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navLinks = [
    { to: '/dashboard', label: '🏟️ Partidas' },
    { to: '/ranking', label: '🏆 Ranking' },
    { to: '/copa', label: '🌍 Copa' },
    ...(user?.is_admin
      ? [
          { to: '/admin/matches', label: '⚙️ Gerenciar Partidas' },
          { to: '/admin/predictions', label: '🎯 Palpites' },
          { to: '/admin/users', label: '👥 Gerenciar Usuários' },
        ]
      : []),
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <nav className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <span className="text-accent font-bold text-lg tracking-wide hidden sm:block">
              Bolão 2026
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'bg-primary text-accent'
                    : 'text-gray-300 hover:bg-card-hover hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User info + logout */}
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm hidden sm:block">
              {user?.username}
              {user?.is_admin && (
                <span className="ml-1 text-xs bg-accent text-black px-1.5 py-0.5 rounded font-bold">
                  ADMIN
                </span>
              )}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-card-hover"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  )
}
