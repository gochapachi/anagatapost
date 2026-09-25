"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminFinancePage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFinanceData = async () => {
    try {
      const res = await fetch("/api/v1/invoices");
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  // Compute totals
  const totalGrossPaise = invoices.reduce((acc, i) => acc + (i.amountPaise || 0), 0);
  const totalBasePaise = invoices.reduce((acc, i) => acc + (i.subtotalPaise || 0), 0);
  const totalCgstPaise = invoices.reduce((acc, i) => acc + (i.cgstPaise || 0), 0);
  const totalSgstPaise = invoices.reduce((acc, i) => acc + (i.sgstPaise || 0), 0);
  const totalIgstPaise = invoices.reduce((acc, i) => acc + (i.igstPaise || 0), 0);

  const handleExportGSTR1 = () => {
    const headers = [
      "GSTIN/UIN of Recipient",
      "Receiver Name",
      "Invoice Number",
      "Invoice date",
      "Invoice Value",
      "Place Of Supply",
      "Reverse Charge",
      "Applicable % of Tax Rate",
      "Invoice Type",
      "E-Commerce GSTIN",
      "Rate",
      "Taxable Value",
      "Cess Amount",
    ];

    const rows = invoices.map((inv) => [
      inv.gstin || "URP", // URP = Unregistered Person
      "Anagata Customer",
      inv.invoiceNumber,
      new Date(inv.createdAt).toISOString().split("T")[0],
      inv.amountInr,
      "29-Karnataka",
      "N",
      "18",
      "Regular",
      "",
      "18",
      inv.subtotalInr,
      "0.00",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `GSTR1_AnagataPost_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-stone-500 mb-1">
            <Link href="/" className="hover:text-red-700">Home</Link>
            <span>/</span>
            <Link href="/admin" className="hover:text-red-700">Admin</Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Financial Ledger</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">
            GST & Financial Audit Ledger
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Reconcile prepaid Cashfree collections, compute 18% GST splits, and download statutory GSTR-1 filings.
          </p>
        </div>

        <button
          onClick={handleExportGSTR1}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-md shadow-red-700/20 transition-all"
        >
          <span>📁 Export GSTR-1 for CA (CSV)</span>
        </button>
      </div>

      {/* Admin Sub Navigation */}
      <div className="flex border-b border-stone-200 mb-8 space-x-8 text-sm">
        <Link
          href="/admin"
          className="pb-3 text-stone-500 hover:text-slate-900 font-medium"
        >
          🖨️ Print Fulfillment Queue
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
          className="pb-3 border-b-2 border-red-700 text-red-700 font-semibold"
        >
          🏛️ GST & Financial Reports
        </Link>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm">
          <span className="text-xs font-mono text-stone-500 uppercase tracking-wider block">
            Total Gross Collections
          </span>
          <div className="text-2xl font-serif font-bold text-slate-900 mt-1 font-mono">
            ₹{(totalGrossPaise / 100).toFixed(2)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            All Cashfree PG transactions
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm">
          <span className="text-xs font-mono text-stone-500 uppercase tracking-wider block">
            Taxable Base Amount
          </span>
          <div className="text-2xl font-serif font-bold text-slate-900 mt-1 font-mono">
            ₹{(totalBasePaise / 100).toFixed(2)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Pre-tax net service revenue
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm">
          <span className="text-xs font-mono text-stone-500 uppercase tracking-wider block">
            CGST Collected (9%)
          </span>
          <div className="text-2xl font-serif font-bold text-amber-700 mt-1 font-mono">
            ₹{(totalCgstPaise / 100).toFixed(2)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Central GST Pool
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm">
          <span className="text-xs font-mono text-stone-500 uppercase tracking-wider block">
            SGST Collected (9%)
          </span>
          <div className="text-2xl font-serif font-bold text-red-700 mt-1 font-mono">
            ₹{(totalSgstPaise / 100).toFixed(2)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Karnataka State GST Pool
          </div>
        </div>
      </div>

      {/* Tax Invoices Audit Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <h2 className="font-serif font-bold text-base text-slate-900">
            Platform Invoices & Tax Ledger
          </h2>
          <span className="text-xs font-mono text-stone-500">
            HSN 996812 • Postal & Courier Mail
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-stone-400">
            Loading ledger...
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500">
            No invoices processed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-mono uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-6">Invoice Number</th>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Customer GSTIN</th>
                  <th className="py-3 px-6">Taxable (₹)</th>
                  <th className="py-3 px-6">CGST (9%)</th>
                  <th className="py-3 px-6">SGST (9%)</th>
                  <th className="py-3 px-6">Total Gross (₹)</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-red-700">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-4 px-6 text-stone-600 font-mono">
                      {new Date(inv.createdAt).toISOString().split("T")[0]}
                    </td>
                    <td className="py-4 px-6 font-mono text-stone-700">
                      {inv.gstin || "URP (Unregistered)"}
                    </td>
                    <td className="py-4 px-6 font-mono">₹{inv.subtotalInr}</td>
                    <td className="py-4 px-6 font-mono text-stone-600">₹{inv.cgstInr}</td>
                    <td className="py-4 px-6 font-mono text-stone-600">₹{inv.sgstInr}</td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      ₹{inv.amountInr}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
