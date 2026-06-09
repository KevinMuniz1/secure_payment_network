import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  setupTotp, verifyTotp, setupEmailOtp, verifyEmailOtp,
  disableTotp, disableEmailOtp,
} from '../api/auth'
import Layout from '../components/Layout'

type Step = 'idle' | 'totp-qr' | 'totp-verify' | 'email-verify'

export default function Security() {
  const [step, setStep]       = useState<Step>('idle')
  const [qrUrl, setQrUrl]     = useState('')
  const [code, setCode]       = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  const msg = (text: string, ok = true) => setMessage({ text, ok })

  const startTotp = async () => {
    setLoading(true)
    try {
      const { data } = await setupTotp()
      setQrUrl(data.qrCodeUrl)
      setStep('totp-qr')
    } catch { msg('Failed to start authenticator setup.', false) }
    finally { setLoading(false) }
  }

  const confirmTotp = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      await verifyTotp(code)
      msg('Authenticator app enabled.')
      setStep('idle')
      setCode('')
    } catch { msg('Invalid code. Please try again.', false) }
    finally { setLoading(false) }
  }

  const startEmailOtp = async () => {
    setLoading(true)
    try {
      await setupEmailOtp()
      setStep('email-verify')
    } catch { msg('Failed to initiate email OTP setup.', false) }
    finally { setLoading(false) }
  }

  const confirmEmailOtp = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      await verifyEmailOtp(code)
      msg('Email OTP enabled.')
      setStep('idle')
      setCode('')
    } catch { msg('Invalid code. Please try again.', false) }
    finally { setLoading(false) }
  }

  const handleDisableTotp = async () => {
    if (!confirm('Disable authenticator app 2FA?')) return
    setLoading(true)
    try { await disableTotp(); msg('Authenticator app disabled.') }
    catch { msg('Failed to disable.', false) }
    finally { setLoading(false) }
  }

  const handleDisableEmail = async () => {
    if (!confirm('Disable email OTP 2FA?')) return
    setLoading(true)
    try { await disableEmailOtp(); msg('Email OTP disabled.') }
    catch { msg('Failed to disable.', false) }
    finally { setLoading(false) }
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8" style={{ borderBottom: '2px solid #ffffff', paddingBottom: '20px' }}>
        <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#999' }}>Account</p>
        <h1 className="text-2xl font-semibold text-white" style={{ letterSpacing: '-0.5px' }}>
          Security Settings
        </h1>
      </div>

      {/* Status banner */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 px-4 py-3 text-xs"
          style={
            message.ok
              ? { backgroundColor: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }
              : { backgroundColor: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }
          }
        >
          {message.text}
        </motion.div>
      )}

      <div style={{ border: '1px solid #1e1e1e', backgroundColor: '#111' }}>
        {/* Section header */}
        <div className="px-8 py-4" style={{ borderBottom: '1px solid #1e1e1e', backgroundColor: '#0d0d0d' }}>
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#555' }}>
            Two-Factor Authentication
          </p>
        </div>

        {/* TOTP row */}
        <div className="px-8 py-8" style={{ borderBottom: '1px solid #1e1e1e' }}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm font-semibold text-white mb-1">Authenticator App</p>
              <p className="text-xs" style={{ color: '#555' }}>
                Generate time-based codes with Google Authenticator, Authy, or any TOTP-compatible app.
              </p>
            </div>
            <div className="flex gap-3 ml-8 flex-shrink-0">
              {step !== 'totp-qr' && (
                <motion.button
                  onClick={startTotp}
                  disabled={loading}
                  className="px-5 py-2 text-xs font-medium uppercase tracking-widest disabled:opacity-40"
                  style={{ backgroundColor: '#c9a96e', color: '#000' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {loading ? 'Loading…' : 'Set Up'}
                </motion.button>
              )}
              <button
                onClick={handleDisableTotp}
                disabled={loading}
                className="px-5 py-2 text-xs font-medium uppercase tracking-wider transition-colors disabled:opacity-40"
                style={{ border: '1px solid #2a2a2a', color: '#555' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
              >
                Disable
              </button>
            </div>
          </div>

          {step === 'totp-qr' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-6 text-center"
              style={{ backgroundColor: '#0d0d0d', border: '1px solid #1e1e1e' }}
            >
              {qrUrl && <img src={qrUrl} alt="QR code" className="mx-auto w-40 h-40" />}
              <p className="text-xs mt-3" style={{ color: '#555' }}>
                Scan with your authenticator app, then enter the 6-digit code below.
              </p>
            </motion.div>
          )}

          {(step === 'totp-qr' || step === 'totp-verify') && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={confirmTotp}
              className="flex gap-4 items-end"
            >
              <div style={{ maxWidth: '220px' }}>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-white">
                  Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full px-0 py-2 text-xl font-mono tracking-widest text-white bg-transparent focus:outline-none text-center placeholder-white/20"
                  style={{ borderBottom: '1px solid #ffffff', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}
                />
              </div>
              <motion.button
                type="submit"
                disabled={loading || code.length < 6}
                className="px-6 py-2 text-xs font-medium uppercase tracking-widest disabled:opacity-40"
                style={{ backgroundColor: '#c9a96e', color: '#000' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {loading ? 'Verifying…' : 'Confirm'}
              </motion.button>
            </motion.form>
          )}
        </div>

        {/* Email OTP row */}
        <div className="px-8 py-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm font-semibold text-white mb-1">Email OTP</p>
              <p className="text-xs" style={{ color: '#555' }}>
                Receive a one-time passcode to your registered email address at each login.
              </p>
            </div>
            <div className="flex gap-3 ml-8 flex-shrink-0">
              <motion.button
                onClick={startEmailOtp}
                disabled={loading}
                className="px-5 py-2 text-xs font-medium uppercase tracking-widest disabled:opacity-40"
                style={{ backgroundColor: '#c9a96e', color: '#000' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {loading ? 'Loading…' : 'Set Up'}
              </motion.button>
              <button
                onClick={handleDisableEmail}
                disabled={loading}
                className="px-5 py-2 text-xs font-medium uppercase tracking-wider transition-colors disabled:opacity-40"
                style={{ border: '1px solid #2a2a2a', color: '#555' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
              >
                Disable
              </button>
            </div>
          </div>

          {step === 'email-verify' && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={confirmEmailOtp}
              className="flex gap-4 items-end"
            >
              <div style={{ maxWidth: '220px' }}>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-white">
                  Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full px-0 py-2 text-xl font-mono tracking-widest text-white bg-transparent focus:outline-none text-center placeholder-white/20"
                  style={{ borderBottom: '1px solid #ffffff', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}
                />
              </div>
              <motion.button
                type="submit"
                disabled={loading || code.length < 6}
                className="px-6 py-2 text-xs font-medium uppercase tracking-widest disabled:opacity-40"
                style={{ backgroundColor: '#c9a96e', color: '#000' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {loading ? 'Verifying…' : 'Confirm'}
              </motion.button>
            </motion.form>
          )}
        </div>
      </div>
    </Layout>
  )
}
