"use client";

import { useState } from "react";

interface UpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBalanceInr: string) => void;
  defaultAmount?: number;
}

export default function UpiPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  defaultAmount = 500,
}: UpiPaymentModalProps) {
  const [amount, setAmount] = useState(defaultAmount);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedVpa, setCopiedVpa] = useState(false);

  if (!isOpen) return null;

  const upiId = "anagatapost@icici";
  const upiUrl = `upi://pay?pa=${upiId}&pn=AnagataPost&am=${amount}&cu=INR&tn=AnagataPost_Wallet_Topup`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    upiUrl
  )}`;

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const handleConfirmPayment = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_inr: amount }),
      });
      if (res.ok) {
        const data = await res.json();
        onSuccess(data.balance_inr);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-stone-200 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="font-serif font-bold text-lg text-slate-900">
              Instant UPI Wallet Top-Up
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-slate-800 font-bold text-lg p-1"
          >
            ×
          </button>
        </div>

        {/* Amount Selector */}
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-2">
            Select Top-Up Amount (INR)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[200, 500, 1000, 2500].map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt)}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
                  amount === amt
                    ? "bg-red-700 text-white border-red-700 shadow-sm"
                    : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic UPI QR Code */}
        <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-stone-200 flex flex-col items-center justify-center text-center space-y-3">
          <div className="p-2 bg-white rounded-xl shadow-sm border border-stone-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="UPI QR Code" width={160} height={160} className="rounded-lg" />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-900">
              Scan with GPay, PhonePe, Paytm or BHIM
            </p>
            <p className="text-[11px] font-mono text-stone-500 mt-0.5">Amount: ₹{amount}.00</p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-white px-3 py-1.5 rounded-lg border border-stone-200">
            <span>UPI ID: {upiId}</span>
            <button
              onClick={handleCopyVpa}
              className="text-red-700 font-semibold hover:underline"
            >
              {copiedVpa ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-2">
          <button
            disabled={isLoading}
            onClick={handleConfirmPayment}
            className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>{isLoading ? "Verifying Transaction..." : `Confirm & Add ₹${amount} Credits`}</span>
            <span>⚡</span>
          </button>
          <p className="text-[10px] text-center text-stone-400 font-mono">
            Direct ICICI/BHIM settlement • Instant credit to API balance
          </p>
        </div>
      </div>
    </div>
  );
}
