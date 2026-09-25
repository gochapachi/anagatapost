"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Role } from "@/lib/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [creditAmount, setCreditAmount] = useState<number>(500);
  const [adjusting, setAdjusting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/v1/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setAlertMsg({ type: "success", text: `Updated user role to ${newRole}` });
        fetchUsers();
      }
    } catch (err: any) {
      setAlertMsg({ type: "error", text: err.message });
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setAdjusting(true);
    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          balanceAdjustmentInr: creditAmount,
        }),
      });
      if (res.ok) {
        setAlertMsg({
          type: "success",
          text: `Successfully adjusted balance for ${selectedUser.name} by ₹${creditAmount}`,
        });
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (err: any) {
      setAlertMsg({ type: "error", text: err.message });
    } finally {
      setAdjusting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.company?.toLowerCase().includes(q)
    );
  });

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
            <span className="text-slate-900 font-semibold">Users</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">
            User & Wallet Management
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Manage enterprise accounts, assign role permissions, and grant prepaid postage credits.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-red-600"
          />
        </div>
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
          className="pb-3 border-b-2 border-red-700 text-red-700 font-semibold"
        >
          👥 User & Wallet Management ({users.length})
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
          className={`mb-6 p-4 rounded-xl text-xs font-mono flex items-center justify-between ${
            alertMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="text-stone-400 hover:text-stone-700">
            ✕
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-stone-400">
            Loading user registry...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-mono uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-6">User</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6">Entity / GSTIN</th>
                  <th className="py-3 px-6">Dispatches</th>
                  <th className="py-3 px-6">Wallet Balance</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900">{u.name}</div>
                      <div className="text-stone-500 font-mono text-[11px]">{u.email}</div>
                      {u.phone && <div className="text-stone-400 font-mono text-[10px]">{u.phone}</div>}
                    </td>

                    <td className="py-4 px-6">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                        className={`text-xs font-mono font-semibold rounded-lg px-2.5 py-1 border transition-colors ${
                          u.role === "ADMIN"
                            ? "bg-red-50 text-red-800 border-red-200"
                            : u.role === "PRINT_PARTNER"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-stone-100 text-stone-700 border-stone-200"
                        }`}
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="PRINT_PARTNER">PRINT_PARTNER</option>
                      </select>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-800">{u.company || "Individual"}</div>
                      {u.gstin && (
                        <div className="text-red-700 font-mono text-[10px] font-semibold">
                          GSTIN: {u.gstin}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-6 font-mono font-semibold text-slate-800">
                      {u.totalLettersSent} Letters
                    </td>

                    <td className="py-4 px-6 font-mono font-bold text-slate-900">
                      ₹{u.balanceInr}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedUser(u)}
                        className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-slate-800 text-xs font-semibold"
                      >
                        Adjust Credits
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Balance Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-800 to-red-950 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg">Adjust User Wallet</h3>
                <p className="text-xs text-red-200">{selectedUser.name}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustBalance} className="p-6 space-y-4">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 font-mono text-xs flex justify-between">
                <span className="text-stone-600">Current Balance:</span>
                <span className="font-bold text-slate-900">₹{selectedUser.balanceInr}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Credit / Debit Amount (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    step={10}
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 text-sm font-bold font-mono rounded-lg border border-stone-300"
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  Enter a positive number to add credits (e.g. +500) or negative to deduct.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-xs font-semibold shadow-sm"
                >
                  {adjusting ? "Updating..." : "Confirm Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
