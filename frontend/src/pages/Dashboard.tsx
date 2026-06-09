import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getWallets, getTransactions, type Wallet, type Transaction } from '../api/wallet'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function useCountUp(target: number, duration = 1800) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (target === 0) { setValue(0); return }
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 4)
      setValue(target * eased)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else setValue(target)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return value
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#999' }}>
      {children}
    </p>
  )
}

export default function Dashboard() {
  const [wallets, setWallets]   = useState<Wallet[]>([])
  const [txMap, setTxMap]       = useState<Record<string, Transaction[]>>({})
  const [loading, setLoading]   = useState(true)
  const [animTarget, setTarget] = useState(0)
  const { user }                = useAuth()
  const navigate                = useNavigate()

  useEffect(() => {
    getWallets()
      .then(async ({ data }) => {
        setWallets(data)
        const entries = await Promise.all(
          data.map(async (w) => {
            try {
              const { data: tx } = await getTransactions(w.id)
              return [w.id, tx.slice(0, 3)] as [string, Transaction[]]
            } catch {
              return [w.id, []] as [string, Transaction[]]
            }
          })
        )
        setTxMap(Object.fromEntries(entries))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalBalance = wallets.reduce((s, w) => s + Number(w.balance), 0)

  useEffect(() => {
    if (!loading) setTarget(totalBalance)
  }, [loading, totalBalance])

  const animatedBalance = useCountUp(animTarget, 1800)

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const recentTx = Object.values(txMap)
    .flat()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)

  const txColor = (t: string) => t === 'DEPOSIT' ? '#34d399' : t === 'WITHDRAW' ? '#f87171' : '#999'
  const txSign  = (t: string) => t === 'DEPOSIT' ? '+' : t === 'WITHDRAW' ? '−' : '↔'

  return (
    <Layout>
      {/* Date */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-xs uppercase tracking-widest mb-8"
        style={{ color: '#444' }}
      >
        {dateStr}
      </motion.p>

      {/* Hero balance */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mb-3"
      >
        <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: '#c9a96e' }}>
          Total Portfolio Value
        </p>

        {loading ? (
          <div
            className="animate-pulse rounded"
            style={{ width: '320px', height: '80px', backgroundColor: '#1a1a1a' }}
          />
        ) : (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="tabular"
            style={{
              fontSize: 'clamp(3rem, 7vw, 6.5rem)',
              fontWeight: 200,
              letterSpacing: '-3px',
              color: '#ffffff',
              lineHeight: 1,
              textShadow: '0 0 120px rgba(201,169,110,0.12)',
            }}
          >
            {fmt(animatedBalance)}
          </motion.p>
        )}

        <p className="text-sm mt-3" style={{ color: '#555' }}>
          {wallets.length} account{wallets.length !== 1 ? 's' : ''}
          {!loading && wallets.length > 0 && (
            <span style={{ color: '#c9a96e' }}> · {user?.email?.split('@')[0]}</span>
          )}
        </p>
      </motion.div>

      {/* Animated divider */}
      <div className="my-10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{ height: '1px', backgroundColor: '#1e1e1e' }}
        />
      </div>

      {/* Staggered sections */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-12">

        {/* Accounts table */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center justify-between mb-4">
            <Label>Accounts</Label>
            <motion.button
              onClick={() => navigate('/wallets')}
              className="text-xs font-medium uppercase tracking-wider transition-colors"
              style={{ color: '#c9a96e' }}
              whileHover={{ x: 2 }}
            >
              Manage →
            </motion.button>
          </div>

          <div style={{ border: '1px solid #1e1e1e', backgroundColor: '#111' }}>
            <div className="grid grid-cols-3 px-6 py-3" style={{ borderBottom: '1px solid #1e1e1e', backgroundColor: '#0d0d0d' }}>
              {['Account', 'Type', 'Balance'].map((h) => (
                <Label key={h}>{h}</Label>
              ))}
            </div>

            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse rounded" style={{ height: '20px', backgroundColor: '#1a1a1a' }} />
                ))}
              </div>
            ) : wallets.length === 0 ? (
              <div className="p-8 flex flex-col items-start gap-4">
                <p className="text-sm" style={{ color: '#555' }}>No accounts yet.</p>
                <motion.button
                  onClick={() => navigate('/wallets')}
                  className="px-6 py-2.5 text-xs font-medium uppercase tracking-widest"
                  style={{ backgroundColor: '#c9a96e', color: '#000' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Open Account
                </motion.button>
              </div>
            ) : (
              <>
                {wallets.map((w, i) => (
                  <motion.button
                    key={w.id}
                    onClick={() => navigate(`/wallets/${w.id}`)}
                    className="w-full grid grid-cols-3 px-6 py-4 text-left"
                    style={{ borderBottom: i < wallets.length - 1 ? '1px solid #161616' : 'none' }}
                    whileHover={{ backgroundColor: 'rgba(201,169,110,0.04)' }}
                    transition={{ duration: 0.15 }}
                  >
                    <p className="text-sm font-medium text-white">{w.walletName}</p>
                    <p className="text-sm" style={{ color: '#555' }}>{w.walletType}</p>
                    <p className="text-sm font-semibold tabular text-white">{fmt(Number(w.balance))}</p>
                  </motion.button>
                ))}
                <div className="px-6 py-3 flex justify-end" style={{ borderTop: '1px solid #1e1e1e' }}>
                  <p className="text-xs tabular" style={{ color: '#555' }}>
                    Total · <span className="text-white font-medium">{fmt(totalBalance)}</span>
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div variants={fadeUp}>
          <Label>Quick Actions</Label>
          <div className="flex flex-wrap gap-3 mt-4">
            {[
              { label: 'Deposit',       path: '/wallets' },
              { label: 'Withdraw',      path: '/wallets' },
              { label: 'Transfer',      path: '/wallets' },
              { label: 'Open Account',  path: '/wallets' },
            ].map(({ label, path }) => (
              <motion.button
                key={label}
                onClick={() => navigate(path)}
                className="px-6 py-2.5 text-xs font-medium uppercase tracking-widest transition-colors"
                style={{ border: '1px solid #2a2a2a', color: '#999', backgroundColor: 'transparent' }}
                whileHover={{
                  backgroundColor: '#c9a96e',
                  borderColor: '#c9a96e',
                  color: '#000',
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15 }}
              >
                {label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Recent activity */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center justify-between mb-4">
            <Label>Recent Activity</Label>
            <motion.button
              onClick={() => navigate('/transactions')}
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: '#c9a96e' }}
              whileHover={{ x: 2 }}
            >
              View All →
            </motion.button>
          </div>

          <div style={{ border: '1px solid #1e1e1e', backgroundColor: '#111' }}>
            <div className="grid grid-cols-4 px-6 py-3" style={{ borderBottom: '1px solid #1e1e1e', backgroundColor: '#0d0d0d' }}>
              {['Date', 'Type', 'Account', 'Amount'].map((h) => (
                <Label key={h}>{h}</Label>
              ))}
            </div>

            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse rounded" style={{ height: '20px', backgroundColor: '#1a1a1a' }} />
                ))}
              </div>
            ) : recentTx.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm" style={{ color: '#555' }}>No transactions yet.</p>
              </div>
            ) : (
              recentTx.map((tx, i) => (
                <div
                  key={tx.id}
                  className="grid grid-cols-4 px-6 py-4 items-center"
                  style={{ borderBottom: i < recentTx.length - 1 ? '1px solid #161616' : 'none' }}
                >
                  <p className="text-xs" style={{ color: '#555' }}>
                    {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-sm font-medium text-white capitalize">
                    {tx.type.charAt(0) + tx.type.slice(1).toLowerCase()}
                  </p>
                  <p className="text-xs" style={{ color: '#555' }}>
                    {wallets.find((w) => txMap[w.id]?.some((t) => t.id === tx.id))?.walletName ?? '—'}
                  </p>
                  <p className="text-sm font-semibold tabular" style={{ color: txColor(tx.type) }}>
                    {txSign(tx.type)}{fmt(Number(tx.amount))}
                  </p>
                </div>
              ))
            )}
          </div>
        </motion.div>

      </motion.div>
    </Layout>
  )
}
