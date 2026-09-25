"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AddressBookEntry } from "@/lib/types";

export default function AddressBookPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<AddressBookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pincodeLookup, setPincodeLookup] = useState("");
  const [pinResolved, setPinResolved] = useState<{ city?: string; state?: string } | null>(null);

  const [form, setForm] = useState({
    label: "Corporate Office",
    recipientName: "",
    recipientPhone: "",
    recipientStreet: "",
    recipientLocality: "",
    recipientCity: "",
    recipientDistrict: "",
    recipientState: "",
    recipientPincode: "",
    isDefault: false,
  });

  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/v1/address-book");
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.entries || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handlePincodeChange = async (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 6);
    setPincodeLookup(clean);
    setForm((f) => ({ ...f, recipientPincode: clean }));

    if (clean.length === 6) {
      try {
        const res = await fetch(`/api/v1/pincode?pincode=${clean}`);
        if (res.ok) {
          const data = await res.json();
          if (data.found) {
            setPinResolved({ city: data.city, state: data.state });
            setForm((f) => ({
              ...f,
              recipientCity: data.city || f.recipientCity,
              recipientDistrict: data.district || f.recipientDistrict,
              recipientState: data.state || f.recipientState,
            }));
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/address-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowAddModal(false);
        setForm({
          label: "Corporate Office",
          recipientName: "",
          recipientPhone: "",
          recipientStreet: "",
          recipientLocality: "",
          recipientCity: "",
          recipientDistrict: "",
          recipientState: "",
          recipientPincode: "",
          isDefault: false,
        });
        fetchAddresses();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this saved contact?")) return;
    try {
      const res = await fetch(`/api/v1/address-book?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchAddresses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendToContact = (entry: AddressBookEntry) => {
    const params = new URLSearchParams({
      recipient: entry.recipientName,
      phone: entry.recipientPhone || "",
      street: entry.recipientStreet,
      locality: entry.recipientLocality || "",
      city: entry.recipientCity,
      state: entry.recipientState,
      pincode: entry.recipientPincode,
    });
    router.push(`/send?${params.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-stone-500 mb-1">
            <Link href="/" className="hover:text-red-700">Home</Link>
            <span>/</span>
            <Link href="/dashboard" className="hover:text-red-700">Dashboard</Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Address Book</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">
            Recipient Address Book
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Store verified Indian addresses for rapid, 1-click physical mail dispatch.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <span>+ Add New Contact</span>
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
          className="pb-3 border-b-2 border-red-700 text-red-700 font-semibold"
        >
          📇 Address Book ({addresses.length})
        </Link>
        <Link
          href="/dashboard/templates"
          className="pb-3 text-stone-500 hover:text-slate-900 font-medium"
        >
          📜 Letter Templates
        </Link>
        <Link
          href="/dashboard/billing"
          className="pb-3 text-stone-500 hover:text-slate-900 font-medium"
        >
          💳 Invoices & Wallet
        </Link>
      </div>

      {/* Contact Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-stone-400 font-mono text-xs">
          Loading verified address directory...
        </div>
      ) : addresses.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-stone-200 text-center">
          <span className="text-3xl block mb-2">📇</span>
          <h3 className="font-serif font-bold text-slate-900 text-base">No saved addresses yet</h3>
          <p className="text-xs text-stone-500 mt-1 mb-4">
            Add frequent clients, law courts, banks, or vendor addresses for quick dispatch.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-lg bg-red-700 text-white text-xs font-semibold"
          >
            Add First Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addresses.map((entry) => (
            <div
              key={entry.id}
              className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-stone-100 text-stone-700">
                    {entry.label}
                  </span>
                  {entry.isDefault && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Default
                    </span>
                  )}
                </div>

                <h3 className="font-serif font-bold text-base text-slate-900 mb-1">
                  {entry.recipientName}
                </h3>
                {entry.recipientPhone && (
                  <p className="text-xs font-mono text-stone-500 mb-2">
                    📱 {entry.recipientPhone}
                  </p>
                )}

                <div className="text-xs text-stone-600 space-y-0.5 leading-relaxed bg-stone-50/60 p-3 rounded-xl border border-stone-100">
                  <p className="font-medium text-slate-800">{entry.recipientStreet}</p>
                  {entry.recipientLocality && <p>{entry.recipientLocality}</p>}
                  <p>
                    {entry.recipientCity}, {entry.recipientState}
                  </p>
                  <p className="font-mono font-bold text-red-700 pt-0.5">
                    PIN: {entry.recipientPincode}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleSendToContact(entry)}
                  className="flex-1 py-2 px-3 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-sm transition-colors text-center"
                >
                  Send Letter →
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  className="p-2 rounded-lg border border-stone-200 hover:bg-red-50 hover:text-red-700 text-stone-400 text-xs transition-colors"
                  title="Delete address"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Address Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-800 to-red-950 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg">Save Recipient Address</h3>
                <p className="text-xs text-red-200">
                  Indian Postal compliant address format with 6-digit PIN resolution.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Label (e.g. Office, Counsel)
                  </label>
                  <input
                    type="text"
                    required
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.recipientName}
                    onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                    placeholder="Advocate Rajesh Verma"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Phone (for Speed Post SMS alert)
                  </label>
                  <input
                    type="tel"
                    value={form.recipientPhone}
                    onChange={(e) => setForm({ ...form, recipientPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    PIN Code (6 digits) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincodeLookup}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    placeholder="560034"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Street Address / Door / Building *
                </label>
                <input
                  type="text"
                  required
                  value={form.recipientStreet}
                  onChange={(e) => setForm({ ...form, recipientStreet: e.target.value })}
                  placeholder="Flat 402, Shanti Nilayam, 5th Cross"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Locality / Landmark
                </label>
                <input
                  type="text"
                  value={form.recipientLocality}
                  onChange={(e) => setForm({ ...form, recipientLocality: e.target.value })}
                  placeholder="Near Wipro Park, Koramangala 4th Block"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.recipientCity}
                    onChange={(e) => setForm({ ...form, recipientCity: e.target.value })}
                    placeholder="Bengaluru"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.recipientState}
                    onChange={(e) => setForm({ ...form, recipientState: e.target.value })}
                    placeholder="Karnataka"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-xs font-semibold shadow-sm"
                >
                  {isSubmitting ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
