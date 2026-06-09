import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getWallets, getTransactions, type Wallet, type Transaction } from '../api/wallet'
import Layout from '../components/Layout'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

const typeColor = (t: string) =>
  t === 'DEPOSIT' ? '#34d399' : t === 'WITHDRAW' ? '#f87171' : '#999'

const typeSign = (t: string) =>
  t === 'DEPOSIT' ? '+' : t === 'WITHDRAW' ? '−' : '↔'

export default function Transactions() {
  const [wallets, setWallets]           = useState<Wallet[]>([])
  const [selectedWallet, setSelected]   = useState<string>('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading]           = useState(false)
  const [filter, setFilter]             = useState<string>('ALL')

  useEffect(() => {
    getWallets().then(({ data }) => {
      setWallets(data)
      if (data.length > 0) setSelected(data[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedWallet) return
    setLoading(true)
    getTransactions(selectedWallet)
      .then(({ data }) => setTransactions(data))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false))
  }, [selectedWallet])

  const filtered =
    filter === 'ALL' ? transactions : transactions.filter((tx) => tx.type === filter)

  const totals = {
    DEPOSIT:  transactions.filter((t) => t.type === 'DEPOSIT').reduce((s, t) => s + Number(t.amount), 0),
    WITHDRAW: transactions.filter((t) => t.type === 'WITHDRAW').reduce((s, t) => s + Number(t.amount), 0),
    TRANSFER: transactions.filter((t) => t.type === 'TRANSFER').reduce((s, t) => s + Number(t.amount), 0),
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-end justify-between mb-8" style={{ borderBottom: '2px solid #ffffff', paddingBottom: '20px' }}>
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#999' }}>Activity</p>
          <h1 className="text-2xl font-semibold text-white" style={{ letterSpacing: '-0.5px' }}>
            Transaction History
          </h1>
        </div>
        <select
          value={selectedWallet}
          onChange={(e) => setSelected(e.target.value)}
          className="px-0 py-2 text-sm text-white bg-transparent focus:outline-none appearance-none"
          style={{ borderBottom: '1px solid #ffffff', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0, minWidth: '160px' }}
        >
          {wallets.map((w) => (
            <option key={w.id} value={w.id} style={{ backgroundColor: '#111' }}>{w.walletName}</option>
          ))}
        </select>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-0 mb-10" style={{ border: '1px solid #1e1e1e', backgroundColor: '#111' }}>
        {[
          { label: 'Total Deposits',    value: totals.DEPOSIT,  color: '#34d399', sign: '+' },
          { label: 'Total Withdrawals', value: totals.WITHDRAW, color: '#f87171', sign: '−' },
          { label: 'Total Transfers',   value: totals.TRANSFER, color: '#999',    sign: '↔' },
        ].map(({ label, value, color, sign }, i) => (
          <div key={label} className="p-6" style={{ borderRight: i < 2 ? '1px solid #1e1e1e' : 'none' }}>
            <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: '#555' }}>{label}</p>
            <p className="text-2xl font-light tabular" style={{ color }}>
              {sign}{fmt(value)}
            </p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {['ALL', 'DEPOSIT', 'WITHDRAW', 'TRANSFER'].map((f) => (
          <motion.button
            key={f}
            onClick={() => setFilter(f)}
            className="px-5 py-2 text-xs font-medium uppercase tracking-widest transition-colors"
            style={
              filter === f
                ? { backgroundColor: '#c9a96e', color: '#000', border: '1px solid #c9a96e' }
                : { backgroundColor: 'transparent', color: '#555', border: '1px solid #2a2a2a' }
            }
            whileHover={filter !== f ? { borderColor: '#c9a96e', color: '#c9a96e' } : {}}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            {f}
          </motion.button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ border: '1px solid #1e1e1e' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="px-6 py-5 animate-pulse" style={{ borderBottom: '1px solid #1a1a1a', backgroundColor: '#111' }}>
              <div className="h-4 rounded w-3/4" style={{ backgroundColor: '#1e1e1e' }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center" style={{ border: '1px solid #1e1e1e', backgroundColor: '#111' }}>
          <p className="text-sm" style={{ color: '#555' }}>No transactions found.</p>
        </div>
      ) : (
        <div style={{ border: '1px solid #1e1e1e', backgroundColor: '#111' }}>
          <div className="grid grid-cols-4 px-6 py-3" style={{ borderBottom: '1px solid #1e1e1e', backgroundColor: '#0d0d0d' }}>
            {['Date', 'Type', 'Status', 'Amount'].map((h) => (
              <p key={h} className="text-xs font-medium uppercase tracking-widest" style={{ color: '#555' }}>{h}</p>
            ))}
          </div>

          {filtered.map((tx, i) => (
            <motion.div
              key={tx.id}
              className="grid grid-cols-4 px-6 py-4 items-center"
              style={{ borderBottom: i < filtered.length - 1 ? '1px solid #161616' : 'none' }}
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
              <p className="text-sm font-semibold tabular" style={{ color: typeColor(tx.type) }}>
                {typeSign(tx.type)}{fmt(Number(tx.amount))}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </Layout>
  )
}
