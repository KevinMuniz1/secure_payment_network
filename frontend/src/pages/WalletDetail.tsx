import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getWallet, getTransactions, deposit, withdraw } from "@/api/wallets";
import type { Transaction } from "@/api/wallets";

const amountSchema = z.object({ amount: z.string().min(1, "Required") });
type AmountForm = z.infer<typeof amountSchema>;

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function TxIcon({ type }: { type: Transaction["type"] }) {
  if (type === "DEPOSIT")
    return (
      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
        <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
      </div>
    );
  if (type === "WITHDRAW")
    return (
      <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
        <ArrowUpRight className="w-4 h-4 text-red-400" />
      </div>
    );
  return (
    <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
      <RefreshCw className="w-4 h-4 text-blue-400" />
    </div>
  );
}

function AmountDialog({
  title,
  description,
  buttonLabel,
  buttonClass,
  isPending,
  fraudDetected,
  onSubmit,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  buttonClass: string;
  isPending: boolean;
  fraudDetected?: boolean;
  onSubmit: (amount: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AmountForm>({
    resolver: zodResolver(amountSchema),
  });

  function submit(data: AmountForm) {
    onSubmit(data.amount);
    reset();
    if (!fraudDetected) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className={buttonClass}>{buttonLabel}</button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-semibold">{title}</DialogTitle>
          <p className="text-zinc-500 text-sm">{description}</p>
        </DialogHeader>

        {fraudDetected && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 mt-2">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 text-sm font-medium">Transaction blocked</p>
              <p className="text-red-400/70 text-xs mt-0.5">
                Our fraud detection system flagged this transaction. If you believe this is an error, contact support.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(submit)} className="space-y-4 mt-2">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">$</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
              {...register("amount")}
            />
            {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-white text-zinc-950 hover:bg-zinc-100 font-medium rounded-xl py-2.5 text-sm transition-colors disabled:opacity-50"
          >
            {isPending ? "Processing…" : buttonLabel}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function WalletDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [fraudDetected, setFraudDetected] = useState(false);

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet", id],
    queryFn: () => getWallet(id!),
    enabled: !!id,
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["transactions", id],
    queryFn: () => getTransactions(id!),
    enabled: !!id,
  });

  const depositMutation = useMutation({
    mutationFn: (amount: number) => deposit(id!, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", id] });
      queryClient.invalidateQueries({ queryKey: ["transactions", id] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      toast.success("Deposit successful");
    },
    onError: () => toast.error("Deposit failed"),
  });

  const withdrawMutation = useMutation({
    mutationFn: (amount: number) => withdraw(id!, amount),
    onSuccess: () => {
      setFraudDetected(false);
      queryClient.invalidateQueries({ queryKey: ["wallet", id] });
      queryClient.invalidateQueries({ queryKey: ["transactions", id] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      toast.success("Withdrawal successful");
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 422) {
        setFraudDetected(true);
        toast.error("Transaction blocked by fraud detection");
      } else {
        toast.error("Withdrawal failed");
      }
    },
  });

  if (walletLoading) {
    return (
      <div className="bg-zinc-950 min-h-screen pt-16">
        <div className="max-w-4xl mx-auto px-6 py-10 space-y-6 animate-pulse">
          <div className="h-4 bg-zinc-800 rounded w-24" />
          <div className="h-52 bg-zinc-900 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="bg-zinc-950 min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 text-sm mb-4">Wallet not found.</p>
          <button onClick={() => navigate("/dashboard")} className="text-white text-sm hover:text-zinc-300">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="bg-zinc-950 min-h-screen pt-16">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Back */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-sm transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>

        {/* Premium card */}
        <div className="bg-linear-to-br from-zinc-800 via-zinc-900 to-zinc-950 border border-zinc-700/50 rounded-3xl p-8 mb-6">
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="text-xs font-medium tracking-widest uppercase text-zinc-500 mb-1">
                {wallet.walletType}
              </p>
              <p className="text-white font-medium text-lg">{wallet.walletName}</p>
            </div>
            <div className="w-9 h-9 bg-[#d4af37] rounded-xl flex items-center justify-center">
              <span className="text-zinc-950 text-xs font-bold">V</span>
            </div>
          </div>
          <div>
            <p className="text-xs tracking-widest uppercase text-zinc-500 mb-2">Balance</p>
            <p className="text-5xl font-light text-white tracking-tight">${fmt(wallet.balance)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-10">
          <AmountDialog
            title="Deposit funds"
            description="Add money to this account"
            buttonLabel="Deposit"
            buttonClass="border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl px-5 py-2.5 text-sm transition-colors"
            isPending={depositMutation.isPending}
            onSubmit={(amount) => {
              const n = parseFloat(amount);
              if (!isNaN(n) && n > 0) depositMutation.mutate(n);
            }}
          />
          <AmountDialog
            title="Withdraw funds"
            description="Remove money from this account"
            buttonLabel="Withdraw"
            buttonClass="border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl px-5 py-2.5 text-sm transition-colors"
            isPending={withdrawMutation.isPending}
            fraudDetected={fraudDetected}
            onSubmit={(amount) => {
              setFraudDetected(false);
              const n = parseFloat(amount);
              if (!isNaN(n) && n > 0) withdrawMutation.mutate(n);
            }}
          />
        </div>

        {/* Transaction history */}
        <div>
          <p className="text-xs font-medium tracking-widest uppercase text-zinc-500 mb-4">
            Transaction History
          </p>

          {txLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-zinc-900 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
              <p className="text-zinc-500 text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl divide-y divide-zinc-800">
              {sorted.map((tx) => (
                <div key={tx.id} className="flex items-center gap-4 px-5 py-4">
                  <TxIcon type={tx.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium capitalize">
                      {tx.type.toLowerCase()}
                    </p>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      {new Date(tx.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <p
                    className={`text-sm font-medium tabular-nums ${
                      tx.type === "DEPOSIT"
                        ? "text-emerald-400"
                        : tx.type === "WITHDRAW"
                          ? "text-red-400"
                          : "text-blue-400"
                    }`}
                  >
                    {tx.type === "DEPOSIT" ? "+" : "-"}${fmt(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
