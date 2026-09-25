"use client";

import { useState } from "react";
import Link from "next/link";

export default function DevelopersPage() {
  const [apiKey, setApiKey] = useState("ap_live_bharat_post_demo123");
  const [copiedKey, setCopiedKey] = useState(false);
  const [activeLang, setActiveLang] = useState<"curl" | "python" | "node">("curl");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumbs & Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-xs font-mono text-stone-500 mb-2">
          <Link href="/" className="hover:text-red-700">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">Developers</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900">Developer Platform & API</h1>
            <p className="text-sm text-stone-600 mt-1">
              Send real letters via REST API, AI Agents (Cursor, Claude, OpenClaw), or n8n workflows.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/skill.md"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-xs font-mono text-slate-800 shadow-sm"
            >
              <span>📄 View /skill.md</span>
            </a>
            <a
              href="/api/mcp"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-xs font-mono text-slate-800 shadow-sm"
            >
              <span>🤖 View /api/mcp</span>
            </a>
          </div>
        </div>
      </div>

      {/* API Key Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 mb-12 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-semibold">
              Live Authentication
            </span>
            <h3 className="font-serif text-lg font-bold text-white mt-0.5">Your Active API Key</h3>
            <p className="text-xs text-slate-400">
              Pass this key as a Bearer token in the <code>Authorization</code> HTTP header.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
            <code className="text-xs font-mono text-amber-300 px-2">{apiKey}</code>
            <button
              onClick={() => copyToClipboard(apiKey)}
              className="px-3 py-1 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold transition-colors"
            >
              {copiedKey ? "Copied! ✓" : "Copy Key"}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Start Tabs */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8 mb-12">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-6">
          <h2 className="font-serif font-bold text-xl text-slate-900">Quick Start: Send a Letter</h2>
          <div className="flex gap-1 bg-stone-100 p-1 rounded-xl text-xs font-mono">
            <button
              onClick={() => setActiveLang("curl")}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeLang === "curl" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-stone-600"
              }`}
            >
              cURL
            </button>
            <button
              onClick={() => setActiveLang("python")}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeLang === "python" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-stone-600"
              }`}
            >
              Python
            </button>
            <button
              onClick={() => setActiveLang("node")}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeLang === "node" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-stone-600"
              }`}
            >
              Node.js
            </button>
          </div>
        </div>

        {/* Code Block */}
        <div className="rounded-xl bg-slate-950 p-5 text-slate-300 font-mono text-xs leading-6 overflow-x-auto border border-slate-800">
          {activeLang === "curl" && (
            <pre>
              <code>{`curl -X POST https://post.anagataitsolutions.in/api/v1/letters \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipient": "Rohan Gupta",
    "phone": "9876543210",
    "address": {
      "street": "104, Cyber Heights, 4th Cross",
      "locality": "HSR Layout Sector 1",
      "city": "Bengaluru",
      "state": "Karnataka",
      "pincode": "560102"
    },
    "content": "Dear Rohan,\\n\\nWe are pleased to send your physical certificate of equity allocation.\\n\\nWarm regards,\\nFounder Office",
    "delivery_type": "SPEED_POST",
    "handwriting": "CAVEAT"
  }'`}</code>
            </pre>
          )}

          {activeLang === "python" && (
            <pre>
              <code>{`import requests

url = "https://post.anagataitsolutions.in/api/v1/letters"
headers = {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
}
payload = {
    "recipient": "Rohan Gupta",
    "phone": "9876543210",
    "address": {
        "street": "104, Cyber Heights, 4th Cross",
        "locality": "HSR Layout Sector 1",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "560102"
    },
    "content": "Dear Rohan,\\n\\nYour physical documents are enclosed.",
    "delivery_type": "SPEED_POST",
    "handwriting": "CAVEAT"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`}</code>
            </pre>
          )}

          {activeLang === "node" && (
            <pre>
              <code>{`const response = await fetch("https://post.anagataitsolutions.in/api/v1/letters", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    recipient: "Rohan Gupta",
    phone: "9876543210",
    address: {
      street: "104, Cyber Heights, 4th Cross",
      locality: "HSR Layout Sector 1",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560102"
    },
    content: "Dear Rohan,\\n\\nYour physical documents are enclosed.",
    delivery_type: "SPEED_POST"
  })
});

const data = await response.json();
console.log(data.id, data.tracking_url);`}</code>
            </pre>
          )}
        </div>
      </div>

      {/* VPS Ecosystem Superpowers Grid: n8n & Evolution API */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* n8n Integration Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl">⚡</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
              n8n.anagataitsolutions.in
            </span>
          </div>
          <h3 className="font-serif font-bold text-xl text-slate-900">n8n Workflow Automation</h3>
          <p className="text-sm text-stone-600 leading-relaxed">
            Trigger physical letters automatically from your CRM, Stripe payments, or Google Sheets
            running on your VPS n8n instance. We provide a ready-to-import workflow template.
          </p>

          <div className="pt-2">
            <a
              href="/anagatapost-n8n-workflow.json"
              download
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
            >
              <span>📥 Download n8n Workflow JSON</span>
            </a>
          </div>
        </div>

        {/* Evolution API Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl">💬</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
              evo.anagataitsolutions.in
            </span>
          </div>
          <h3 className="font-serif font-bold text-xl text-slate-900">Evolution WhatsApp Dispatch</h3>
          <p className="text-sm text-stone-600 leading-relaxed">
            Whenever an operations print partner stamps and dispatches a letter via Speed Post, our
            system calls your Evolution API instance to notify the recipient via WhatsApp with the live
            consignment tracking link.
          </p>
          <div className="text-xs font-mono text-stone-500 bg-stone-50 p-3 rounded-lg border border-stone-200">
            Endpoint: <code>/message/sendText/anagata-post</code>
          </div>
        </div>
      </div>

      {/* Endpoints Reference Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8">
        <h3 className="font-serif font-bold text-xl text-slate-900 mb-6">REST API Endpoints Reference</h3>

        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-stone-200 hover:border-red-300 transition-colors">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-mono text-xs font-bold">
                POST
              </span>
              <code className="font-mono text-sm font-semibold text-slate-900">/api/v1/letters</code>
            </div>
            <p className="text-xs text-stone-600 mt-2">
              Create a new physical letter (immediate dispatch or saved draft). Validates 6-digit Indian
              PIN code and deducts wallet balance.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 hover:border-red-300 transition-colors">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 font-mono text-xs font-bold">
                GET
              </span>
              <code className="font-mono text-sm font-semibold text-slate-900">/api/v1/letters</code>
            </div>
            <p className="text-xs text-stone-600 mt-2">List all physical letters sent by your account.</p>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 hover:border-red-300 transition-colors">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 font-mono text-xs font-bold">
                GET
              </span>
              <code className="font-mono text-sm font-semibold text-slate-900">/api/v1/letters/:id</code>
            </div>
            <p className="text-xs text-stone-600 mt-2">
              Get details of a single letter and its real-time postal tracking milestones.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 hover:border-red-300 transition-colors">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 font-mono text-xs font-bold">
                PATCH
              </span>
              <code className="font-mono text-sm font-semibold text-slate-900">/api/v1/letters/:id</code>
            </div>
            <p className="text-xs text-stone-600 mt-2">
              Update the content or recipient address of a letter in <code>DRAFT</code> status.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 hover:border-red-300 transition-colors">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-mono text-xs font-bold">
                POST
              </span>
              <code className="font-mono text-sm font-semibold text-slate-900">/api/v1/letters/:id/send</code>
            </div>
            <p className="text-xs text-stone-600 mt-2">
              Send a draft letter. Deducts balance and queues for printing and postal dispatch.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 hover:border-red-300 transition-colors">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 font-mono text-xs font-bold">
                GET
              </span>
              <code className="font-mono text-sm font-semibold text-slate-900">
                /api/v1/pincode/:pincode
              </code>
            </div>
            <p className="text-xs text-stone-600 mt-2">
              Instant Indian PIN code directory lookup (returns District, State, Delivery Post Office,
              and Postal Circle).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
