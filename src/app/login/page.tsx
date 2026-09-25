"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMessage(res.error);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: "admin" | "user") => {
    if (role === "admin") {
      setEmail("admin@anagataitsolutions.in");
      setPassword("admin123");
    } else {
      setEmail("user@example.com");
      setPassword("user123");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-stone-200/80 overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Side: Indian Postal Heritage */}
        <div className="bg-gradient-to-br from-[#8B1A1E] via-[#6F1417] to-[#420B0D] p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center text-white font-serif font-black text-xl border border-white/20">
                अ
              </div>
              <span className="font-serif font-bold text-xl tracking-tight text-white">
                AnagataPost
              </span>
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-mono tracking-wider uppercase mb-4 text-red-200">
              Bharat Mail Infrastructure
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-bold leading-tight mb-4">
              Physical letters hold legal and emotional weight that no email can match.
            </h2>
            <p className="text-xs text-red-100/80 leading-relaxed font-sans">
              Connect your applications, AI pipelines, or team workflows directly to India Post Speed Post. 100 GSM Bond paper, tamper-evident C5 envelopes, and automated tracking.
            </p>
          </div>

          <div className="pt-8 border-t border-white/15">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-mono text-red-100">
                19,101 PIN Codes Active Across 28 States & 8 UTs
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Sign In Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h1 className="text-2xl font-serif font-bold text-slate-900">Sign in to your account</h1>
            <p className="text-xs text-stone-500 mt-1">
              Access letter dispatch archives, address books, and API credentials.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-mono">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full py-2.5 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-slate-800 text-xs font-semibold shadow-sm flex items-center justify-center gap-3 transition-colors mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-stone-400 font-mono text-[11px]">
                or sign in with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Work Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rajesh@company.in"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent font-sans"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-stone-700">Password</label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-red-700/20 transition-all"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-5 pt-4 border-t border-stone-200">
            <span className="text-[11px] font-mono text-stone-500 uppercase tracking-wider block mb-2">
              Quick One-Click Demo Logins:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo("admin")}
                className="p-2 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 text-left transition-colors"
              >
                <span className="text-[11px] font-semibold text-red-700 block">👑 Admin Console</span>
                <span className="text-[10px] text-stone-500 font-mono">admin@anagata...</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo("user")}
                className="p-2 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 text-left transition-colors"
              >
                <span className="text-[11px] font-semibold text-slate-800 block">👤 Enterprise User</span>
                <span className="text-[10px] text-stone-500 font-mono">user@example.com</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-stone-600">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-red-700 font-semibold hover:underline">
              Create an account (Get ₹500 free credit)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-mono text-xs text-stone-500">
          Loading sign in portal...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
