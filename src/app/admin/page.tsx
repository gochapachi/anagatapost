"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Letter } from "@/lib/types";

export default function AdminFulfillmentPage() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [customConsignment, setCustomConsignment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchLetters = async () => {
    try {
      const res = await fetch("/api/v1/letters");
      if (res.ok) {
        const data = await res.json();
        setLetters(data.letters || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLetters();
  }, []);

  const handleUpdateStatus = async (
    letterId: string,
    status: "PRINTED" | "IN_TRANSIT" | "DELIVERED",
    consignment?: string
  ) => {
    setActionLoading(true);
    setAlertMsg(null);
    try {
      const res = await fetch("/api/v1/admin/fulfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          letterId,
          status,
          consignmentNumber: consignment || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        let msg = `Letter ${letterId} updated to ${status}.`;
        if (data.whatsapp?.simulated) {
          msg += ` WhatsApp dispatch alert simulated for recipient mobile.`;
        } else if (data.whatsapp?.success) {
          msg += ` WhatsApp alert sent via Evolution API (evo.anagataitsolutions.in)!`;
        }
        setAlertMsg({ type: "success", text: msg });
        fetchLetters();
      } else {
        setAlertMsg({ type: "error", text: data.error || "Failed to update" });
      }
    } catch (err: any) {
      setAlertMsg({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-stone-500 mb-1">
            <Link href="/" className="hover:text-red-700">
              Home
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Operations</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">
            Print Partner & Fulfillment Hub
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Batch print queue, India Post consignment assignment, and WhatsApp dispatch automation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/analytics"
            className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <span>📈 View Analytics</span>
          </Link>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-slate-800 text-xs font-semibold shadow-sm flex items-center gap-2"
          >
            <span>🖨️ Print Batch Sheets</span>
          </button>
        </div>
      </div>

      {/* Admin Sub Navigation */}
      <div className="flex border-b border-stone-200 mb-8 space-x-8 text-sm">
        <Link
          href="/admin"
          className="pb-3 border-b-2 border-red-700 text-red-700 font-semibold"
        >
          🖨️ Print Fulfillment Queue ({letters.length})
        </Link>
        <Link
          href="/admin/analytics"
          className="pb-3 text-stone-500 hover:text-slate-900 font-medium"
        >
          📈 Analytics & Heatmaps
        </Link>
        <Link
          href="/admin/users"
          className="pb-3 text-stone-500 hover:text-slate-900 font-medium"
        >
          👥 User & Wallet Management
        </Link>
        <Link
          href="/admin/finance"
          className="pb-3 text-stone-500 hover:text-slate-900 font-medium"
        >
          🏛️ GST & Financial Reports
        </Link>
      </div>

      {alertMsg && (
        <div
          className={`mb-6 p-4 rounded-xl text-xs font-medium flex items-center justify-between ${
            alertMsg.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="font-bold">
            ×
          </button>
        </div>
      )}

      {/* Main Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Queue List */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <h3 className="font-serif font-bold text-sm text-slate-900">
              Live Fulfillment Queue ({letters.length})
            </h3>
            <span className="text-[11px] font-mono text-stone-500">Auto-synced</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs font-mono text-stone-500">Loading queue...</div>
          ) : letters.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500">No active letters in queue.</div>
          ) : (
            <div className="divide-y divide-stone-100 max-h-[650px] overflow-y-auto">
              {letters.map((ltr) => (
                <div
                  key={ltr.id}
                  onClick={() => {
                    setSelectedLetter(ltr);
                    setCustomConsignment(ltr.consignmentNumber || "");
                  }}
                  className={`p-4 transition-all cursor-pointer hover:bg-stone-50 ${
                    selectedLetter?.id === ltr.id ? "bg-red-50/50 border-l-4 border-red-700" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-xs">{ltr.recipientName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 text-stone-700">
                          {ltr.address.pincode}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                            ltr.status === "QUEUED"
                              ? "bg-purple-100 text-purple-800"
                              : ltr.status === "PRINTED"
                              ? "bg-amber-100 text-amber-800"
                              : ltr.status === "IN_TRANSIT"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {ltr.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-1">
                        {ltr.address.street}, {ltr.address.city}, {ltr.address.state}
                      </p>
                      {ltr.consignmentNumber && (
                        <p className="text-[11px] font-mono text-slate-800 mt-1">
                          EMS: <span className="font-bold">{ltr.consignmentNumber}</span>
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-stone-400">
                        {new Date(ltr.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Inspection & Action Console */}
        <div className="lg:col-span-5 sticky top-24 space-y-6">
          {selectedLetter ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-red-700 font-bold">
                    Letter Inspection
                  </span>
                  <h3 className="font-serif font-bold text-base text-slate-900">
                    {selectedLetter.recipientName}
                  </h3>
                </div>
                <span className="text-xs font-mono text-stone-500">ID: {selectedLetter.id}</span>
              </div>

              {/* Destination Box */}
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs space-y-1">
                <p className="text-stone-400 font-mono text-[10px]">DISPATCH DESTINATION:</p>
                <p className="font-semibold text-slate-900">{selectedLetter.recipientName}</p>
                <p className="text-stone-700">{selectedLetter.address.street}</p>
                <p className="text-slate-900 font-medium">
                  {selectedLetter.address.city}, {selectedLetter.address.state} —{" "}
                  <span className="font-mono font-bold text-red-700">{selectedLetter.address.pincode}</span>
                </p>
                {selectedLetter.recipientPhone && (
                  <p className="font-mono text-stone-600 text-[11px] pt-1">
                    📱 WhatsApp: +91 {selectedLetter.recipientPhone}
                  </p>
                )}
              </div>

              {/* Content preview */}
              <div>
                <p className="text-[11px] font-semibold text-stone-600 mb-1">Letter Content Excerpt:</p>
                <div className="bg-[#FAF8F5] p-3 rounded-lg border border-stone-200 text-xs font-mono text-stone-700 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {selectedLetter.content}
                </div>
              </div>

              {/* Consignment Number Form */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  India Post Speed Post Tracking (Consignment No.)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customConsignment}
                    onChange={(e) => setCustomConsignment(e.target.value)}
                    placeholder="e.g. ED839201948IN"
                    className="flex-1 rounded-xl border border-stone-300 px-3 py-2 text-xs font-mono uppercase focus:border-red-700 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      const rand = Math.floor(100000000 + Math.random() * 900000000);
                      setCustomConsignment(`ED${rand}IN`);
                    }}
                    className="px-2.5 py-1 text-[11px] rounded-lg border border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono"
                  >
                    Auto Generate
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <Link
                  href={`/letters/${selectedLetter.id}/print`}
                  target="_blank"
                  className="w-full py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-slate-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>🖨️ Open Full A4 Letter & Envelope Sheet</span>
                  <span className="text-[10px] text-stone-400">↗</span>
                </Link>

                <div className="grid grid-cols-2 gap-2">

                  <button
                    disabled={actionLoading || selectedLetter.status === "PRINTED"}
                    onClick={() => handleUpdateStatus(selectedLetter.id, "PRINTED")}
                    className="py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs transition-colors"
                  >
                    Mark as Printed
                  </button>

                  <button
                    disabled={actionLoading || selectedLetter.status === "DELIVERED"}
                    onClick={() => handleUpdateStatus(selectedLetter.id, "DELIVERED")}
                    className="py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold text-xs transition-colors"
                  >
                    Mark as Delivered
                  </button>
                </div>

                <button
                  disabled={actionLoading}
                  onClick={() =>
                    handleUpdateStatus(selectedLetter.id, "IN_TRANSIT", customConsignment)
                  }
                  className="w-full py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>🚀 Dispatch via Speed Post & Send WhatsApp Alert</span>
                </button>
              </div>

              <div className="text-[10px] font-mono text-stone-500 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                Connected to Evolution API (evo.anagataitsolutions.in). WhatsApp dispatch trigger will
                fire automatically.
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-stone-500 shadow-sm">
              <p className="text-3xl mb-2">📦</p>
              <p className="font-serif text-sm font-semibold text-slate-800">No Letter Selected</p>
              <p className="text-xs text-stone-400 mt-1">
                Click any letter from the queue on the left to print or dispatch.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
