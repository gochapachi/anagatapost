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

import { Providers } from "@/components/Providers";
import Navbar from "@/components/Navbar";

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
        <Providers>
          <Navbar />
          {/* Page Content */}
          <main className="flex-1">{children}</main>
        </Providers>

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
