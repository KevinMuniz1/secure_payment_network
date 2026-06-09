import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { completeTotp, completeEmailOtp, sendEmailOtp } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function TwoFactor() {
  const [code, setCode]       = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const { login }             = useAuth()
  const navigate              = useNavigate()

  const preAuthToken = sessionStorage.getItem('preAuthToken') ?? ''
  const method = sessionStorage.getItem('twoFactorMethod') ?? 'totp'

  useEffect(() => {
    if (!preAuthToken) navigate('/login', { replace: true })
    if (method === 'email' && !sent) {
      sendEmailOtp().catch(() => {})
      setSent(true)
    }
  }, [])

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } =
        method === 'totp'
          ? await completeTotp(preAuthToken, code)
          : await completeEmailOtp(preAuthToken, code)

      sessionStorage.removeItem('preAuthToken')
      sessionStorage.removeItem('twoFactorMethod')
      login(data.token, data.refreshToken, data.email, data.role)
      navigate('/dashboard')
    } catch {
      setError('Invalid code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#080808' }}>
      {/* Left panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-16"
        style={{ backgroundColor: '#000', borderRight: '1px solid #1c1c1c' }}
      >
        <div>
          <p className="text-white font-semibold text-sm tracking-wider uppercase">SecurePay</p>
          <p className="text-xs mt-1 uppercase tracking-widest font-medium" style={{ color: '#c9a96e' }}>
            Private Banking
          </p>
        </div>
        <div>
          <h1 className="text-white font-light text-4xl leading-snug mb-4" style={{ letterSpacing: '-0.5px' }}>
            Security is<br />our priority.
          </h1>
          <p className="text-sm" style={{ color: '#444' }}>
            Two-factor authentication protects your account from unauthorized access.
          </p>
        </div>
        <p className="text-xs" style={{ color: '#333' }}>
          © {new Date().getFullYear()} SecurePay Financial. All rights reserved.
        </p>
      </motion.div>

      {/* Right panel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex-1 flex items-center justify-center p-8"
        style={{ backgroundColor: '#080808' }}
      >
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10">
            <p className="font-semibold text-sm tracking-wider uppercase text-white">SecurePay</p>
          </div>

          <h2 className="text-2xl font-semibold mb-1 text-white" style={{ letterSpacing: '-0.5px' }}>
            Verify Identity
          </h2>
          <p className="text-sm mb-10" style={{ color: '#555' }}>
            {method === 'totp'
              ? 'Enter the 6-digit code from your authenticator app.'
              : 'Enter the code sent to your email address.'}
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 px-4 py-3 text-xs"
              style={{ backgroundColor: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider mb-3 text-white">
                Verification Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                placeholder="000000"
                className="w-full px-0 py-3 font-light font-mono tracking-widest text-white bg-transparent focus:outline-none text-center placeholder-white/20"
                style={{
                  fontSize: '2.5rem',
                  letterSpacing: '0.3em',
                  borderBottom: '1px solid #3a3a3a',
                  borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0,
                }}
                onFocus={(e) => (e.target.style.borderBottomColor = '#ffffff')}
                onBlur={(e) => (e.target.style.borderBottomColor = '#3a3a3a')}
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full py-4 text-xs font-semibold uppercase tracking-widest disabled:opacity-40"
              style={{ backgroundColor: '#c9a96e', color: '#000' }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Verifying…' : 'Verify'}
            </motion.button>
          </form>

          <button
            onClick={() => navigate('/login')}
            className="w-full mt-6 py-2 text-xs uppercase tracking-wider transition-colors"
            style={{ color: '#333' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#999')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#333')}
          >
            ← Back to Sign In
          </button>
        </div>
      </motion.div>
    </div>
  )
}
