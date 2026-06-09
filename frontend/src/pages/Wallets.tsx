import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getWallets, createWallet, deleteWallet, type Wallet } from '../api/wallet'
import Layout from '../components/Layout'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

const WALLET_TYPES = ['CHECKING', 'SAVINGS', 'INVESTMENT']

export default function Wallets() {
  const [wallets, setWallets]   = useState<Wallet[]>([])
  const [loading, setLoading]   = useState(true)
  const [showCreate, setShow]   = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm]         = useState({ walletName: '', walletType: 'CHECKING', initialBalance: '' })
  const [error, setError]       = useState('')
  const navigate                = useNavigate()

  const load = () =>
    getWallets()
      .then(({ data }) => setWallets(data))
      .catch(() => {})
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      await createWallet(form.walletName, form.walletType, Number(form.initialBalance) || 0)
      setShow(false)
      setForm({ walletName: '', walletType: 'CHECKING', initialBalance: '' })
      setLoading(true)
      load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Could not open account. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently close this account? This action cannot be undone.')) return
    setDeleting(id)
    try {
      await deleteWallet(id)
      setWallets((ws) => ws.filter((w) => w.id !== id))
    } catch {
      alert('Could not close account.')
    } finally {
      setDeleting(null)
    }
  }

  const totalBalance = wallets.reduce((s, w) => s + Number(w.balance), 0)

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-end justify-between mb-8" style={{ borderBottom: '2px solid #ffffff', paddingBottom: '20px' }}>
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#999' }}>Accounts</p>
          <h1 className="text-2xl font-semibold text-white" style={{ letterSpacing: '-0.5px' }}>
            My Accounts
          </h1>
        </div>
        <motion.button
          onClick={() => setShow(true)}
          className="px-6 py-2.5 text-xs font-medium uppercase tracking-widest"
          style={{ backgroundColor: '#c9a96e', color: '#000' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          + Open Account
        </motion.button>
      </div>

      {/* Total summary */}
      {!loading && wallets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-8 mb-8"
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#999' }}>Total Balance</p>
            <p className="text-3xl font-light tabular text-white" style={{ letterSpacing: '-0.5px' }}>
              {fmt(totalBalance)}
            </p>
          </div>
          <div style={{ borderLeft: '1px solid #2a2a2a', paddingLeft: '32px' }}>
            <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#999' }}>Accounts</p>
            <p className="text-3xl font-light text-white">{wallets.length}</p>
          </div>
        </motion.div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md p-8"
            style={{ backgroundColor: '#111', border: '1px solid #2a2a2a', boxShadow: '0 32px 80px rgba(0,0,0,0.9)' }}
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-semibold text-white">Open New Account</h3>
              <button onClick={() => setShow(false)} className="text-white/30 hover:text-white text-xl leading-none transition-colors">×</button>
            </div>

            {error && (
              <div className="mb-6 px-4 py-3 text-xs" style={{ backgroundColor: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-white">Account Name</label>
                <input
                  type="text"
                  value={form.walletName}
                  onChange={(e) => setForm((f) => ({ ...f, walletName: e.target.value }))}
                  required
                  placeholder="e.g. Primary Checking"
                  className="w-full px-0 py-2 text-sm text-white bg-transparent focus:outline-none placeholder-white/20"
                  style={{ borderBottom: '1px solid #ffffff', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-white">Account Type</label>
                <select
                  value={form.walletType}
                  onChange={(e) => setForm((f) => ({ ...f, walletType: e.target.value }))}
                  className="w-full px-0 py-2 text-sm text-white bg-transparent focus:outline-none appearance-none"
                  style={{ borderBottom: '1px solid #ffffff', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}
                >
                  {WALLET_TYPES.map((t) => <option key={t} style={{ backgroundColor: '#111' }}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-white">Opening Deposit ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.initialBalance}
                  onChange={(e) => setForm((f) => ({ ...f, initialBalance: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-0 py-2 text-sm text-white bg-transparent focus:outline-none placeholder-white/20"
                  style={{ borderBottom: '1px solid #ffffff', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShow(false)}
                  className="flex-1 py-3 text-xs font-medium uppercase tracking-widest transition-colors"
                  style={{ border: '1px solid #2a2a2a', color: '#999' }}
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 text-xs font-medium uppercase tracking-widest disabled:opacity-40"
                  style={{ backgroundColor: '#c9a96e', color: '#000' }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {creating ? 'Opening…' : 'Open Account'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ border: '1px solid #1e1e1e' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-6 py-5 animate-pulse" style={{ borderBottom: '1px solid #1e1e1e', backgroundColor: '#1a1a1a' }}>
              <div className="h-4 rounded w-1/2" style={{ backgroundColor: '#222' }} />
            </div>
          ))}
        </div>
      ) : wallets.length === 0 ? (
        <div className="py-20 text-center" style={{ border: '1px solid #1e1e1e', backgroundColor: '#111' }}>
          <p className="text-sm mb-6" style={{ color: '#555' }}>No accounts found.</p>
          <motion.button
            onClick={() => setShow(true)}
            className="px-6 py-3 text-xs font-medium uppercase tracking-widest"
            style={{ backgroundColor: '#c9a96e', color: '#000' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Open Your First Account
          </motion.button>
        </div>
      ) : (
        <div style={{ border: '1px solid #1e1e1e', backgroundColor: '#111' }}>
          <div className="grid grid-cols-4 px-6 py-3" style={{ borderBottom: '1px solid #1e1e1e', backgroundColor: '#0d0d0d' }}>
            {['Account Name', 'Type', 'Balance', ''].map((h) => (
              <p key={h} className="text-xs font-medium uppercase tracking-widest" style={{ color: '#555' }}>{h}</p>
            ))}
          </div>

          {wallets.map((w, i) => (
            <motion.div
              key={w.id}
              className="grid grid-cols-4 px-6 py-5 items-center"
              style={{ borderBottom: i < wallets.length - 1 ? '1px solid #161616' : 'none' }}
              whileHover={{ backgroundColor: 'rgba(201,169,110,0.04)' }}
              transition={{ duration: 0.15 }}
            >
              <button className="text-left col-span-3 grid grid-cols-3" onClick={() => navigate(`/wallets/${w.id}`)}>
                <p className="text-sm font-medium text-white">{w.walletName}</p>
                <p className="text-sm" style={{ color: '#555' }}>{w.walletType}</p>
                <p className="text-sm font-semibold tabular text-white">{fmt(Number(w.balance))}</p>
              </button>
              <div className="flex justify-end">
                <button
                  onClick={() => handleDelete(w.id)}
                  disabled={deleting === w.id}
                  className="text-xs uppercase tracking-wider transition-colors disabled:opacity-30"
                  style={{ color: '#444' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#444')}
                >
                  {deleting === w.id ? 'Closing…' : 'Close'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Layout>
  )
}
