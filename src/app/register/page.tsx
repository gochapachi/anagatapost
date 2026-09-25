"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    company: "",
    gstin: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage("Account created! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        setErrorMessage(data.error || "Failed to create account.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-stone-200/80 p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-semibold mb-3">
            <span>🎁 ₹500 Trial Credit Included</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">
            Create your AnagataPost Account
          </h1>
          <p className="text-sm text-stone-500 mt-1 max-w-md mx-auto">
            Send legal notices, investor updates, welcome kits, and formal letters directly to any Indian PIN code.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-mono">
            ⚠️ {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-mono">
            ✅ {successMessage}
          </div>
        )}

        {/* Google Sign In Option */}
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full py-2.5 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-slate-800 text-xs font-semibold shadow-sm flex items-center justify-center gap-3 transition-colors mb-6"
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
          <span>Sign up with Google</span>
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-stone-400 font-mono text-[11px]">
              or register with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Full Name / Signatory *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Advocate Rajesh Verma"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Mobile Number (+91)
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Work Email *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="rajesh@vermalegal.in"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Password (min. 6 chars) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent font-sans"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Company / Law Firm / Entity
              </label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Verma & Associates Legal"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                GSTIN (Optional, for 18% Input Credit)
              </label>
              <input
                type="text"
                maxLength={15}
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                placeholder="29AAAAA0000A1Z5"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent font-mono"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-red-700/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Creating your account..." : "Complete Registration & Get ₹500 Credit"}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-stone-600">
          Already have an account?{" "}
          <Link href="/login" className="text-red-700 font-semibold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
