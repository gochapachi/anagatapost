"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DeliveryType, HandwritingFont } from "@/lib/types";
import CashfreeModal from "@/components/CashfreeModal";

export default function SendLetterPage() {
  const router = useRouter();

  // Form states
  const [recipientName, setRecipientName] = useState("Suresh Kumar");
  const [recipientPhone, setRecipientPhone] = useState("9876543210");
  const [street, setStreet] = useState("Flat 301, Greenfield Residency, 8th Main");
  const [locality, setLocality] = useState("Indiranagar");
  const [pincode, setPincode] = useState("560038");
  const [city, setCity] = useState("Bengaluru");
  const [state, setState] = useState("Karnataka");
  const [resolvedPo, setResolvedPo] = useState("Indiranagar S.O");

  const [senderName, setSenderName] = useState("Anagata IT Solutions");
  const [senderStreet, setSenderStreet] = useState("Tech Park, Ring Road");
  const [senderCity, setSenderCity] = useState("Bengaluru");
  const [senderState, setSenderState] = useState("Karnataka");
  const [senderPincode, setSenderPincode] = useState("560071");

  const [content, setContent] = useState(
    `Dear Suresh,\n\nWe are delighted to confirm that your official verification documentation and certificate have been processed.\n\nPlease find this physical correspondence as formal confirmation under our registered records.\n\nWarm regards,\nTeam Anagata`
  );

  const [handwriting, setHandwriting] = useState<HandwritingFont>("CAVEAT");
  const [hasLetterhead, setHasLetterhead] = useState(true);
  const [letterheadTitle, setLetterheadTitle] = useState("ANAGATA IT SOLUTIONS");
  const [colorPrint, setColorPrint] = useState(false);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("SPEED_POST");

  // UI state
  const [previewTab, setPreviewTab] = useState<"letter" | "envelope">("letter");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [isCashfreeOpen, setIsCashfreeOpen] = useState(false);

  // Read URL search params on mount (from Address Book or Templates)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("recipient")) setRecipientName(params.get("recipient")!);
      if (params.get("phone")) setRecipientPhone(params.get("phone")!);
      if (params.get("street")) setStreet(params.get("street")!);
      if (params.get("locality")) setLocality(params.get("locality")!);
      if (params.get("city")) setCity(params.get("city")!);
      if (params.get("state")) setState(params.get("state")!);
      if (params.get("pincode")) setPincode(params.get("pincode")!);
      if (params.get("content")) setContent(params.get("content")!);
      if (params.get("letterhead_title")) setLetterheadTitle(params.get("letterhead_title")!);
      if (params.get("letterhead") === "true") setHasLetterhead(true);
    }
  }, []);

  // Auto-resolve PIN code when 6 digits entered
  useEffect(() => {
    if (/^[1-9][0-9]{5}$/.test(pincode)) {
      setPincodeLoading(true);
      fetch(`/api/v1/pincode/${pincode}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setState(data.state);
            setCity(data.district || data.postOffice.replace(/(H\.O|S\.O)/g, "").trim());
            setResolvedPo(data.postOffice);
          }
        })
        .catch(console.error)
        .finally(() => setPincodeLoading(false));
    }
  }, [pincode]);

  // Calculate cost
  let totalCost = deliveryType === "REGISTERED_POST" ? 129 : deliveryType === "STANDARD" ? 49 : 99;
  if (colorPrint) totalCost += 20;

  // Preset templates
  const loadTemplate = (type: "welcome" | "legal" | "personal") => {
    if (type === "welcome") {
      setHasLetterhead(true);
      setLetterheadTitle("ANAGATA IT SOLUTIONS");
      setHandwriting("NONE");
      setDeliveryType("SPEED_POST");
      setContent(
        `Dear ${recipientName || "Customer"},\n\nWelcome to Anagata! We are excited to present your verified physical welcome kit and account confirmation.\n\nYour account is now fully operational with dedicated priority support.\n\nWarm regards,\nFounder Office\nAnagata IT Solutions`
      );
    } else if (type === "legal") {
      setHasLetterhead(true);
      setLetterheadTitle("LEGAL ADVOCATES & SOLICITORS");
      setHandwriting("NONE");
      setDeliveryType("REGISTERED_POST");
      setContent(
        `DEMAND NOTICE UNDER SECTION 138 OF NEGOTIABLE INSTRUMENTS ACT\n\nTo,\n${recipientName || "Recipient"},\n\nPlease take notice that cheque no. 082194 drawn in favor of our client has been returned dishonored. You are hereby called upon to make full payment within 15 days of this notice, failing which criminal prosecution shall follow.\n\nYours faithfully,\nAdvocate Chamber`
      );
    } else if (type === "personal") {
      setHasLetterhead(false);
      setHandwriting("CAVEAT");
      setDeliveryType("SPEED_POST");
      setContent(
        `Dear ${recipientName || "Friend"},\n\nI wanted to send you something real instead of another text message that gets lost in notifications. Thank you for your warmth and support recently.\n\nWishing you and family good health and happiness.\n\nWith love,\nSanjeev`
      );
    }
  };

  const handleSendOrDraft = async (immediate: boolean) => {
    setErrorMsg("");
    if (!recipientName.trim()) {
      setErrorMsg("Please enter recipient name");
      return;
    }
    if (!street.trim()) {
      setErrorMsg("Please enter street address");
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      setErrorMsg("Please enter a valid 6-digit Indian PIN code");
      return;
    }
    if (!content.trim()) {
      setErrorMsg("Please enter letter content");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: recipientName,
          phone: recipientPhone,
          address: {
            street,
            locality,
            city,
            state,
            pincode,
          },
          sender: {
            name: senderName,
            street: senderStreet,
            city: senderCity,
            state: senderState,
            pincode: senderPincode,
          },
          content,
          handwriting: handwriting !== "NONE" ? handwriting : false,
          letterhead: hasLetterhead ? letterheadTitle : false,
          color: colorPrint,
          delivery_type: deliveryType,
          send: immediate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402 || data.error?.toLowerCase().includes("insufficient balance")) {
          setErrorMsg("Your wallet balance is low. Please recharge with Cashfree to dispatch immediately.");
          setIsCashfreeOpen(true);
        } else {
          setErrorMsg(data.error || "Failed to create letter");
        }
        return;
      }

      // Redirect to tracking or dashboard
      router.push(`/track/${data.id}?created=true`);
    } catch (err: any) {
      setErrorMsg(err.message || "Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb & Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-mono text-stone-500 mb-2">
          <Link href="/" className="hover:text-red-700">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">Letter Studio</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900">Compose Physical Letter</h1>
            <p className="text-sm text-stone-600 mt-1">
              Live A4 print preview & realistic envelope layout with India Post Speed Post compliance.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              href="/dashboard/addresses"
              className="px-3 py-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 text-slate-800 font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <span>📇 Address Book</span>
            </Link>
            <Link
              href="/dashboard/templates"
              className="px-3 py-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 text-slate-800 font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <span>📜 All Templates</span>
            </Link>
            <span className="text-stone-400 pl-2">Quick:</span>
            <button
              onClick={() => loadTemplate("welcome")}
              className="px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium"
            >
              Corporate Welcome
            </button>
            <button
              onClick={() => loadTemplate("legal")}
              className="px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium"
            >
              Legal Notice
            </button>
            <button
              onClick={() => loadTemplate("personal")}
              className="px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium"
            >
              Handwritten
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="font-bold text-red-900">
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-6 space-y-6">
          {/* Recipient Details Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                <span>📍</span> Recipient Indian Address
              </h3>
              <span className="text-[11px] font-mono text-red-700 bg-red-50 px-2 py-0.5 rounded font-semibold">
                Required
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Suresh Kumar"
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-red-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Mobile Number (WhatsApp alert)
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-stone-300 bg-stone-50 text-xs font-mono text-stone-500">
                    +91
                  </span>
                  <input
                    type="text"
                    maxLength={10}
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="10-digit mobile"
                    className="w-full rounded-r-xl border border-stone-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Flat / House No., Building, Street *
              </label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="e.g. Flat 301, Greenfield Residency, 8th Main"
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-red-700 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  6-Digit PIN Code *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="e.g. 560038"
                    className="w-full font-mono rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-red-700 focus:outline-none"
                  />
                  {pincodeLoading && (
                    <span className="absolute right-2.5 top-2.5 text-xs text-red-600 animate-spin">
                      ⏳
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">City / Town</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Bengaluru"
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-red-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Karnataka"
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-red-700 focus:outline-none"
                />
              </div>
            </div>

            {resolvedPo && (
              <p className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                Postal Office: <strong>{resolvedPo}</strong> • Speed Post Hub Serviceable
              </p>
            )}
          </div>

          {/* Letter Body & Typography Controls */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-base text-slate-900 flex items-center gap-2">
                <span>📝</span> Letter Content & Typography
              </h3>
              <span className="text-xs font-mono text-stone-500">{content.length} chars</span>
            </div>

            {/* Styling Toggles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Typography Style
                </label>
                <select
                  value={handwriting}
                  onChange={(e) => setHandwriting(e.target.value as HandwritingFont)}
                  className="w-full rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs bg-white focus:outline-none"
                >
                  <option value="NONE">Executive Typewriter</option>
                  <option value="CAVEAT">Organic Handwriting (Caveat)</option>
                  <option value="KALAM">Casual Script (Kalam)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Delivery Speed
                </label>
                <select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value as DeliveryType)}
                  className="w-full rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs bg-white focus:outline-none font-medium"
                >
                  <option value="SPEED_POST">Speed Post (₹99 • 2-4 days)</option>
                  <option value="REGISTERED_POST">Registered Post (₹129 • Legal)</option>
                  <option value="STANDARD">Standard Post (₹49 • Budget)</option>
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1 flex flex-col justify-end">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer py-1.5">
                  <input
                    type="checkbox"
                    checked={hasLetterhead}
                    onChange={(e) => setHasLetterhead(e.target.checked)}
                    className="rounded text-red-700 focus:ring-red-500"
                  />
                  <span>Add Letterhead</span>
                </label>
              </div>
            </div>

            {hasLetterhead && (
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Letterhead Title
                </label>
                <input
                  type="text"
                  value={letterheadTitle}
                  onChange={(e) => setLetterheadTitle(e.target.value)}
                  placeholder="e.g. ANAGATA IT SOLUTIONS"
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs font-mono uppercase tracking-wider focus:border-red-700 focus:outline-none"
                />
              </div>
            )}

            {/* Letter Textarea */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Letter Body (Markdown Supported) *
              </label>
              <textarea
                rows={9}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your letter content here..."
                className="w-full rounded-xl border border-stone-300 p-3.5 text-sm focus:border-red-700 focus:outline-none font-sans leading-relaxed"
              />
            </div>
          </div>

          {/* Pricing Summary & Dispatch Actions */}
          <div className="bg-stone-900 rounded-2xl p-6 text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <p className="text-xs font-mono text-stone-400">TOTAL COST (INCL. POSTAGE & PRINT)</p>
                <p className="text-3xl font-serif font-bold text-white mt-1">₹{totalCost}.00</p>
              </div>
              <div className="text-right">
                <span className="inline-block text-[11px] font-mono px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Wallet Balance: ₹500.00
                </span>
                <p className="text-[10px] text-stone-400 mt-1">100 GSM Bond • Tamper-proof Envelope</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSendOrDraft(true)}
                className="flex-1 py-3.5 rounded-xl bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-red-700/30 transition-all flex items-center justify-center gap-2"
              >
                <span>{isSubmitting ? "Queueing..." : `Send Letter Immediately (₹${totalCost})`}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSendOrDraft(false)}
                className="px-5 py-3.5 rounded-xl border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-medium transition-all"
              >
                Save as Draft
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live A4 Letter & Envelope Visualizer */}
        <div className="lg:col-span-6 sticky top-24 space-y-4">
          {/* View Mode Tabs */}
          <div className="flex items-center justify-between bg-white p-1.5 rounded-xl border border-stone-200">
            <div className="flex gap-1">
              <button
                onClick={() => setPreviewTab("letter")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  previewTab === "letter"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-stone-600 hover:text-slate-900"
                }`}
              >
                📄 A4 Letter Sheet
              </button>
              <button
                onClick={() => setPreviewTab("envelope")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  previewTab === "envelope"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-stone-600 hover:text-slate-900"
                }`}
              >
                ✉️ Speed Post Envelope
              </button>
            </div>

            <span className="text-[11px] font-mono text-stone-400 pr-2">Real-time Simulation</span>
          </div>

          {/* TAB 1: Real-time A4 Letter Sheet */}
          {previewTab === "letter" && (
            <div className="parchment-sheet rounded-xl border border-stone-300 p-8 sm:p-12 min-h-[580px] text-slate-800 relative flex flex-col justify-between">
              {/* Top Letterhead */}
              <div>
                {hasLetterhead && (
                  <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
                    <h2 className="font-serif font-black tracking-widest text-base sm:text-lg text-slate-900 uppercase">
                      {letterheadTitle || "ANAGATA POSTAL NETWORK"}
                    </h2>
                    <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest mt-0.5">
                      Executive Correspondence • Speed Post Transmission
                    </p>
                  </div>
                )}

                {/* Date & Ref */}
                <div className="flex justify-between items-center text-xs font-mono text-stone-500 mb-6">
                  <span>DATE: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  <span>REF: ANAGATA-POST/2026</span>
                </div>

                {/* Recipient Addressee Block */}
                <div className="text-xs mb-8 space-y-0.5 text-slate-900">
                  <p className="font-bold text-sm">{recipientName || "[Recipient Name]"}</p>
                  <p>{street || "[Street Address]"}</p>
                  {locality && <p>{locality}</p>}
                  <p className="font-semibold text-slate-900">
                    {city || "[City]"}, {state || "[State]"} — {pincode || "[PIN]"}
                  </p>
                  {recipientPhone && <p className="text-stone-500 font-mono">Ph: +91 {recipientPhone}</p>}
                </div>

                {/* Letter Body Text */}
                <div
                  className={`text-slate-900 whitespace-pre-wrap ${
                    handwriting !== "NONE" ? "font-handwriting" : "font-sans text-sm leading-relaxed"
                  }`}
                >
                  {content || "Your letter text will appear here..."}
                </div>
              </div>

              {/* Bottom Sign-off watermark & folding guidelines */}
              <div className="pt-10 border-t border-dashed border-stone-300 mt-8 flex items-center justify-between text-[10px] font-mono text-stone-400">
                <span>100 GSM Executive Bond Paper</span>
                <span>AnagataPost Postal Engine</span>
              </div>
            </div>
          )}

          {/* TAB 2: Realistic Envelope Simulation */}
          {previewTab === "envelope" && (
            <div className="bg-[#FAF6EE] rounded-xl border-2 border-stone-300 shadow-xl p-8 min-h-[420px] relative flex flex-col justify-between">
              {/* Top Row: Sender Address (Left) & Speed Post Stamp + Barcode (Right) */}
              <div className="flex items-start justify-between">
                {/* Sender Address */}
                <div className="text-[11px] font-mono text-stone-600 max-w-[200px] leading-tight">
                  <p className="text-[9px] uppercase tracking-wider text-stone-400">FROM / SENDER:</p>
                  <p className="font-bold text-slate-900 mt-0.5">{senderName}</p>
                  <p>{senderStreet}</p>
                  <p>
                    {senderCity}, {senderState} - {senderPincode}
                  </p>
                </div>

                {/* India Post Stamp + Circular Seal */}
                <div className="flex items-center gap-3">
                  <div className="postmark-seal">
                    <span className="text-[7px] font-bold">SPEED POST</span>
                    <span className="text-[9px] font-bold">{city.toUpperCase() || "BENGALURU"}</span>
                    <span className="text-[6px]">{new Date().toLocaleDateString("en-IN")}</span>
                  </div>

                  <div className="india-stamp w-16 h-20 rounded p-1.5 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between text-[7px] font-bold text-red-700">
                      <span>BHARAT</span>
                      <span>₹50</span>
                    </div>
                    <div className="text-center">
                      <span className="text-xl">🇮🇳</span>
                    </div>
                    <div className="text-[6px] font-mono text-slate-700 text-right">POSTAGE</div>
                  </div>
                </div>
              </div>

              {/* Center: Recipient Windowed Label */}
              <div className="my-6 mx-auto w-full max-w-sm bg-white p-5 rounded-lg border border-stone-300 shadow-sm">
                <p className="text-[9px] font-mono uppercase tracking-widest text-red-700 font-bold mb-1">
                  TO (RECIPIENT):
                </p>
                <p className="font-serif font-bold text-base text-slate-900">
                  {recipientName || "[Recipient Name]"}
                </p>
                <p className="text-xs text-stone-700 mt-0.5">{street || "[Street Address]"}</p>
                {locality && <p className="text-xs text-stone-700">{locality}</p>}
                <p className="text-xs font-bold text-slate-900 mt-1">
                  {city || "[City]"}, {state || "[State]"} — {pincode || "[PIN]"}
                </p>
                {recipientPhone && (
                  <p className="text-[11px] font-mono text-stone-500 mt-1">
                    Contact: +91 {recipientPhone}
                  </p>
                )}
              </div>

              {/* Bottom: India Post Speed Post Consignment Barcode */}
              <div className="border-t border-stone-300 pt-3 flex items-center justify-between">
                <div className="w-48">
                  <div className="postal-barcode"></div>
                  <p className="text-[9px] font-mono text-center text-slate-700 tracking-widest mt-1">
                    *ED839201948IN*
                  </p>
                </div>
                <div className="text-right font-mono text-[10px] text-stone-500">
                  <p className="font-bold text-red-700">INDIA POST SPEED POST</p>
                  <p>Weight: &lt; 50g • A4 Folded</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cashfree Recharge Modal */}
      <CashfreeModal
        isOpen={isCashfreeOpen}
        onClose={() => setIsCashfreeOpen(false)}
        onSuccess={() => {
          setErrorMsg("");
        }}
        defaultAmount={500}
      />
    </div>
  );
}
