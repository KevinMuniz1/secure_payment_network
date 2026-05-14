import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getWallets, transfer } from "@/api/wallets";

const schema = z.object({
  fromWalletId: z.string().min(1, "Select a source wallet"),
  toWalletId: z.string().min(1, "Destination wallet ID is required"),
  amount: z.string().min(1, "Amount is required"),
});
type FormData = z.infer<typeof schema>;

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Transfer() {
  const navigate = useNavigate();

  const { data: wallets = [] } = useQuery({
    queryKey: ["wallets"],
    queryFn: getWallets,
  });

  const mutation = useMutation({
    mutationFn: (data: { fromWalletId: string; toWalletId: string; amount: number }) =>
      transfer(data),
    onSuccess: () => {
      toast.success("Transfer completed");
      navigate("/dashboard");
    },
    onError: () => toast.error("Transfer failed. Check the destination ID and balance."),
  });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  function onSubmit(data: FormData) {
    const amount = parseFloat(data.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    mutation.mutate({ fromWalletId: data.fromWalletId, toWalletId: data.toWalletId, amount });
  }

  return (
    <div className="bg-zinc-950 min-h-screen pt-16">
      <div className="max-w-lg mx-auto px-6 py-10">
        {/* Back */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-white text-sm transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2">
            Payments
          </p>
          <h1 className="text-2xl font-semibold text-white">Transfer funds</h1>
          <p className="text-zinc-500 text-sm mt-1">Move money between accounts instantly</p>
        </div>

        {/* Form card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* From wallet */}
            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
                From
              </label>
              <Select onValueChange={(val) => setValue("fromWalletId", val, { shouldValidate: true })}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white rounded-xl h-11 focus:ring-zinc-500">
                  <SelectValue placeholder="Select wallet" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-white rounded-xl">
                  {wallets.map((w) => (
                    <SelectItem
                      key={w.id}
                      value={w.id}
                      className="focus:bg-zinc-700 focus:text-white"
                    >
                      <span className="font-medium">{w.walletName}</span>
                      <span className="text-zinc-400 ml-2">${fmt(w.balance)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.fromWalletId && (
                <p className="text-red-400 text-xs">{errors.fromWalletId.message}</p>
              )}
            </div>

            {/* Divider with arrow */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-800" />
              <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center">
                <span className="text-zinc-500 text-xs">↓</span>
              </div>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            {/* To wallet */}
            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
                To (Wallet ID)
              </label>
              <input
                placeholder="Paste destination wallet ID"
                className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
                {...register("toWalletId")}
              />
              {errors.toWalletId && (
                <p className="text-red-400 text-xs">{errors.toWalletId.message}</p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  {...register("amount")}
                />
              </div>
              {errors.amount && (
                <p className="text-red-400 text-xs">{errors.amount.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="flex-1 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl py-2.5 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 bg-white text-zinc-950 hover:bg-zinc-100 font-medium rounded-xl py-2.5 text-sm transition-colors disabled:opacity-50"
              >
                {mutation.isPending ? "Sending…" : "Send transfer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
