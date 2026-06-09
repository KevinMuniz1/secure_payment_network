import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

import Login         from './pages/Login'
import Register      from './pages/Register'
import TwoFactor     from './pages/TwoFactor'
import Dashboard     from './pages/Dashboard'
import Wallets       from './pages/Wallets'
import WalletDetail  from './pages/WalletDetail'
import Transactions  from './pages/transactions'
import Security      from './pages/SecurityMonitors'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"      element={<Login />} />
      <Route path="/register"   element={<Register />} />
      <Route path="/verify-2fa" element={<TwoFactor />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard"         element={<Dashboard />} />
        <Route path="/wallets"           element={<Wallets />} />
        <Route path="/wallets/:id"       element={<WalletDetail />} />
        <Route path="/transactions"      element={<Transactions />} />
        <Route path="/security"          element={<Security />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
