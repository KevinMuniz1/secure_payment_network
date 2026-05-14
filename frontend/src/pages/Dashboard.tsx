import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getWallets, createWallet, getTransactions } from "@/api/wallets";
import type { CreateWalletData, Transaction } from "@/api/wallets";
import WalletCard from "@/components/WalletCard";

const schema = z.object({
  walletName: z.string().min(1, "Wallet name is required"),
  walletType: z.enum(["CHECKING", "SAVINGS"]),
  initialBalance: z.string().min(1, "Initial balance is required"),
});

type FormData = z.infer<typeof schema>;

function formatCurrency(val: number): string {
  return `$${Number(val).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function TransactionRow({ tx }: { tx: Transaction & { walletName: string } }) {
  const isDeposit = tx.type === "DEPOSIT";
  const isWithdraw = tx.type === "WITHDRAW";

  const iconBg = isDeposit
    ? "bg-emerald-500/10"
    : isWithdraw
      ? "bg-red-500/10"
      : "bg-blue-500/10";

  const IconComponent = isDeposit
    ? ArrowDownLeft
    : isWithdraw
      ? ArrowUpRight
      : RefreshCw;

  const iconColor = isDeposit
    ? "text-emerald-400"
    : isWithdraw
      ? "text-red-400"
      : "text-blue-400";

  const amountColor = isDeposit
    ? "text-emerald-400"
    : isWithdraw
      ? "text-red-400"
      : "text-blue-400";

  const amountPrefix = isDeposit ? "+" : isWithdraw ? "-" : "";

  return (
    <div className="flex items-center justify-between py-4 border-b border-zinc-800/50 last:border-0">
      <div className="flex items-center gap-4">
        <div
          className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}
        >
          <IconComponent className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div>
          <p className="text-white text-sm font-medium">{tx.walletName}</p>
          <p className="text-zinc-400 text-xs mt-0.5">
            {new Date(tx.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
      <span className={`text-sm font-medium ${amountColor}`}>
        {amountPrefix}
        {formatCurrency(tx.amount)}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: wallets = [], isLoading } = useQuery({
    queryKey: ["wallets"],
    queryFn: getWallets,
  });

  // Fetch transactions for all wallets to show recent activity
  const walletIds = wallets.map((w) => w.id);
  const txQueries = useQuery({
    queryKey: ["all-transactions", walletIds],
    queryFn: async () => {
      if (walletIds.length === 0) return [];
      const results = await Promise.all(
        wallets.map((w) =>
          getTransactions(w.id).then((txs) =>
            txs.map((tx) => ({ ...tx, walletName: w.walletName }))
          )
        )
      );
      return results
        .flat()
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 10);
    },
    enabled: wallets.length > 0,
  });

  const recentTx = txQueries.data ?? [];

  const mutation = useMutation({
    mutationFn: (data: CreateWalletData) => createWallet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      toast.success("Account created successfully!");
      setDialogOpen(false);
      reset();
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to create account";
      toast.error(message);
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  function onSubmit(data: FormData) {
    mutation.mutate({
      ...data,
      initialBalance: parseFloat(data.initialBalance) || 0,
    });
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-16">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Hero section */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-zinc-500">
              Total Balance
            </p>
            <p className="text-6xl font-thin tracking-tight text-white mt-2">
              {isLoading ? (
                <span className="bg-zinc-800 animate-pulse rounded-xl inline-block h-14 w-56 align-middle" />
              ) : (
                formatCurrency(totalBalance)
              )}
            </p>
            <p className="text-zinc-500 text-sm mt-2">
              across {wallets.length} account{wallets.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <button className="border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl px-5 py-2.5 text-sm transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Account
                </button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white">Create new account</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-medium tracking-widest uppercase text-zinc-500 block mb-2">
                      Account Name
                    </label>
                    <input
                      placeholder="e.g. Main Checking"
                      className="bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500 w-full"
                      {...register("walletName")}
                    />
                    {errors.walletName && (
                      <p className="text-red-400 text-xs mt-1.5">
                        {errors.walletName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium tracking-widest uppercase text-zinc-500 block mb-2">
                      Account Type
                    </label>
                    <Select
                      onValueChange={(val) =>
                        setValue("walletType", val as "CHECKING" | "SAVINGS", {
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white rounded-xl">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                        <SelectItem value="CHECKING" className="text-white focus:bg-zinc-800 focus:text-white">Checking</SelectItem>
                        <SelectItem value="SAVINGS" className="text-white focus:bg-zinc-800 focus:text-white">Savings</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.walletType && (
                      <p className="text-red-400 text-xs mt-1.5">
                        {errors.walletType.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium tracking-widest uppercase text-zinc-500 block mb-2">
                      Initial Balance ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500 w-full"
                      {...register("initialBalance")}
                    />
                    {errors.initialBalance && (
                      <p className="text-red-400 text-xs mt-1.5">
                        {errors.initialBalance.message}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setDialogOpen(false); reset(); }}
                      className="flex-1 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl px-5 py-2.5 text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={mutation.isPending}
                      className="flex-1 bg-white text-zinc-950 hover:bg-zinc-100 font-medium rounded-xl px-5 py-2.5 text-sm transition-colors disabled:opacity-50"
                    >
                      {mutation.isPending ? "Creating…" : "Create account"}
                    </button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <button
              onClick={() => navigate("/transfer")}
              className="bg-white text-zinc-950 hover:bg-zinc-100 font-medium rounded-xl px-5 py-2.5 text-sm transition-colors"
            >
              Transfer
            </button>
          </div>
        </div>

        <div className="border-t border-zinc-800 my-8" />

        {/* Accounts section */}
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-zinc-500 mb-4">
            My Accounts
          </p>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-zinc-800 animate-pulse rounded-2xl h-45"
                />
              ))}
            </div>
          ) : wallets.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
              <p className="text-zinc-500 text-sm">No accounts yet</p>
              <p className="text-zinc-600 text-xs mt-1">
                Create your first account to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wallets.map((wallet) => (
                <WalletCard key={wallet.id} wallet={wallet} />
              ))}
            </div>
          )}

          {!isLoading && (
            <div className="mt-4">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <button className="border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl px-5 py-2.5 text-sm transition-colors flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Account
                  </button>
                </DialogTrigger>
              </Dialog>
            </div>
          )}
        </div>

        <div className="border-t border-zinc-800 my-8" />

        {/* Recent activity */}
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-zinc-500 mb-4">
            Recent Activity
          </p>

          {txQueries.isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-zinc-800 animate-pulse rounded-xl h-16"
                />
              ))}
            </div>
          ) : recentTx.length === 0 ? (
            <p className="text-zinc-500 text-sm">No recent transactions</p>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6">
              {recentTx.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
