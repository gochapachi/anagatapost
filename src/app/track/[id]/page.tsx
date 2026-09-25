"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Letter } from "@/lib/types";

interface Milestone {
  title: string;
  timestamp: string | null;
  completed: boolean;
  description: string;
}

export default function TrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [letter, setLetter] = useState<Letter | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/v1/letters/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Letter not found");
        return res.json();
      })
      .then((data) => {
        setLetter(data.letter);
        setMilestones(data.milestones || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center text-sm font-mono text-stone-500">
        Locating India Post Speed Post consignment data...
      </div>
    );
  }

  if (error || !letter) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-slate-900">Letter Not Found</h2>
        <p className="text-sm text-stone-600">The tracking record for ID `{id}` could not be located.</p>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-xl bg-red-700 text-white text-xs font-semibold"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm mb-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-mono uppercase tracking-wider text-red-700 font-bold">
                India Post Speed Post Tracking
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              {letter.recipientName}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Destination: {letter.address.city}, {letter.address.state} —{" "}
              <span className="font-mono font-bold text-slate-800">{letter.address.pincode}</span>
            </p>
          </div>

          <div className="text-left sm:text-right bg-stone-50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
            <p className="text-[10px] font-mono uppercase text-stone-400">Consignment Number</p>
            <p className="font-mono text-base font-bold text-slate-900">
              {letter.consignmentNumber || "Queued for Hub Handover"}
            </p>
            <span
              className={`inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                letter.status === "DELIVERED"
                  ? "bg-emerald-100 text-emerald-800"
                  : letter.status === "IN_TRANSIT"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-purple-100 text-purple-800"
              }`}
            >
              {letter.status.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Tracking Milestones Timeline */}
        <div className="space-y-6">
          <h3 className="font-serif font-bold text-sm text-slate-900 uppercase tracking-wider">
            Consignment Milestones
          </h3>

          <div className="relative border-l-2 border-stone-200 ml-4 space-y-8 pl-6">
            {milestones.map((m, idx) => (
              <div key={idx} className="relative group">
                {/* Dot */}
                <div
                  className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 transition-all ${
                    m.completed
                      ? "bg-red-700 border-red-700 ring-4 ring-red-100"
                      : "bg-white border-stone-300"
                  }`}
                ></div>

                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <p
                      className={`text-sm font-semibold ${
                        m.completed ? "text-slate-900" : "text-stone-400"
                      }`}
                    >
                      {m.title}
                    </p>
                    {m.timestamp && (
                      <span className="text-[11px] font-mono text-stone-500">
                        {new Date(m.timestamp).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 mt-0.5">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Physical Letter Preview Preview Box */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="font-serif font-bold text-base text-slate-900">
            Enclosed Physical Letter Preview
          </h3>
          <span className="text-xs font-mono text-stone-500">100 GSM Executive Bond</span>
        </div>

        <div className="parchment-sheet p-6 sm:p-8 rounded-xl border border-stone-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
          {letter.hasLetterhead && (
            <div className="text-center border-b border-slate-800 pb-3 mb-4">
              <p className="font-serif font-bold tracking-wider uppercase text-slate-900">
                {letter.letterheadTitle || "ANAGATA POSTAL NETWORK"}
              </p>
            </div>
          )}
          <div className={letter.handwritingFont !== "NONE" ? "font-handwriting" : "font-sans"}>
            {letter.content}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-stone-600 hover:text-slate-900"
          >
            ← Back to Dashboard
          </Link>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
          >
            Print Tracking Proof
          </button>
        </div>
      </div>
    </div>
  );
}
