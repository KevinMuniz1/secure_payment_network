import api from './axios'

export interface Wallet {
  id: string
  walletName: string
  walletType: string
  balance: number
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  amount: number
  type: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER'
  status: string
  createdAt: string
  updatedAt: string
  sender?: { id: string; email: string; firstName: string; lastName: string }
  receiver?: { id: string; email: string; firstName: string; lastName: string }
}

export const getWallets = () => api.get<Wallet[]>('/users/wallets/get-wallets')

export const getWallet = (id: string) => api.get<Wallet>(`/users/wallets/${id}`)

const idempKey = () => ({ 'Idempotency-Key': crypto.randomUUID() })

export const createWallet = (
  walletName: string,
  walletType: string,
  initialBalance: number
) =>
  api.post<Wallet>('/users/wallets/create-wallet', {
    walletName,
    walletType,
    initialBalance,
  }, { headers: idempKey() })

export const deleteWallet = (id: string) =>
  api.delete(`/users/wallets/${id}`)

export const deposit = (id: string, amount: number) =>
  api.post(`/users/wallets/${id}/deposit`, amount, {
    headers: { 'Content-Type': 'application/json', ...idempKey() },
  })

export const withdraw = (id: string, amount: number) =>
  api.post(`/users/wallets/${id}/withdraw`, amount, {
    headers: { 'Content-Type': 'application/json', ...idempKey() },
  })

export const transfer = (
  fromWalletId: string,
  toWalletId: string,
  amount: number
) =>
  api.post('/users/wallets/transferFunds', { fromWalletId, toWalletId, amount }, {
    headers: idempKey(),
  })

export const getTransactions = (walletId: string) =>
  api.get<Transaction[]>(`/users/wallets/${walletId}/transactions`)
