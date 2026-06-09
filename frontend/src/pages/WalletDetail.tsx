import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  getWallet, getWallets, deposit, withdraw, transfer, getTransactions,
  type Wallet, type Transaction,
} from '../api/wallet'
import Layout from '../components/Layout'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

type Action = 'deposit' | 'withdraw' | 'transfer'

export default function WalletDetail() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()

  const [wallet, setWallet]         = useState<Wallet | null>(null)
  const [allWallets, setAllWallets] = useState<Wallet[]>([])
  const [transactions, setTx]       = useState<Transaction[]>([])
  const [loading, setLoading]       = useState(true)
  const [action, setAction]         = useState<Action | null>(null)
  const [amount, setAmount]         = useState('')
  const [toWalletId, setToWallet]   = useState('')
  const [submitting, setSub]        = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')

  const load = async () => {
    if (!id) return
    try {
      const [wRes, txRes, allRes] = await Promise.all([
        getWallet(id),
        getTransactions(id),
        getWallets(),
      ])
      setWallet(wRes.data)
      setTx(txRes.data)
      setAllWallets(allRes.data.filter((w) => w.id !== id))
    } catch {
      navigate('/wallets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleAction = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!id || !action) return
    setError('')
    setSuccess('')
    setSub(true)
    try {
      if (action === 'deposit')  await deposit(id, Number(amount))
      if (action === 'withdraw') await withdraw(id, Number(amount))
      if (action === 'transfer') await transfer(id, toWalletId, Number(amount))
      setSuccess(`${action.charAt(0).toUpperCase() + action.slice(1)} of ${fmt(Number(amount))} completed.`)
      setAmount('')
      setToWallet('')
      setAction(null)
      load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Transaction failed. Please try again.')
    } finally {
      setSub(false)
    }
  }

  const txColor = (t: string) => t === 'DEPOSIT' ? '#34d399' : t === 'WITHDRAW' ? '#f87171' : '#999'
  const txSign  = (t: string) => t === 'DEPOSIT' ? '+' : t === 'WITHDRAW' ? '−' : ''

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 animate-pulse">
          <div className="h-5 w-40 rounded" style={{ backgroundColor: '#1a1a1a' }} />
          <div className="h-20 rounded" style={{ backgroundColor: '#1a1a1a' }} />
        </div>
      </Layout>
    )
  }

  if (!wallet) return null

  return (
    <Layout>
      {/* Back */}
      <button
        onClick={() => navigate('/wallets')}
        className="text-xs uppercase tracking-wider mb-8 flex items-center gap-2 transition-colors"
        style={{ color: '#555' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#555555')}
      >
        ← All Accounts
      </button>

      {/* Header */}
      <div className="flex items-end justify-between mb-8" style={{ borderBottom: '2px solid #ffffff', paddingBottom: '20px' }}>
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#c9a96e' }}>
            {wallet.walletType}
          </p>
          <h1 className="text-2xl font-semibold text-white" style={{ letterSpacing: '-0.5px' }}>
            {wallet.walletName}
          </h1>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#999' }}>Available Balance</p>
          <p className="text-3xl font-light tabular text-white" style={{ letterSpacing: '-0.5px' }}>
            {fmt(Number(wallet.balance))}
          </p>
        </div>
      </div>

      {/* Action toggles */}
      <div className="flex gap-3 mb-10">
        {(['deposit', 'withdraw', 'transfer'] as Action[]).map((a) => (
          <motion.button
            key={a}
            onClick={() => { setAction(action === a ? null : a); setError(''); setSuccess('') }}
            className="px-6 py-2.5 text-xs font-medium uppercase tracking-widest transition-colors"
            style={
              action === a
                ? { backgroundColor: '#c9a96e', color: '#000', border: '1px solid #c9a96e' }
                : { backgroundColor: 'transparent', color: '#999', border: '1px solid #2a2a2a' }
            }
            whileHover={action !== a ? { borderColor: '#c9a96e', color: '#c9a96e' } : {}}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            {a}
          </motion.button>
        ))}
      </div>

      {/* Success banner */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 px-4 py-3 text-xs"
          style={{ backgroundColor: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}
        >
          {success}
        </motion.div>
      )}

      {/* Action form */}
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mb-10 p-8"
          style={{ border: '1px solid #2a2a2a', backgroundColor: '#111' }}
        >
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-6 text-white">
            {action === 'deposit' ? 'Deposit Funds' : action === 'withdraw' ? 'Withdraw Funds' : 'Transfer Funds'}
          </h3>

          {error && (
            <div className="mb-4 px-4 py-3 text-xs" style={{ backgroundColor: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleAction} className="space-y-6">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-white">
                Amount (USD)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="0.00"
                className="w-full px-0 py-2 text-2xl font-light text-white bg-transparent focus:outline-none tabular placeholder-white/20"
                style={{ borderBottom: '1px solid #ffffff', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0, maxWidth: '280px' }}
              />
            </div>

            {action === 'transfer' && (
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider mb-2 text-white">
                  Destination Account
                </label>
                <select
                  value={toWalletId}
                  onChange={(e) => setToWallet(e.target.value)}
                  required
                  className="w-full px-0 py-2 text-sm text-white bg-transparent focus:outline-none appearance-none"
                  style={{ borderBottom: '1px solid #ffffff', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}
                >
                  <option value="" style={{ backgroundColor: '#111' }}>Select account…</option>
                  {allWallets.map((w) => (
                    <option key={w.id} value={w.id} style={{ backgroundColor: '#111' }}>
                      {w.walletName} — {fmt(Number(w.balance))}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-4 pt-2">
              <motion.button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 text-xs font-medium uppercase tracking-widest disabled:opacity-40"
                style={{ backgroundColor: '#c9a96e', color: '#000' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {submitting ? 'Processing…' : `Confirm ${action}`}
              </motion.button>
              <button
                type="button"
                onClick={() => setAction(null)}
                className="px-6 py-3 text-xs font-medium uppercase tracking-wider transition-colors"
                style={{ border: '1px solid #2a2a2a', color: '#555' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Transaction history */}
      <div>
        <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: '#999' }}>
          Transaction History
        </p>

        <div style={{ border: '1px solid #1e1e1e', backgroundColor: '#111' }}>
          <div className="grid grid-cols-4 px-6 py-3" style={{ borderBottom: '1px solid #1e1e1e', backgroundColor: '#0d0d0d' }}>
            {['Date', 'Type', 'Status', 'Amount'].map((h) => (
              <p key={h} className="text-xs font-medium uppercase tracking-widest" style={{ color: '#555' }}>{h}</p>
            ))}
          </div>

          {transactions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm" style={{ color: '#555' }}>No transactions recorded.</p>
            </div>
          ) : (
            transactions.map((tx, i) => (
              <motion.div
                key={tx.id}
                className="grid grid-cols-4 px-6 py-4 items-center"
                style={{ borderBottom: i < transactions.length - 1 ? '1px solid #161616' : 'none' }}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                transition={{ duration: 0.1 }}
              >
                <p className="text-xs" style={{ color: '#555' }}>
                  {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="text-sm text-white capitalize">
                  {tx.type.charAt(0) + tx.type.slice(1).toLowerCase()}
                </p>
                <p className="text-xs uppercase tracking-wider" style={{ color: '#34d399' }}>{tx.status}</p>
                <p className="text-sm font-semibold tabular" style={{ color: txColor(tx.type) }}>
                  {txSign(tx.type)}{fmt(Number(tx.amount))}
                </p>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}
