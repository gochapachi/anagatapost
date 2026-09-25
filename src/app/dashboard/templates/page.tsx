"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LetterTemplate } from "@/lib/types";

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<LetterTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [previewTemplate, setPreviewTemplate] = useState<LetterTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Corporate",
    content: "",
    letterheadTitle: "ANAGATA POSTAL NETWORK",
    hasLetterhead: true,
  });

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/v1/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const categories = ["All", "Legal", "Corporate", "Real Estate", "Customer Success", "Government"];

  const filteredTemplates = templates.filter((t) =>
    selectedCategory === "All" ? true : t.category === selectedCategory
  );

  const handleUseTemplate = (tmpl: LetterTemplate) => {
    const params = new URLSearchParams({
      template_id: tmpl.id,
      content: tmpl.content,
      letterhead: tmpl.hasLetterhead ? "true" : "false",
      letterhead_title: tmpl.letterheadTitle || "",
    });
    router.push(`/send?${params.toString()}`);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setForm({
          title: "",
          description: "",
          category: "Corporate",
          content: "",
          letterheadTitle: "ANAGATA POSTAL NETWORK",
          hasLetterhead: true,
        });
        fetchTemplates();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <span className="text-slate-900 font-semibold">Templates</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">
            Letter Templates Library
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Indian statutory legal notices, B2B demand notices, and executive member kits.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <span>+ Create Custom Template</span>
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
          className="pb-3 border-b-2 border-red-700 text-red-700 font-semibold"
        >
          📜 Letter Templates ({templates.length})
        </Link>
        <Link
          href="/dashboard/billing"
          className="pb-3 text-stone-500 hover:text-slate-900 font-medium"
        >
          💳 Invoices & Wallet
        </Link>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedCategory === cat
                ? "bg-red-700 text-white shadow-sm"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="p-12 text-center text-stone-400 font-mono text-xs">
          Loading legal templates...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-red-50 text-red-700 border border-red-200">
                    {tmpl.category}
                  </span>
                  {tmpl.isSystem && (
                    <span className="text-[10px] font-mono text-stone-400">
                      🏛️ Verified Indian Format
                    </span>
                  )}
                </div>

                <h3 className="font-serif font-bold text-base text-slate-900 mb-1.5">
                  {tmpl.title}
                </h3>
                <p className="text-xs text-stone-500 mb-4 line-clamp-2 leading-relaxed">
                  {tmpl.description}
                </p>

                {/* Excerpt box */}
                <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 font-mono text-[11px] text-stone-600 line-clamp-4 whitespace-pre-line mb-4">
                  {tmpl.content}
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(tmpl)}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-semibold"
                >
                  Quick Preview
                </button>
                <button
                  type="button"
                  onClick={() => handleUseTemplate(tmpl)}
                  className="px-4 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  Use Template →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-gradient-to-r from-red-800 to-red-950 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase bg-white/20 px-2 py-0.5 rounded">
                  {previewTemplate.category}
                </span>
                <h3 className="font-serif font-bold text-lg mt-1">{previewTemplate.title}</h3>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-stone-800 whitespace-pre-line leading-relaxed bg-[#FAF8F5]">
              {previewTemplate.content}
            </div>

            <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleUseTemplate(previewTemplate)}
                className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-sm"
              >
                Use this in Letter Studio →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-800 to-red-950 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg">Create Custom Template</h3>
                <p className="text-xs text-red-200">
                  Save reusable letter formats with placeholders for your enterprise.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Template Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Board Resolution Notice"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300"
                  >
                    <option value="Corporate">Corporate</option>
                    <option value="Legal">Legal</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Customer Success">Customer Success</option>
                    <option value="Government">Government</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Official notice dispatched to board members for quarterly statutory meeting."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Template Content (Use [Placeholders]) *
                </label>
                <textarea
                  rows={8}
                  required
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Dear [Name],\n\nYou are hereby invited..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-xs font-semibold shadow-sm"
                >
                  {isSubmitting ? "Saving..." : "Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
