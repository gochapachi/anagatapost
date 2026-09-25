import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans, Caveat, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-handwriting",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AnagataPost — Indian Physical Mail as a Service API & AI Agents",
  description:
    "Send real physical letters anywhere in India via a single API call, an AI agent, or our web portal. We handle laser printing on 100 GSM bond paper, tamper-evident enveloping, and delivery via India Post Speed Post.",
  keywords: [
    "physical mail API India",
    "send letters API India",
    "India Post Speed Post API",
    "direct mail API",
    "AI agent physical mail",
    "legal notice postal API",
    "AnagataPost",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${jakarta.variable} ${caveat.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-[#FAF8F5] text-slate-900 selection:bg-red-100 selection:text-red-900 antialiased">
        {/* Navigation Header */}
        <header className="sticky top-0 z-50 w-full border-b border-stone-200/80 bg-white/90 backdrop-blur-md transition-all">
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
                  <span>Fulfillment Hub</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-mono">
                    Print Ops
                  </span>
                </Link>
              </nav>
            </div>

            {/* Right side CTAs */}
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-stone-200 bg-stone-50/80 hover:bg-stone-100 text-xs font-mono text-stone-700 transition-all"
                title="Account Balance"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Balance: </span>
                <span className="font-semibold text-slate-900">₹500.00</span>
              </Link>

              <Link
                href="/send"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-700 hover:bg-red-800 text-white px-4 py-2 text-sm font-medium shadow-sm shadow-red-700/20 transition-all hover:shadow-md"
              >
                <span>Send Letter</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-stone-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-red-700 flex items-center justify-center text-white font-serif font-black text-sm">
                    अ
                  </div>
                  <span className="font-serif font-bold text-base text-slate-900">
                    AnagataPost
                  </span>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Indian Physical Mail as a Service. Send real letters anywhere in India through a
                  single API call, AI agent, or web dashboard. We print, stamp, and deliver via India
                  Post.
                </p>
                <div className="flex items-center gap-2 text-xs text-stone-500 pt-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>100% Indian Pincode Coverage</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
                  Product
                </h4>
                <ul className="space-y-2 text-xs text-stone-600">
                  <li>
                    <Link href="/send" className="hover:text-red-700">
                      Send a Letter
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard" className="hover:text-red-700">
                      Postal Tracking
                    </Link>
                  </li>
                  <li>
                    <Link href="/send?type=legal" className="hover:text-red-700">
                      Legal Notices (Sec 138 NI Act)
                    </Link>
                  </li>
                  <li>
                    <Link href="/send?type=handwritten" className="hover:text-red-700">
                      Handwritten Notes
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin" className="hover:text-red-700">
                      Print Operations Hub
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
                  Developers & Agents
                </h4>
                <ul className="space-y-2 text-xs text-stone-600">
                  <li>
                    <Link href="/developers" className="hover:text-red-700">
                      REST API Documentation
                    </Link>
                  </li>
                  <li>
                    <a href="/skill.md" target="_blank" className="hover:text-red-700">
                      Agent Skill (/skill.md)
                    </a>
                  </li>
                  <li>
                    <a href="/api/mcp" target="_blank" className="hover:text-red-700">
                      MCP Server Schema (/api/mcp)
                    </a>
                  </li>
                  <li>
                    <a href="/anagatapost-n8n-workflow.json" download className="hover:text-red-700">
                      n8n Workflow Template
                    </a>
                  </li>
                  <li>
                    <Link href="/developers#evolution-api" className="hover:text-red-700">
                      Evolution WhatsApp Webhooks
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">
                  Postal Standards
                </h4>
                <div className="space-y-2 text-xs text-stone-500">
                  <p>🇮🇳 India Post Speed Post & Registered Post Compliant</p>
                  <p>📄 100 GSM Executive Bond Paper</p>
                  <p>✉️ Windowed Tamper-Proof 120 GSM Envelopes</p>
                  <p>📍 All 19,101 PIN codes covered across 28 states & 8 UTs</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-4">
              <p>© {new Date().getFullYear()} AnagataPost by Anagata IT Solutions. Built for Bharat.</p>
              <div className="flex items-center gap-4">
                <span>Deployable via Coolify on Ubuntu 24.04</span>
                <span>•</span>
                <span>Evolution API WhatsApp Enabled</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
