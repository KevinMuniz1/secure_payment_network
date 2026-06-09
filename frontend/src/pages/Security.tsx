import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Shield, Smartphone, Mail, RefreshCw, CheckCircle2 } from "lucide-react";
import apiClient from "@/api/client";

// ── API ───────────────────────────────────────────────────────────────────────

async function setupTotp(): Promise<{ secret: string; qrCodeImage: string }> {
  const res = await apiClient.post("/auth/setup-totp");
  return res.data;
}
async function enableTotp(totpCode: string): Promise<void> {
  await apiClient.post("/auth/enable-totp", { totpCode });
}
async function disableTotp(totpCode: string): Promise<void> {
  await apiClient.post("/auth/disable-totp", { totpCode });
}
async function setupEmailOtp(): Promise<void> {
  await apiClient.post("/auth/setup-email-otp");
}
async function disableEmailOtp(): Promise<void> {
  await apiClient.post("/auth/disable-email-otp");
}

// ── Schema ────────────────────────────────────────────────────────────────────

const codeSchema = z.object({
  code: z.string().length(6, "Must be 6 digits").regex(/^\d+$/, "Digits only"),
});
type CodeForm = z.infer<typeof codeSchema>;

const inputClass =
  "w-full bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl px-4 py-3 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-1 focus:ring-zinc-500";

// ── TOTP Section ──────────────────────────────────────────────────────────────

function TotpSection() {
  const [phase, setPhase] = useState<"idle" | "setup" | "enabled">("idle");
  const [qrImage, setQrImage] = useState("");
  const [secret, setSecret] = useState("");

  const setupMutation = useMutation({
    mutationFn: setupTotp,
    onSuccess: (data) => {
      setQrImage(data.qrCodeImage);
      setSecret(data.secret);
      setPhase("setup");
    },
    onError: () => toast.error("Failed to start setup"),
  });

  const enableForm = useForm<CodeForm>({ resolver: zodResolver(codeSchema) });
  const enableMutation = useMutation({
    mutationFn: (code: string) => enableTotp(code),
    onSuccess: () => {
      toast.success("Authenticator app enabled");
      setPhase("enabled");
      enableForm.reset();
    },
    onError: () => toast.error("Invalid code — try again"),
  });

  const disableForm = useForm<CodeForm>({ resolver: zodResolver(codeSchema) });
  const disableMutation = useMutation({
    mutationFn: (code: string) => disableTotp(code),
    onSuccess: () => {
      toast.success("Authenticator app disabled");
      setPhase("idle");
      disableForm.reset();
      setQrImage("");
      setSecret("");
    },
    onError: () => toast.error("Invalid code — try again"),
  });

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <p className="text-white font-medium">Authenticator App</p>
            <p className="text-zinc-500 text-sm mt-0.5">Google Authenticator, Authy, or similar</p>
          </div>
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            phase === "enabled"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              : "bg-zinc-800 text-zinc-500 border border-zinc-700"
          }`}
        >
          {phase === "enabled" ? "Active" : "Inactive"}
        </span>
      </div>

      {phase === "idle" && (
        <button
          onClick={() => setupMutation.mutate()}
          disabled={setupMutation.isPending}
          className="border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl px-5 py-2.5 text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {setupMutation.isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
          Enable authenticator app
        </button>
      )}

      {phase === "setup" && (
        <div className="space-y-5">
          <p className="text-zinc-400 text-sm">
            Scan the QR code with your authenticator app, then enter the 6-digit code to confirm.
          </p>
          {qrImage && (
            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-2xl inline-block">
                <img
                  src={`data:image/png;base64,${qrImage}`}
                  alt="TOTP QR code"
                  className="w-44 h-44"
                />
              </div>
            </div>
          )}
          {secret && (
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-center">
              <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Manual entry key</p>
              <code className="font-mono text-sm text-white tracking-widest">{secret}</code>
            </div>
          )}
          <form
            onSubmit={enableForm.handleSubmit((d) => enableMutation.mutate(d.code))}
            className="space-y-3"
          >
            <input
              placeholder="000000"
              maxLength={6}
              inputMode="numeric"
              className={inputClass}
              {...enableForm.register("code")}
            />
            {enableForm.formState.errors.code && (
              <p className="text-red-400 text-xs text-center">
                {enableForm.formState.errors.code.message}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPhase("idle")}
                className="flex-1 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-xl py-2.5 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={enableMutation.isPending}
                className="flex-1 bg-white text-zinc-950 hover:bg-zinc-100 font-medium rounded-xl py-2.5 text-sm transition-colors disabled:opacity-50"
              >
                {enableMutation.isPending ? "Confirming…" : "Confirm & enable"}
              </button>
            </div>
          </form>
        </div>
      )}

      {phase === "enabled" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Authenticator app is active on your account
          </div>
          <form
            onSubmit={disableForm.handleSubmit((d) => disableMutation.mutate(d.code))}
            className="space-y-3"
          >
            <p className="text-zinc-500 text-sm">
              Enter a current code from your app to disable.
            </p>
            <input
              placeholder="000000"
              maxLength={6}
              inputMode="numeric"
              className={`${inputClass} max-w-xs`}
              {...disableForm.register("code")}
            />
            {disableForm.formState.errors.code && (
              <p className="text-red-400 text-xs">{disableForm.formState.errors.code.message}</p>
            )}
            <button
              type="submit"
              disabled={disableMutation.isPending}
              className="border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl px-5 py-2.5 text-sm transition-colors disabled:opacity-50"
            >
              {disableMutation.isPending ? "Disabling…" : "Disable TOTP"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Email OTP Section ─────────────────────────────────────────────────────────

function EmailOtpSection() {
  const [enabled, setEnabled] = useState(false);

  const enableMutation = useMutation({
    mutationFn: setupEmailOtp,
    onSuccess: () => { toast.success("Email OTP enabled"); setEnabled(true); },
    onError: () => toast.error("Failed to enable email OTP"),
  });

  const disableMutation = useMutation({
    mutationFn: disableEmailOtp,
    onSuccess: () => { toast.success("Email OTP disabled"); setEnabled(false); },
    onError: () => toast.error("Failed to disable email OTP"),
  });

  const isPending = enableMutation.isPending || disableMutation.isPending;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
            <Mail className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <p className="text-white font-medium">Email Verification</p>
            <p className="text-zinc-500 text-sm mt-0.5">Receive a one-time code at sign-in</p>
          </div>
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            enabled
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              : "bg-zinc-800 text-zinc-500 border border-zinc-700"
          }`}
        >
          {enabled ? "Active" : "Inactive"}
        </span>
      </div>

      {enabled ? (
        <button
          disabled={isPending}
          onClick={() => disableMutation.mutate()}
          className="border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl px-5 py-2.5 text-sm transition-colors disabled:opacity-50"
        >
          {isPending ? "Disabling…" : "Disable email OTP"}
        </button>
      ) : (
        <button
          disabled={isPending}
          onClick={() => enableMutation.mutate()}
          className="border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl px-5 py-2.5 text-sm transition-colors disabled:opacity-50"
        >
          {isPending ? "Enabling…" : "Enable email OTP"}
        </button>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Security() {
  return (
    <div className="bg-zinc-950 min-h-screen pt-16">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#d4af37]" />
          </div>
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-zinc-500">Settings</p>
            <h1 className="text-2xl font-semibold text-white">Security</h1>
          </div>
        </div>

        <div className="space-y-4">
          <TotpSection />
          <EmailOtpSection />
        </div>
      </div>
    </div>
  );
}
