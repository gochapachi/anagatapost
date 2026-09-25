"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/v1/admin/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExportCSV = () => {
    if (!analytics) return;
    const rows = [
      ["Metric", "Value"],
      ["Total Dispatches", analytics.kpis.totalDispatches],
      ["Total Revenue (INR)", analytics.kpis.totalRevenueInr],
      ["Speed Post Delivery SLA", `${analytics.kpis.slaPercent}%`],
      ["Covered Postal Circles", analytics.kpis.coveredPostalZones],
      ["Registered Users", analytics.kpis.totalRegisteredUsers],
      [],
      ["State / Circle", "Letters Dispatched", "Share %"],
      ...analytics.stateDistribution.map((s: any) => [s.state, s.count, `${s.percentage}%`]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `anagatapost_analytics_report_${Date.now()}.csv`);
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
            <span className="text-slate-900 font-semibold">Analytics & Reports</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">
            Executive Analytics & Postal Heatmap
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Real-time delivery performance, Indian postal circle volume distribution, and revenue trends.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-slate-800 text-xs font-semibold shadow-sm transition-all"
        >
          <span>📊 Export Logistics Report (CSV)</span>
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
          className="pb-3 border-b-2 border-red-700 text-red-700 font-semibold"
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

      {loading || !analytics ? (
        <div className="p-12 text-center text-xs font-mono text-stone-400">
          Calculating postal logistics analytics...
        </div>
      ) : (
        <>
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
            <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm">
              <span className="text-xs font-mono text-stone-500 uppercase tracking-wider block">
                Total Physical Mail
              </span>
              <div className="text-2xl font-serif font-bold text-slate-900 mt-1">
                {analytics.kpis.totalDispatches} Letters
              </div>
              <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>{analytics.kpis.totalInTransit} in transit via Speed Post</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm">
              <span className="text-xs font-mono text-stone-500 uppercase tracking-wider block">
                Speed Post Delivery SLA
              </span>
              <div className="text-2xl font-serif font-bold text-emerald-600 mt-1">
                {analytics.kpis.slaPercent}%
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                Avg. transit time: 2.4 days across metros
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm">
              <span className="text-xs font-mono text-stone-500 uppercase tracking-wider block">
                Gross Postal Revenue
              </span>
              <div className="text-2xl font-serif font-bold text-red-700 mt-1 font-mono">
                ₹{analytics.kpis.totalRevenueInr}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                Inclusive of 18% GST (HSN 996812)
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm">
              <span className="text-xs font-mono text-stone-500 uppercase tracking-wider block">
                Indian Postal Circles Active
              </span>
              <div className="text-2xl font-serif font-bold text-slate-900 mt-1 font-mono">
                {analytics.kpis.coveredPostalZones} / 23
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                All 28 States & 8 UTs reached
              </div>
            </div>
          </div>

          {/* Grid: State Distribution Heatmap + Monthly Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Geographic Distribution */}
            <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-serif font-bold text-base text-slate-900">
                    State & Circle Volume Distribution
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Dispatch density by Indian postal circles
                  </p>
                </div>
                <span className="text-xs font-mono text-red-700 font-semibold">
                  100% Pan-India
                </span>
              </div>

              <div className="space-y-4">
                {analytics.stateDistribution.map((item: any) => (
                  <div key={item.state} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">{item.state}</span>
                      <span className="font-mono text-stone-500">
                        {item.count} letters ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-red-700 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(item.percentage, 10)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Trend Cards */}
            <div className="bg-white rounded-2xl border border-stone-200/90 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-serif font-bold text-base text-slate-900">
                      Monthly Dispatch Velocity
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Month-over-month growth in physical dispatches
                    </p>
                  </div>
                  <span className="text-xs font-mono text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    +42% MoM Growth
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {analytics.monthlyTrends.map((trend: any) => (
                    <div
                      key={trend.month}
                      className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{trend.month}</span>
                        <span className="text-stone-500 text-[11px]">
                          {trend.dispatches} Letters Sent
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-red-700">₹{trend.revenueInr}</span>
                        <span className="text-[10px] text-stone-400 block">Gross Revenue</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span>Infrastructure: India Post Speed Post API</span>
                <span className="text-emerald-700 font-semibold">● 99.4% On-Time SLA</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
