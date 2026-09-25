"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Letter } from "@/lib/types";

export default function LetterPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [letter, setLetter] = useState<Letter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/letters/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.letter) setLetter(data.letter);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-20 text-center font-mono text-xs text-stone-500">
        Rendering high-resolution A4 print layout...
      </div>
    );
  }

  if (!letter) {
    return (
      <div className="p-20 text-center space-y-4">
        <p className="font-serif text-lg text-slate-800">Letter not found.</p>
        <Link href="/admin" className="text-xs text-red-700 underline">
          Return to Fulfillment Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-stone-200 min-h-screen p-4 sm:p-8 flex flex-col items-center print:bg-white print:p-0">
      {/* Non-printing Control Toolbar */}
      <div className="w-full max-w-[210mm] bg-white rounded-2xl p-4 mb-6 shadow-sm border border-stone-300 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-xs font-semibold text-stone-600 hover:text-slate-900"
          >
            ← Back to Operations Hub
          </Link>
          <span className="text-stone-300">|</span>
          <span className="text-xs font-mono font-bold text-slate-900">ID: {letter.id}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-100 text-red-800 uppercase font-semibold">
            {letter.deliveryType}
          </span>
        </div>

        <button
          onClick={() => window.print()}
          className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-semibold text-xs shadow-md flex items-center gap-2"
        >
          <span>🖨️ Print Sheet (A4 & Envelope)</span>
        </button>
      </div>

      {/* PAGE 1: A4 Letter Sheet */}
      <div className="w-full max-w-[210mm] min-h-[297mm] bg-white p-[25mm] shadow-2xl relative border border-stone-300 print:shadow-none print:border-none print:m-0 print:p-[20mm] flex flex-col justify-between mb-8 print:mb-0 print:page-break-after-always">
        {/* Folding guide marks at 1/3 and 2/3 */}
        <div className="absolute left-0 top-[99mm] w-3 border-t border-dashed border-stone-400 opacity-60"></div>
        <div className="absolute right-0 top-[99mm] w-3 border-t border-dashed border-stone-400 opacity-60"></div>
        <div className="absolute left-0 top-[198mm] w-3 border-t border-dashed border-stone-400 opacity-60"></div>
        <div className="absolute right-0 top-[198mm] w-3 border-t border-dashed border-stone-400 opacity-60"></div>

        <div>
          {/* Letterhead */}
          {letter.hasLetterhead && (
            <div className="text-center border-b-2 border-slate-900 pb-4 mb-8">
              <h1 className="font-serif font-black tracking-widest text-lg text-slate-900 uppercase">
                {letter.letterheadTitle || "ANAGATA POSTAL NETWORK"}
              </h1>
              <p className="text-[9px] font-mono text-stone-500 uppercase tracking-widest mt-0.5">
                Executive Transmission • Speed Post India
              </p>
            </div>
          )}

          {/* Date & Reference */}
          <div className="flex justify-between items-center text-xs font-mono text-stone-500 mb-6">
            <span>
              DATE:{" "}
              {new Date(letter.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span>EMS REF: {letter.consignmentNumber || "SPEED-POST-PRIORITY"}</span>
          </div>

          {/* Addressee Block (Positioned for window envelope) */}
          <div className="text-xs mb-10 space-y-0.5 text-slate-900 bg-stone-50/50 p-4 rounded border border-stone-200 print:bg-transparent print:border-none print:p-0">
            <p className="font-bold text-sm">{letter.recipientName}</p>
            <p>{letter.address.street}</p>
            {letter.address.locality && <p>{letter.address.locality}</p>}
            <p className="font-semibold text-slate-900">
              {letter.address.city}, {letter.address.state} —{" "}
              <span className="font-mono">{letter.address.pincode}</span>
            </p>
            {letter.recipientPhone && (
              <p className="text-[11px] font-mono text-stone-500">Ph: +91 {letter.recipientPhone}</p>
            )}
          </div>

          {/* Letter Content */}
          <div
            className={`text-slate-900 whitespace-pre-wrap ${
              letter.handwritingFont !== "NONE"
                ? "font-handwriting text-lg leading-relaxed"
                : "font-sans text-sm leading-relaxed"
            }`}
          >
            {letter.content}
          </div>
        </div>

        {/* Footer info & watermark */}
        <div className="pt-6 border-t border-stone-300 flex items-center justify-between text-[10px] font-mono text-stone-400">
          <span>Printed on 100 GSM Executive Bond Paper</span>
          <span>Dispatched via India Post Speed Post • AnagataPost</span>
        </div>
      </div>

      {/* PAGE 2: Envelope Cover Sheet */}
      <div className="w-full max-w-[210mm] min-h-[148mm] bg-[#FAF6EE] p-8 shadow-2xl relative border-2 border-stone-300 print:shadow-none print:border-none print:m-0 flex flex-col justify-between">
        {/* Top: Sender & Postmark */}
        <div className="flex items-start justify-between">
          <div className="text-xs font-mono text-stone-700 max-w-xs leading-tight">
            <p className="text-[9px] uppercase tracking-wider text-stone-400">SENDER / RETURN TO:</p>
            <p className="font-bold text-slate-900 mt-0.5">
              {letter.sender?.name || "AnagataPost Dispatch Hub"}
            </p>
            <p>{letter.sender?.street || "Postal Logistics Center"}</p>
            <p>
              {letter.sender?.city || "Bengaluru"},{" "}
              {letter.sender?.state || "Karnataka"} -{" "}
              {letter.sender?.pincode || "560001"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="postmark-seal">
              <span className="text-[7px] font-bold">SPEED POST</span>
              <span className="text-[9px] font-bold">{letter.address.city.toUpperCase()}</span>
              <span className="text-[6px]">{new Date().toLocaleDateString("en-IN")}</span>
            </div>

            <div className="india-stamp w-16 h-20 rounded p-1.5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-[7px] font-bold text-red-700">
                <span>BHARAT</span>
                <span>₹50</span>
              </div>
              <div className="text-center font-bold text-xl">🇮🇳</div>
              <div className="text-[6px] font-mono text-slate-700 text-right">POSTAGE</div>
            </div>
          </div>
        </div>

        {/* Center: Recipient Window */}
        <div className="my-6 mx-auto w-full max-w-md bg-white p-6 rounded-lg border-2 border-stone-400 shadow-sm">
          <p className="text-[9px] font-mono uppercase tracking-widest text-red-700 font-bold mb-1">
            TO (RECIPIENT):
          </p>
          <p className="font-serif font-bold text-lg text-slate-900">{letter.recipientName}</p>
          <p className="text-xs text-stone-700 mt-1">{letter.address.street}</p>
          {letter.address.locality && <p className="text-xs text-stone-700">{letter.address.locality}</p>}
          <p className="text-sm font-bold text-slate-900 mt-1">
            {letter.address.city}, {letter.address.state} —{" "}
            <span className="font-mono text-red-700">{letter.address.pincode}</span>
          </p>
          {letter.recipientPhone && (
            <p className="text-xs font-mono text-stone-500 mt-1">
              Contact: +91 {letter.recipientPhone}
            </p>
          )}
        </div>

        {/* Bottom Barcode & Consignment */}
        <div className="border-t border-stone-300 pt-3 flex items-center justify-between">
          <div className="w-56">
            <div className="postal-barcode"></div>
            <p className="text-[10px] font-mono text-center text-slate-900 tracking-widest mt-1 font-bold">
              *{letter.consignmentNumber || "ED839201948IN"}*
            </p>
          </div>
          <div className="text-right font-mono text-[10px] text-stone-500">
            <p className="font-bold text-red-700">INDIA POST SPEED POST</p>
            <p>EMS Priority Parcel & Letter</p>
          </div>
        </div>
      </div>
    </div>
  );
}
