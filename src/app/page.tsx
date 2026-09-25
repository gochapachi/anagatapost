"use client";

import { useState } from "react";
import Link from "next/link";
import { lookupPincode } from "@/lib/pincodes";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"curl" | "python" | "node" | "agent">("python");
  const [testPin, setTestPin] = useState("560034");
  const [pinResult, setPinResult] = useState<any>({
    pincode: "560034",
    postOffice: "Koramangala S.O",
    district: "Bengaluru Urban",
    state: "Karnataka",
    circle: "Karnataka",
  });
  const [isCheckingPin, setIsCheckingPin] = useState(false);

  const handleCheckPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[1-9][0-9]{5}$/.test(testPin)) return;
    setIsCheckingPin(true);
    try {
      const res = await fetch(`/api/v1/pincode/${testPin}`);
      if (res.ok) {
        const data = await res.json();
        setPinResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingPin(false);
    }
  };

  const stamps = [
    { name: "Tiranga Flag", faceValue: "₹50", origin: "Speed Post National", color: "from-orange-500 to-green-600" },
    { name: "ISRO Chandrayaan-3", faceValue: "₹25", origin: "Space Series", color: "from-indigo-600 to-blue-800" },
    { name: "Mahatma Gandhi", faceValue: "₹20", origin: "Heritage India", color: "from-amber-600 to-amber-800" },
    { name: "Royal Bengal Tiger", faceValue: "₹15", origin: "Fauna of Bharat", color: "from-yellow-600 to-orange-700" },
    { name: "Sun Temple Konark", faceValue: "₹30", origin: "Architectural Wonders", color: "from-red-600 to-amber-700" },
    { name: "Indian Peacock", faceValue: "₹10", origin: "National Symbols", color: "from-teal-600 to-emerald-700" },
    { name: "Varanasi Ghats", faceValue: "₹35", origin: "Ganga Series", color: "from-blue-600 to-indigo-800" },
  ];

  return (
    <div className="w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-16 md:pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
              <span className="flex h-2 w-2 rounded-full bg-red-600 animate-ping"></span>
              <span>Bharat&#39;s 1st Agent-Native Physical Mail API</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-slate-900 tracking-tight leading-[1.1]">
              Send real letters anywhere in India.
            </h1>

            <p className="text-lg sm:text-xl text-stone-600 leading-relaxed max-w-2xl">
              Physical mail gets opened. Inboxes get ignored. Send real paper letters across 19,000+
              Indian PIN codes with a single API call, an AI agent, or our dashboard. We handle
              laser printing on 100 GSM bond paper, postal stamping, and Speed Post delivery.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/send"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 hover:bg-red-800 text-white px-6 py-3.5 text-base font-semibold shadow-md shadow-red-700/20 transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <span>Compose & Send Letter</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
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

              <Link
                href="/developers"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-slate-800 px-6 py-3.5 text-base font-medium shadow-sm transition-all"
              >
                <span>Explore API Docs</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                  v1
                </span>
              </Link>
            </div>

            {/* Quick trust metrics */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-stone-200">
              <div>
                <p className="font-serif text-2xl font-bold text-slate-900">19,101</p>
                <p className="text-xs text-stone-500">PIN codes covered</p>
              </div>
              <div>
                <p className="font-serif text-2xl font-bold text-slate-900">2-4 Days</p>
                <p className="text-xs text-stone-500">Speed Post delivery</p>
              </div>
              <div>
                <p className="font-serif text-2xl font-bold text-slate-900">₹99</p>
                <p className="text-xs text-stone-500">Per tracked letter</p>
              </div>
            </div>
          </div>

          {/* Right Hero: Interactive API preview + Envelope Card */}
          <div className="lg:col-span-5 relative">
            <div className="rounded-2xl border border-stone-300 bg-slate-900 text-white shadow-2xl overflow-hidden">
              {/* Window header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  <span className="ml-2 font-mono text-xs text-slate-400">send_letter.py</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-xs text-slate-400">
                  <button
                    onClick={() => setActiveTab("python")}
                    className={`px-2 py-0.5 rounded ${activeTab === "python" ? "bg-slate-800 text-white" : "hover:text-white"}`}
                  >
                    Python
                  </button>
                  <button
                    onClick={() => setActiveTab("curl")}
                    className={`px-2 py-0.5 rounded ${activeTab === "curl" ? "bg-slate-800 text-white" : "hover:text-white"}`}
                  >
                    cURL
                  </button>
                  <button
                    onClick={() => setActiveTab("node")}
                    className={`px-2 py-0.5 rounded ${activeTab === "node" ? "bg-slate-800 text-white" : "hover:text-white"}`}
                  >
                    Node
                  </button>
                  <button
                    onClick={() => setActiveTab("agent")}
                    className={`px-2 py-0.5 rounded ${activeTab === "agent" ? "bg-red-900/60 text-red-200" : "hover:text-white"}`}
                  >
                    Agent
                  </button>
                </div>
              </div>

              {/* Code display */}
              <div className="p-4 sm:p-5 font-mono text-xs leading-6 overflow-x-auto text-slate-300">
                {activeTab === "python" && (
                  <pre>
                    <code>{`import requests

response = requests.post(
    "https://post.anagataitsolutions.in/api/v1/letters",
    headers={"Authorization": "Bearer ap_live_..."},
    json={
        "recipient": "Aditi Sharma",
        "phone": "9876543210",
        "address": {
            "street": "402, Shanti Nilayam",
            "locality": "Koramangala 4th Block",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560034"
        },
        "content": "Dear Aditi,\\n\\nYour official certificate...",
        "delivery_type": "SPEED_POST",
        "handwriting": False
    }
)
print(response.json()["tracking_url"])`}</code>
                  </pre>
                )}

                {activeTab === "curl" && (
                  <pre>
                    <code>{`curl -X POST https://post.anagataitsolutions.in/api/v1/letters \\
  -H "Authorization: Bearer ap_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipient": "Vikram Malhotra",
    "address": {
      "street": "14 High Court Chamber",
      "city": "New Delhi",
      "state": "Delhi",
      "pincode": "110003"
    },
    "content": "LEGAL NOTICE UNDER SEC 138...",
    "delivery_type": "REGISTERED_POST"
  }'`}</code>
                  </pre>
                )}

                {activeTab === "node" && (
                  <pre>
                    <code>{`const res = await fetch("https://post.anagataitsolutions.in/api/v1/letters", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ap_live_...",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    recipient: "Priya Nair",
    address: { street: "12 Marine Drive", city: "Mumbai", state: "MH", pincode: "400020" },
    content: "Welcome to AnagataPost physical mail!",
    handwriting: "CAVEAT"
  })
});`}</code>
                  </pre>
                )}

                {activeTab === "agent" && (
                  <pre>
                    <code>{`# AI Agent Prompt (OpenClaw / Claude / Gemini)
"Agent, draft an official demand letter to
Priya Nair at Mumbai 400020, and dispatch it
via AnagataPost Speed Post using the tool
send_physical_letter."`}</code>
                  </pre>
                )}
              </div>

              {/* Status bar */}
              <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  201 Created • Queued for Print
                </span>
                <span>Speed Post EMS Consignment</span>
              </div>
            </div>

            {/* Overlapping physical stamp accent */}
            <div className="absolute -bottom-6 -right-4 hidden sm:block bg-white p-3 rounded-xl border border-stone-200 shadow-xl rotate-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-14 bg-gradient-to-br from-amber-600 to-red-700 rounded p-1 text-white flex flex-col justify-between border border-amber-300/40">
                  <span className="text-[7px] font-bold tracking-widest">BHARAT</span>
                  <span className="text-center font-serif text-xs font-bold">₹50</span>
                  <span className="text-[6px] tracking-tight text-right">POSTAGE</span>
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-slate-900">India Post Compliant</p>
                  <p className="text-[11px] text-stone-500">100 GSM Bond • Speed Post</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Indian Postage Stamps Scrolling Showcase */}
      <section className="py-8 bg-stone-100/70 border-y border-stone-200 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 mb-3 flex items-center justify-between text-xs font-mono text-stone-500 uppercase tracking-widest">
          <span>Official Postal Series & Commemorative Stamps</span>
          <span className="hidden sm:inline">Speed Post • Registered Post • Certified Delivery</span>
        </div>
        <div className="flex gap-6 animate-stamp-scroll whitespace-nowrap py-2">
          {[...stamps, ...stamps].map((stamp, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-3 bg-white px-4 py-2.5 rounded-lg border border-stone-200 shadow-sm shrink-0 hover:scale-105 transition-transform"
            >
              <div
                className={`w-10 h-12 rounded bg-gradient-to-br ${stamp.color} text-white p-1 flex flex-col justify-between border border-white/30 shadow-inner`}
              >
                <span className="text-[6px] font-bold">INDIA</span>
                <span className="text-center font-serif text-[11px] font-bold">{stamp.faceValue}</span>
                <span className="text-[5px] text-right font-mono">POST</span>
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-900">{stamp.name}</p>
                <p className="text-[10px] text-stone-500">{stamp.origin}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live PIN Code & Indian Postal Circle Lookup Demo */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl border border-stone-200 p-8 md:p-12 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-red-700 bg-red-50 px-2.5 py-1 rounded">
                Postal Infrastructure
              </span>
              <h2 className="text-3xl font-serif font-bold text-slate-900">
                100% Indian PIN Code auto-resolution
              </h2>
              <p className="text-sm text-stone-600 leading-relaxed">
                Test our lightning-fast postal directory. Type any 6-digit Indian PIN code to instantly
                resolve the delivery circle, district, post office, and estimated Speed Post transit
                time.
              </p>

              <form onSubmit={handleCheckPin} className="flex gap-2 pt-2">
                <input
                  type="text"
                  maxLength={6}
                  value={testPin}
                  onChange={(e) => setTestPin(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Enter 6-digit PIN"
                  className="w-44 rounded-xl border border-stone-300 px-4 py-2.5 font-mono text-sm focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
                <button
                  type="submit"
                  disabled={isCheckingPin}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 text-sm font-medium transition-colors"
                >
                  {isCheckingPin ? "Resolving..." : "Verify PIN"}
                </button>
              </form>
            </div>

            {/* Result display */}
            <div className="lg:col-span-7 bg-[#FDFBF7] p-6 rounded-2xl border border-stone-200">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="font-mono text-xs font-semibold text-slate-900">
                    PIN CODE: {pinResult.pincode}
                  </span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Serviceable • Speed Post Active
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <p className="text-stone-400 font-mono">DELIVERY PO</p>
                  <p className="font-semibold text-slate-800 mt-1">{pinResult.postOffice}</p>
                </div>
                <div>
                  <p className="text-stone-400 font-mono">DISTRICT</p>
                  <p className="font-semibold text-slate-800 mt-1">{pinResult.district}</p>
                </div>
                <div>
                  <p className="text-stone-400 font-mono">STATE</p>
                  <p className="font-semibold text-slate-800 mt-1">{pinResult.state}</p>
                </div>
                <div>
                  <p className="text-stone-400 font-mono">EST. TRANSIT</p>
                  <p className="font-semibold text-emerald-700 mt-1">2-3 Business Days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features & Superpowers */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-red-700">
            Why AnagataPost
          </p>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
            Built for developers, lawyers, founders & AI agents
          </h2>
          <p className="text-stone-600 text-sm sm:text-base">
            Everything you need to automate physical paper outreach across India with enterprise
            reliability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm space-y-4 hover:border-red-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-mono font-bold">
              ✍️
            </div>
            <h3 className="font-serif text-xl font-bold text-slate-900">
              Realistic Handwriting Engine
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Don&#39;t look like corporate spam. Our cursive handwriting typography engine renders
              authentic organic penmanship on parchment paper for VIP notes that get read.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm space-y-4 hover:border-red-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-mono font-bold">
              💬
            </div>
            <h3 className="font-serif text-xl font-bold text-slate-900">
              Evolution API WhatsApp Alerts
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Integrated with Evolution API on your VPS. Whenever a letter is printed and handed to
              India Post, sender and recipient receive automated WhatsApp tracking alerts.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm space-y-4 hover:border-red-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-mono font-bold">
              ⚡
            </div>
            <h3 className="font-serif text-xl font-bold text-slate-900">
              n8n & AI Agent Native
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Seamlessly connect with your n8n instance at n8n.anagataitsolutions.in. Use our pre-built
              workflow template or drop `/skill.md` into Claude Code, Cursor, or OpenClaw.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Table in ₹ */}
      <section className="py-16 md:py-24 bg-stone-100/60 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <p className="text-xs font-mono font-semibold uppercase tracking-widest text-red-700">
              Transparent Indian Pricing
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
              No hidden fees. Pay per letter in ₹.
            </h2>
            <p className="text-sm text-stone-600">
              All prices include 100 GSM executive bond paper, laser printing, tamper-proof envelope,
              postage stamp, and tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Standard Post */}
            <div className="bg-white p-8 rounded-2xl border border-stone-200 flex flex-col justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-stone-500">
                  Standard Letter
                </p>
                <div className="mt-4 mb-6">
                  <span className="font-serif text-4xl font-bold text-slate-900">₹49</span>
                  <span className="text-xs text-stone-500"> / letter</span>
                </div>
                <ul className="space-y-3 text-xs text-stone-600 mb-8">
                  <li className="flex items-center gap-2">✓ Black & white laser print</li>
                  <li className="flex items-center gap-2">✓ 100 GSM Bond Paper</li>
                  <li className="flex items-center gap-2">✓ Standard Postal Envelope</li>
                  <li className="flex items-center gap-2">✓ Nationwide Delivery (4-7 days)</li>
                </ul>
              </div>
              <Link
                href="/send?type=STANDARD"
                className="w-full text-center py-2.5 rounded-xl border border-stone-300 font-medium text-xs text-slate-800 hover:bg-stone-50 transition-colors"
              >
                Send Standard Letter
              </Link>
            </div>

            {/* Speed Post - Highlighted */}
            <div className="bg-white p-8 rounded-2xl border-2 border-red-700 shadow-xl relative flex flex-col justify-between">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-red-700 text-white font-mono text-[10px] font-bold uppercase tracking-wider">
                Most Popular • Recommended
              </span>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-red-700 font-semibold">
                  Speed Post Tracked
                </p>
                <div className="mt-4 mb-6">
                  <span className="font-serif text-4xl font-bold text-slate-900">₹99</span>
                  <span className="text-xs text-stone-500"> / letter</span>
                </div>
                <ul className="space-y-3 text-xs text-stone-700 mb-8">
                  <li className="flex items-center gap-2">✓ <strong>2-4 Days Pan-India</strong> Delivery</li>
                  <li className="flex items-center gap-2">✓ <strong>India Post EMS Tracking</strong> (ED...IN)</li>
                  <li className="flex items-center gap-2">✓ 100 GSM Bond Paper + Window Envelope</li>
                  <li className="flex items-center gap-2">✓ WhatsApp Dispatch Alert via Evolution API</li>
                  <li className="flex items-center gap-2">✓ Full API & AI Agent Integration</li>
                </ul>
              </div>
              <Link
                href="/send?type=SPEED_POST"
                className="w-full text-center py-3 rounded-xl bg-red-700 text-white font-medium text-xs shadow-md shadow-red-700/20 hover:bg-red-800 transition-colors"
              >
                Send Speed Post Letter
              </Link>
            </div>

            {/* Registered Post / Legal */}
            <div className="bg-white p-8 rounded-2xl border border-stone-200 flex flex-col justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-stone-500">
                  Registered Post (Legal)
                </p>
                <div className="mt-4 mb-6">
                  <span className="font-serif text-4xl font-bold text-slate-900">₹129</span>
                  <span className="text-xs text-stone-500"> / letter</span>
                </div>
                <ul className="space-y-3 text-xs text-stone-600 mb-8">
                  <li className="flex items-center gap-2">✓ Official Registered Post (RL...IN)</li>
                  <li className="flex items-center gap-2">✓ Court-admissible Delivery Acknowledgement</li>
                  <li className="flex items-center gap-2">✓ Ideal for Sec 138 NI Act & Legal Notices</li>
                  <li className="flex items-center gap-2">✓ Letterhead & Signature support</li>
                </ul>
              </div>
              <Link
                href="/send?type=REGISTERED_POST"
                className="w-full text-center py-2.5 rounded-xl border border-stone-300 font-medium text-xs text-slate-800 hover:bg-stone-50 transition-colors"
              >
                Send Registered Legal Letter
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
          Ready to send your first physical letter?
        </h2>
        <p className="text-stone-600 text-sm max-w-xl mx-auto">
          Test it right now directly in your browser. No sign-up required for trial drafts. Or integrate
          via API into your product in 10 minutes.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <Link
            href="/send"
            className="px-6 py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-medium text-sm shadow-md shadow-red-700/20"
          >
            Open Letter Studio
          </Link>
          <Link
            href="/developers"
            className="px-6 py-3 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-slate-800 font-medium text-sm"
          >
            Read API Reference
          </Link>
        </div>
      </section>
    </div>
  );
}
