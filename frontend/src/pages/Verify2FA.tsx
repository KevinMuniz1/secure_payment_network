import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { completeEmailOtp, completeTotp } from "@/api/auth";
import { useAuth } from "@/context/AuthContext";

interface LocationState {
  preAuthToken: string;
  method: "totp" | "email";
}

const schema = z.object({
  code: z
    .string()
    .length(6, "Code must be exactly 6 digits")
    .regex(/^\d+$/, "Code must contain only digits"),
});

type FormData = z.infer<typeof schema>;

export default function Verify2FA() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [loading, setLoading] = useState(false);

  const state = location.state as LocationState | null;

  if (!state?.preAuthToken || !state?.method) {
    navigate("/login", { replace: true });
    return null;
  }

  const { preAuthToken, method } = state;
  const isTOTP = method === "totp";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const { data: res } = isTOTP
        ? await completeTotp(preAuthToken, data.code)
        : await completeEmailOtp(preAuthToken, data.code);

      auth.login(res.token, res.refreshToken, res.email, res.role);
      toast.success("Verified successfully!");
      navigate("/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Invalid code. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-sm">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(212,175,55,0.1)" }}
          >
            <Shield className="w-8 h-8" style={{ color: "#d4af37" }} />
          </div>
        </div>

        {/* Labels */}
        <p className="text-xs font-medium tracking-widest uppercase text-zinc-500 text-center">
          Two-Factor Auth
        </p>
        <h1 className="text-2xl font-semibold text-white mt-1 mb-2 text-center">
          Verify your identity
        </h1>
        <p className="text-sm text-zinc-400 text-center mb-8">
          {isTOTP
            ? "Enter the 6-digit code from your authenticator app."
            : "Enter the 6-digit code sent to your email address."}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              className="bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-zinc-500 w-full text-center font-mono text-2xl tracking-widest"
              {...register("code")}
            />
            {errors.code && (
              <p className="text-red-400 text-xs mt-1.5 text-center">
                {errors.code.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-zinc-950 hover:bg-zinc-100 font-medium rounded-xl px-5 py-2.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying…" : "Verify"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-zinc-500 text-sm hover:text-white transition-colors"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
