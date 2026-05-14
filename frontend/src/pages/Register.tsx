import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { register as apiRegister } from "@/api/auth";

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    setErrorMsg(null);
    try {
      await apiRegister(data);
      toast.success("Account created! Please sign in.");
      navigate("/login");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Registration failed. Please try again.";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-zinc-950">
      {/* Left form panel */}
      <div className="w-full md:w-1/2 bg-zinc-950 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#d4af37" }}
            >
              <span className="text-xs font-bold text-zinc-950">V</span>
            </div>
            <span className="text-white font-semibold tracking-wide">Vault</span>
          </div>

          <p className="text-xs font-medium tracking-widest uppercase text-zinc-500">
            Get Started
          </p>
          <h2 className="text-2xl font-semibold text-white mt-1 mb-8">
            Create your account
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="First name"
                  autoComplete="given-name"
                  className="bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500 w-full"
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <p className="text-red-400 text-xs mt-1.5">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Last name"
                  autoComplete="family-name"
                  className="bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500 w-full"
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <p className="text-red-400 text-xs mt-1.5">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <input
                type="email"
                placeholder="Email address"
                autoComplete="email"
                className="bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500 w-full"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1.5">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <input
                type="password"
                placeholder="Password (min. 8 characters)"
                autoComplete="new-password"
                className="bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500 w-full"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-red-400 text-xs mt-1.5">
                  {errors.password.message}
                </p>
              )}
            </div>

            {errorMsg && (
              <p className="text-red-400 text-sm">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-zinc-950 hover:bg-zinc-100 font-medium rounded-xl px-5 py-2.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-zinc-500 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="hover:text-white transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right branding panel */}
      <div className="hidden md:flex w-1/2 bg-zinc-900 relative flex-col items-center justify-center overflow-hidden">
        {/* Decorative circles */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full"
          style={{ backgroundColor: "rgba(212,175,55,0.05)" }}
        />
        <div
          className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full"
          style={{ backgroundColor: "rgba(212,175,55,0.04)" }}
        />

        <div className="relative z-10 flex flex-col items-center text-center px-12">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-8"
            style={{ backgroundColor: "#d4af37" }}
          >
            <span className="text-sm font-bold text-zinc-950">V</span>
          </div>

          <h1 className="text-4xl font-light text-white leading-tight">
            Join thousands managing their finances smarter.
          </h1>
          <p className="text-zinc-500 text-sm mt-4">
            Secure accounts. Real-time transfers. Intelligent fraud detection.
          </p>
        </div>
      </div>
    </div>
  );
}
