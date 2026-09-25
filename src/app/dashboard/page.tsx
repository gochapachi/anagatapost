"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Letter, LetterStatus } from "@/lib/types";
import UpiPaymentModal from "@/components/UpiPaymentModal";


export default function DashboardPage() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [balanceInr, setBalanceInr] = useState("500.00");
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState(500);
  const [isTopupLoading, setIsTopupLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [lettersRes, walletRes] = await Promise.all([
        fetch("/api/v1/letters"),
        fetch("/api/v1/wallet"),
      ]);

      if (lettersRes.ok) {
        const lData = await lettersRes.json();
        setLetters(lData.letters || []);
      }
      if (walletRes.ok) {
        const wData = await walletRes.json();
        setBalanceInr(wData.balance_inr || "500.00");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleTopup = async () => {
    setIsTopupLoading(true);
    try {
      const res = await fetch("/api/v1/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_inr: topupAmount }),
      });
      if (res.ok) {
        const data = await res.json();
        setBalanceInr(data.balance_inr);
        setShowTopupModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTopupLoading(false);
    }
  };

  const handleSendDraft = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/letters/${id}/send`, { method: "POST" });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter letters
  const filteredLetters = letters.filter((ltr) => {
    const matchesStatus = statusFilter === "ALL" || ltr.status === statusFilter;
    const matchesSearch =
      ltr.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ltr.address.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ltr.consignmentNumber && ltr.consignmentNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: LetterStatus) => {
    switch (status) {
      case "DELIVERED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Delivered</span>;
      case "IN_TRANSIT":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">In Transit (Speed Post)</span>;
      case "PRINTED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Printed & Stamped</span>;
      case "QUEUED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">Queued for Print</span>;
      case "DRAFT":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">Draft</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header & Wallet Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Physical Mail Dashboard</h1>
          <p className="text-sm text-stone-600 mt-1">
            Track letters, inspect India Post Speed Post consignments, and manage balance.
          </p>
        </div>

        {/* Balance Card */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <div>
            <p className="text-[11px] font-mono uppercase text-stone-500">Available Credits</p>
            <p className="text-2xl font-serif font-bold text-slate-900">₹{balanceInr}</p>
          </div>
          <button
            onClick={() => setShowTopupModal(true)}
            className="px-3.5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            + Top Up
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-xs font-mono text-stone-500 uppercase">Total Letters</p>
          <p className="text-2xl font-serif font-bold text-slate-900 mt-1">{letters.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-xs font-mono text-stone-500 uppercase">In Transit</p>
          <p className="text-2xl font-serif font-bold text-blue-700 mt-1">
            {letters.filter((l) => l.status === "IN_TRANSIT").length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-xs font-mono text-stone-500 uppercase">Delivered</p>
          <p className="text-2xl font-serif font-bold text-emerald-700 mt-1">
            {letters.filter((l) => l.status === "DELIVERED").length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-xs font-mono text-stone-500 uppercase">Queued / Print</p>
          <p className="text-2xl font-serif font-bold text-amber-700 mt-1">
            {letters.filter((l) => ["QUEUED", "PRINTED"].includes(l.status)).length}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex flex-wrap gap-1 text-xs">
          {["ALL", "IN_TRANSIT", "DELIVERED", "QUEUED", "DRAFT"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === st
                  ? "bg-slate-900 text-white"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipient, city or tracking #..."
            className="w-full rounded-xl border border-stone-300 px-3 py-1.5 text-xs focus:border-red-700 focus:outline-none"
          />
        </div>
      </div>

      {/* Letters Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-stone-500 font-mono">Loading correspondence archive...</div>
        ) : filteredLetters.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-base font-serif text-slate-800">No physical letters found.</p>
            <p className="text-xs text-stone-500">Send your first real letter to any Indian PIN code via Speed Post.</p>
            <Link
              href="/send"
              className="inline-block mt-2 px-4 py-2 rounded-xl bg-red-700 text-white text-xs font-semibold"
            >
              Send Letter
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-mono uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Recipient & Destination</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Consignment / Tracking</th>
                  <th className="px-6 py-3.5">Delivery Service</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredLetters.map((ltr) => (
                  <tr key={ltr.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{ltr.recipientName}</p>
                      <p className="text-[11px] text-stone-500">
                        {ltr.address.city}, {ltr.address.state} —{" "}
                        <span className="font-mono text-slate-700">{ltr.address.pincode}</span>
                      </p>
                    </td>

                    <td className="px-6 py-4">{getStatusBadge(ltr.status)}</td>

                    <td className="px-6 py-4 font-mono text-[11px]">
                      {ltr.consignmentNumber ? (
                        <div className="flex items-center gap-1.5 text-slate-800">
                          <span>📦</span>
                          <span className="font-semibold bg-stone-100 px-1.5 py-0.5 rounded">
                            {ltr.consignmentNumber}
                          </span>
                        </div>
                      ) : (
                        <span className="text-stone-400">Assigned upon dispatch</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-semibold">
                        {ltr.deliveryType.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-stone-500 font-mono text-[11px]">
                      {new Date(ltr.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="px-6 py-4 text-right space-x-2">
                      {ltr.status === "DRAFT" ? (
                        <button
                          onClick={() => handleSendDraft(ltr.id)}
                          className="px-2.5 py-1 rounded bg-red-700 hover:bg-red-800 text-white font-medium text-[11px]"
                        >
                          Send Draft
                        </button>
                      ) : (
                        <Link
                          href={`/track/${ltr.id}`}
                          className="px-2.5 py-1 rounded border border-stone-300 hover:bg-stone-100 text-slate-800 font-medium text-[11px]"
                        >
                          Track Post →
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dynamic UPI QR Code Topup Modal */}
      <UpiPaymentModal
        isOpen={showTopupModal}
        onClose={() => setShowTopupModal(false)}
        onSuccess={(newBal) => setBalanceInr(newBal)}
        defaultAmount={500}
      />
    </div>
  );
}

