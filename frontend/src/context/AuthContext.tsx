import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { logout as apiLogout } from '../api/auth'

interface AuthUser {
  email: string
  role: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  login: (token: string, refreshToken: string, email: string, role: string) => void
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const email = localStorage.getItem('email')
    const role = localStorage.getItem('role')
    return email && role ? { email, role } : null
  })
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token')
  )

  const login = (
    accessToken: string,
    refreshToken: string,
    email: string,
    role: string
  ) => {
    localStorage.setItem('token', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('email', email)
    localStorage.setItem('role', role)
    setToken(accessToken)
    setUser({ email, role })
  }

  const logout = async () => {
    try { await apiLogout() } catch { /* ignore */ }
    localStorage.clear()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
