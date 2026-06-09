import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { register as apiRegister } from '../api/auth'

const fields = [
  { key: 'firstName', label: 'First Name',   type: 'text',     placeholder: 'John'            },
  { key: 'lastName',  label: 'Last Name',     type: 'text',     placeholder: 'Smith'           },
  { key: 'email',     label: 'Email Address', type: 'email',    placeholder: 'you@example.com' },
  { key: 'password',  label: 'Password',      type: 'password', placeholder: '8+ characters'   },
]

export default function Register() {
  const [form, setForm]       = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const navigate              = useNavigate()

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await apiRegister(form.firstName, form.lastName, form.email, form.password)
      navigate('/login')
    } catch {
      setError('Registration failed. Please check your information and try again.')
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
            Open your account<br />in minutes.
          </h1>
          <p className="text-sm" style={{ color: '#444' }}>
            No paperwork. No branch visits. Start managing your finances today.
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
            Open Account
          </h2>
          <p className="text-sm mb-8" style={{ color: '#555' }}>
            Create your SecurePay account
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

          <form onSubmit={handleSubmit} className="space-y-5">
            {fields.map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-white">
                  {label}
                </label>
                <input
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={set(key)}
                  required
                  placeholder={placeholder}
                  className="w-full px-0 py-3 text-sm text-white bg-transparent focus:outline-none placeholder-white/20"
                  style={{ borderBottom: '1px solid #3a3a3a', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}
                  onFocus={(e) => (e.target.style.borderBottomColor = '#ffffff')}
                  onBlur={(e) => (e.target.style.borderBottomColor = '#3a3a3a')}
                />
              </div>
            ))}

            <div className="pt-4">
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full py-4 text-xs font-semibold uppercase tracking-widest disabled:opacity-40"
                style={{ backgroundColor: '#c9a96e', color: '#000' }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? 'Creating Account…' : 'Create Account'}
              </motion.button>
            </div>
          </form>

          <p className="mt-8 text-xs" style={{ color: '#555' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-medium transition-colors" style={{ color: '#c9a96e' }}>
              Sign in →
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
