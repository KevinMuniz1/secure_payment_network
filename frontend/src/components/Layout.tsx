import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import type { ReactNode } from 'react'

const nav = [
  { to: '/dashboard',    label: 'Overview'  },
  { to: '/wallets',      label: 'Accounts'  },
  { to: '/transactions', label: 'Activity'  },
  { to: '/security',     label: 'Security'  },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080808' }}>
      {/* Top bar */}
      <header style={{ backgroundColor: '#000', borderBottom: '1px solid #1c1c1c' }}>
        <div className="max-w-6xl mx-auto px-8 h-14 flex items-center justify-between">

          {/* Logo */}
          <motion.button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 shrink-0"
            whileTap={{ scale: 0.97 }}
          >
            <span className="text-white font-semibold text-sm tracking-wider uppercase">
              SecurePay
            </span>
            <span
              style={{ color: '#c9a96e', fontSize: 10, letterSpacing: '0.15em' }}
              className="uppercase font-medium hidden sm:block"
            >
              Private Banking
            </span>
          </motion.button>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-7">
            {nav.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className="relative text-xs font-medium tracking-widest uppercase transition-colors duration-200 group"
                style={({ isActive }) => ({
                  color: isActive ? '#c9a96e' : 'rgba(255,255,255,0.35)',
                })}
              >
                {({ isActive }) => (
                  <>
                    {label}
                    <span
                      className="absolute -bottom-px left-0 h-px transition-all duration-300"
                      style={{
                        backgroundColor: '#c9a96e',
                        width: isActive ? '100%' : '0',
                      }}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User avatar */}
          <div className="relative">
            <motion.button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 focus:outline-none"
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-white/30 text-xs hidden sm:block truncate max-w-32">
                {user?.email}
              </span>
              <motion.div
                className="w-7 h-7 rounded-sm flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: '#c9a96e', color: '#000' }}
                whileHover={{ scale: 1.1 }}
              >
                {user?.email?.[0]?.toUpperCase() ?? 'U'}
              </motion.div>
            </motion.button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 z-50 w-52 py-1"
                  style={{
                    backgroundColor: '#111',
                    border: '1px solid #2a2a2a',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
                  }}
                >
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid #2a2a2a' }}>
                    <p className="text-white text-xs font-medium truncate">{user?.email}</p>
                    <p className="text-xs mt-0.5 capitalize" style={{ color: '#c9a96e' }}>
                      {user?.role?.toLowerCase()}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-xs transition-colors"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                  >
                    Sign Out
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex gap-5 px-8 pb-3">
          {nav.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className="text-xs font-medium tracking-widest uppercase transition-colors"
              style={({ isActive }) => ({ color: isActive ? '#c9a96e' : 'rgba(255,255,255,0.35)' })}
            >
              {label}
            </NavLink>
          ))}
        </div>
      </header>

      {/* Page content — fades in on each navigation */}
      <main className="max-w-6xl mx-auto px-8 py-10">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
