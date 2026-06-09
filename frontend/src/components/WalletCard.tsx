import { useNavigate } from "react-router-dom";
import type { Wallet } from "@/api/wallets";

interface WalletCardProps {
  wallet: Wallet;
}

function formatCurrency(val: number): string {
  return `$${Number(val).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function WalletCard({ wallet }: WalletCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/wallet/${wallet.id}`)}
      className="relative h-45 w-full rounded-2xl p-6 flex flex-col justify-between cursor-pointer hover:-translate-y-1 transition-transform duration-200 bg-linear-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 overflow-hidden"
    >
      {/* Subtle decorative circle */}
      <div
        className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10"
        style={{ backgroundColor: "#d4af37" }}
      />

      {/* Top row */}
      <div className="flex items-start justify-between relative z-10">
        <span className="text-white font-medium text-sm truncate max-w-[70%]">
          {wallet.walletName}
        </span>
        <span
          className="text-xs uppercase tracking-wider font-medium"
          style={{ color: "#d4af37" }}
        >
          {wallet.walletType}
        </span>
      </div>

      {/* Bottom row */}
      <div className="flex items-end justify-between relative z-10">
        <span className="text-3xl font-light text-white">
          {formatCurrency(wallet.balance)}
        </span>
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center"
          style={{ backgroundColor: "#d4af37" }}
        >
          <span className="text-xs font-bold text-zinc-950">V</span>
        </div>
      </div>
    </div>
  );
}
