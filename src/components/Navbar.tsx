"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import CashfreeModal from "./CashfreeModal";

export default function Navbar() {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isCashfreeOpen, setIsCashfreeOpen] = useState(false);

  const user = session?.user as any;
  const balanceInr = user?.balancePaise ? (user.balancePaise / 100).toFixed(2) : "500.00";
  const role = user?.role || "USER";
  const isAdmin = role === "ADMIN";

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-white/95 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-red-700 flex items-center justify-center text-white font-serif font-black text-xl shadow-sm shadow-red-700/30 group-hover:scale-105 transition-transform border border-red-800">
                अ
              </div>
              <div>
                <span className="font-serif font-bold text-lg text-slate-900 tracking-tight block leading-tight">
                  AnagataPost
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-red-700 font-semibold block leading-none">
                  Bharat Mail API
                </span>
              </div>
            </Link>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-6 pl-4 border-l border-stone-200">
              <Link
                href="/send"
                className="text-sm font-medium text-slate-600 hover:text-red-700 transition-colors"
              >
                Send Letter
              </Link>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-slate-600 hover:text-red-700 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/developers"
                className="text-sm font-medium text-slate-600 hover:text-red-700 transition-colors flex items-center gap-1.5"
              >
                <span>Developers</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-mono">
                  API
                </span>
              </Link>
              <Link
                href="/admin"
                className="text-sm font-medium text-slate-600 hover:text-red-700 transition-colors flex items-center gap-1.5"
              >
                <span>Operations</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-mono">
                  {isAdmin ? "Admin Suite" : "Print Ops"}
                </span>
              </Link>
            </nav>
          </div>

          {/* Right side CTAs / User Session */}
          <div className="flex items-center gap-3">
            {session ? (
              <>
                {/* Cashfree Wallet Balance Badge */}
                <button
                  type="button"
                  onClick={() => setIsCashfreeOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-mono text-stone-700 transition-all shadow-sm group"
                  title="Click to recharge wallet via Cashfree"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Wallet:</span>
                  <span className="font-semibold text-slate-900">₹{balanceInr}</span>
                  <span className="text-[11px] bg-red-700 text-white rounded px-1 group-hover:scale-105 transition-transform">
                    +
                  </span>
                </button>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-stone-200 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-stone-800 text-white font-serif font-bold text-xs flex items-center justify-center border border-stone-700">
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                  </button>

                  {dropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-2xl border border-stone-200 py-2 text-xs z-50 animate-in fade-in zoom-in-95 duration-150"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <div className="px-4 py-3 border-b border-stone-100">
                        <div className="font-semibold text-slate-900 truncate">
                          {user?.name || "User"}
                        </div>
                        <div className="text-stone-500 font-mono text-[11px] truncate">
                          {user?.email}
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                              isAdmin
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : "bg-stone-100 text-stone-700"
                            }`}
                          >
                            {role}
                          </span>
                          {user?.company && (
                            <span className="text-stone-500 text-[11px] truncate">
                              • {user.company}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          className="flex items-center px-4 py-2 text-stone-700 hover:bg-stone-50 hover:text-red-700"
                        >
                          📦 Letters & Dispatches
                        </Link>
                        <Link
                          href="/dashboard/addresses"
                          className="flex items-center px-4 py-2 text-stone-700 hover:bg-stone-50 hover:text-red-700"
                        >
                          📇 Address Book
                        </Link>
                        <Link
                          href="/dashboard/templates"
                          className="flex items-center px-4 py-2 text-stone-700 hover:bg-stone-50 hover:text-red-700"
                        >
                          📜 Letter Templates
                        </Link>
                        <Link
                          href="/dashboard/billing"
                          className="flex items-center px-4 py-2 text-stone-700 hover:bg-stone-50 hover:text-red-700"
                        >
                          💳 Cashfree Wallet & GST Invoices
                        </Link>
                        <Link
                          href="/developers"
                          className="flex items-center px-4 py-2 text-stone-700 hover:bg-stone-50 hover:text-red-700"
                        >
                          🔑 API Keys & Webhooks
                        </Link>
                        {isAdmin && (
                          <div className="border-t border-stone-100 my-1 pt-1">
                            <Link
                              href="/admin"
                              className="flex items-center px-4 py-2 text-red-800 font-semibold hover:bg-red-50"
                            >
                              👑 Executive Admin Suite
                            </Link>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-stone-100 pt-1">
                        <button
                          type="button"
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="w-full text-left px-4 py-2 text-red-700 hover:bg-red-50 font-medium"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm shadow-red-700/20 transition-all"
                >
                  <span>Get Started</span>
                  <span className="text-[10px] opacity-80">(₹500 Free)</span>
                </Link>
              </div>
            )}

            <Link
              href="/send"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white px-3.5 py-1.5 text-xs sm:text-sm font-medium shadow-sm shadow-red-700/20 transition-all hover:shadow-md"
            >
              <span>Send Letter</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Cashfree Drop-in Modal */}
      <CashfreeModal
        isOpen={isCashfreeOpen}
        onClose={() => setIsCashfreeOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
        defaultAmount={500}
        customerName={user?.name || "Anagata Customer"}
        customerEmail={user?.email || "customer@anagataitsolutions.in"}
      />
    </>
  );
}
