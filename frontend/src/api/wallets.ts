import apiClient, { idempotencyHeader } from "./client";

export interface Wallet {
  id: string;
  walletName: string;
  walletType: string;
  balance: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: "DEPOSIT" | "WITHDRAW" | "TRANSFER";
  status: string;
  createdAt: string;
  sender: { id: string; email: string };
  receiver: { id: string; email: string };
}

export interface CreateWalletData {
  walletName: string;
  walletType: string;
  initialBalance: number;
}

export interface TransferData {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
}

export async function getWallets(): Promise<Wallet[]> {
  const response = await apiClient.get<Wallet[]>("/users/wallets/get-wallets");
  return response.data;
}

export async function createWallet(data: CreateWalletData): Promise<Wallet> {
  const response = await apiClient.post<Wallet>(
    "/users/wallets/create-wallet",
    data,
    { headers: idempotencyHeader() }
  );
  return response.data;
}

export async function getWallet(id: string): Promise<Wallet> {
  const response = await apiClient.get<Wallet>(`/users/wallets/${id}`);
  return response.data;
}

export async function deleteWallet(id: string): Promise<void> {
  await apiClient.delete(`/users/wallets/${id}`);
}

export async function deposit(walletId: string, amount: number): Promise<void> {
  await apiClient.post(
    `/users/wallets/${walletId}/deposit`,
    amount,
    {
      headers: {
        ...idempotencyHeader(),
        "Content-Type": "application/json",
      },
    }
  );
}

export async function withdraw(
  walletId: string,
  amount: number
): Promise<void> {
  await apiClient.post(
    `/users/wallets/${walletId}/withdraw`,
    amount,
    {
      headers: {
        ...idempotencyHeader(),
        "Content-Type": "application/json",
      },
    }
  );
}

export async function transfer(data: TransferData): Promise<void> {
  await apiClient.post("/users/wallets/transferFunds", data);
}

export async function getTransactions(
  walletId: string
): Promise<Transaction[]> {
  const response = await apiClient.get<Transaction[]>(
    `/users/wallets/${walletId}/transactions`
  );
  return response.data;
}
