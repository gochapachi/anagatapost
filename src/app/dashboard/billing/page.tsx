"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CashfreeModal from "@/components/CashfreeModal";

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [balanceInr, setBalanceInr] = useState("500.00");
  const [loading, setLoading] = useState(true);
  const [isCashfreeOpen, setIsCashfreeOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const fetchBillingData = async () => {
    try {
      const [walletRes, invoicesRes] = await Promise.all([
        fetch("/api/v1/wallet"),
        fetch("/api/v1/invoices"),
      ]);

      if (walletRes.ok) {
        const wData = await walletRes.json();
        setBalanceInr(wData.balance_inr || "500.00");
      }
      if (invoicesRes.ok) {
        const iData = await invoicesRes.json();
        setInvoices(iData.invoices || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-stone-500 mb-1">
            <Link href="/" className="hover:text-red-700">Home</Link>
            <span>/</span>
            <Link href="/dashboard" className="hover:text-red-700">Dashboard</Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Billing & GST</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">
            Cashfree Wallet & GST Invoices
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Manage prepaid postage credits and download 18% GST tax invoices with input tax credit.
          </p>
        </div>

        <button
          onClick={() => setIsCashfreeOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-md shadow-red-700/20 transition-all"
        >
          <span>💳 Recharge via Cashfree</span>
        </button>
      </div>

      {/* Sub Navigation Bar */}
      <div className="flex border-b border-stone-200 mb-8 space-x-8 text-sm">
        <Link
          href="/dashboard"
          className="pb-3 text-stone-500 hover:text-slate-900 font-medium"
        >
          📦 Letters Archive
        </Link>
        <Link
          href="/dashboard/addresses"
          className="pb-3 text-stone-500 hover:text-slate-900 font-medium"
        >
          📇 Address Book
        </Link>
        <Link
          href="/dashboard/templates"
          className="pb-3 text-stone-500 hover:text-slate-900 font-medium"
        >
          📜 Letter Templates
        </Link>
        <Link
          href="/dashboard/billing"
          className="pb-3 border-b-2 border-red-700 text-red-700 font-semibold"
        >
          💳 Invoices & Wallet ({invoices.length})
        </Link>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-stone-500 block mb-1">
              Active Wallet Balance
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-slate-900">
                ₹{balanceInr}
              </span>
              <span className="text-xs text-emerald-600 font-semibold font-mono">
                Prepaid
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-2">
              Autodeducted at ₹99/letter for Speed Post laser printing & dispatch.
            </p>
          </div>
          <div className="pt-4 mt-2">
            <button
              onClick={() => setIsCashfreeOpen(true)}
              className="w-full py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold"
            >
              + Add Funds
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-sm">
          <span className="text-xs font-mono uppercase tracking-wider text-stone-500 block mb-1">
            Indian GST Compliance
          </span>
          <div className="text-lg font-bold font-mono text-slate-900">
            HSN / SAC: 996812
          </div>
          <p className="text-xs text-stone-600 mt-1 leading-relaxed">
            Postal & Courier Delivery Services. 18% GST (CGST 9% + SGST 9% or IGST 18%) fully deductible under B2B Input Tax Credit rules.
          </p>
          <div className="mt-3 inline-block px-2.5 py-1 rounded bg-stone-100 font-mono text-[11px] text-stone-700">
            Supplier GSTIN: 29AAAAA0000A1Z5
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-sm">
          <span className="text-xs font-mono uppercase tracking-wider text-stone-500 block mb-1">
            Cashfree Payment Gateway
          </span>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-semibold text-slate-900">
              UPI, Cards, NetBanking Active
            </span>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed">
            Accepts GPay, PhonePe, Paytm, BHIM, RuPay, Visa, and major Indian corporate banking accounts.
          </p>
          <div className="mt-3 text-[11px] font-mono text-stone-400">
            Webhook: /api/v1/payments/cashfree/webhook
          </div>
        </div>
      </div>

      {/* Tax Invoices Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <h2 className="font-serif font-bold text-base text-slate-900">
            Tax Invoices & GST Receipts
          </h2>
          <span className="text-xs font-mono text-stone-500">
            {invoices.length} Invoices Found
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-stone-400">
            Loading GST invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500">
            No tax invoices generated yet. Recharge your wallet via Cashfree to generate your first invoice!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-mono uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-6">Invoice #</th>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Base Amount</th>
                  <th className="py-3 px-6">CGST (9%)</th>
                  <th className="py-3 px-6">SGST (9%)</th>
                  <th className="py-3 px-6">Total (₹)</th>
                  <th className="py-3 px-6">Payment Ref</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-red-700">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-4 px-6 text-stone-600 font-mono">
                      {new Date(inv.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-6 font-mono">₹{inv.subtotalInr}</td>
                    <td className="py-4 px-6 font-mono text-stone-600">₹{inv.cgstInr}</td>
                    <td className="py-4 px-6 font-mono text-stone-600">₹{inv.sgstInr}</td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      ₹{inv.amountInr}
                    </td>
                    <td className="py-4 px-6 font-mono text-stone-500 text-[11px]">
                      {inv.paymentRef || "Cashfree PG"}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-red-50 hover:text-red-700 text-slate-800 text-xs font-semibold transition-colors"
                      >
                        📄 View Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Modal for View / Print */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-stone-900 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase bg-red-700 px-2 py-0.5 rounded text-white">
                  Original for Recipient
                </span>
                <h3 className="font-serif font-bold text-lg mt-1">
                  Tax Invoice {selectedInvoice.invoiceNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                ✕
              </button>
            </div>

            {/* Printable Tax Invoice Sheet */}
            <div className="p-8 overflow-y-auto flex-1 font-sans text-xs text-slate-800 space-y-6">
              {/* Header company info */}
              <div className="flex justify-between items-start border-b border-stone-200 pb-6">
                <div>
                  <h2 className="text-xl font-serif font-bold text-red-700">AnagataPost</h2>
                  <p className="text-stone-500 font-mono text-[11px]">
                    Anagata Technologies Private Limited
                  </p>
                  <p className="text-stone-500">Tech Hub, Inner Ring Road, Koramangala</p>
                  <p className="text-stone-500">Bengaluru, Karnataka - 560071</p>
                  <p className="font-mono text-stone-700 font-semibold mt-1">
                    GSTIN: 29AAAAA0000A1Z5
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-slate-900">TAX INVOICE</div>
                  <div className="font-mono font-bold text-red-700">
                    {selectedInvoice.invoiceNumber}
                  </div>
                  <div className="font-mono text-stone-500 mt-1">
                    Date: {new Date(selectedInvoice.createdAt).toLocaleDateString("en-IN")}
                  </div>
                  <div className="font-mono text-stone-500">
                    Payment: {selectedInvoice.paymentRef}
                  </div>
                </div>
              </div>

              {/* Table of items */}
              <table className="w-full text-left border border-stone-200 rounded-lg overflow-hidden">
                <thead className="bg-stone-50 text-[11px] font-mono text-stone-700 uppercase">
                  <tr>
                    <th className="p-3">Description of Services</th>
                    <th className="p-3">HSN / SAC</th>
                    <th className="p-3 text-right">Taxable Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  <tr>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">
                        Prepaid Physical Mail Credits & Speed Post Postage Handling
                      </div>
                      <div className="text-stone-500 text-[11px]">
                        Cashfree PG Transaction Ref: {selectedInvoice.paymentRef}
                      </div>
                    </td>
                    <td className="p-3 font-mono">996812</td>
                    <td className="p-3 text-right font-mono font-semibold">
                      ₹{selectedInvoice.subtotalInr}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Tax totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Taxable Amount:</span>
                    <span>₹{selectedInvoice.subtotalInr}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>CGST @ 9%:</span>
                    <span>₹{selectedInvoice.cgstInr}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>SGST @ 9%:</span>
                    <span>₹{selectedInvoice.sgstInr}</span>
                  </div>
                  <div className="border-t border-stone-300 pt-2 flex justify-between font-bold text-sm text-slate-900">
                    <span>Total Amount:</span>
                    <span className="text-red-700">₹{selectedInvoice.amountInr}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-stone-200 pt-4 text-[11px] text-stone-500">
                <p>
                  This is a computer-generated GST tax invoice issued in accordance with the provisions of Section 31 of the CGST Act, 2017. No physical signature required.
                </p>
              </div>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-700 font-semibold">
                ✓ Payment Status: PAID (Cashfree PG)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-sm"
                >
                  🖨️ Print Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cashfree Modal */}
      <CashfreeModal
        isOpen={isCashfreeOpen}
        onClose={() => setIsCashfreeOpen(false)}
        onSuccess={() => {
          fetchBillingData();
        }}
        defaultAmount={500}
      />
    </div>
  );
}
