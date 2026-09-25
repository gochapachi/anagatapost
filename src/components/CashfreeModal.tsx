"use client";

import { useState } from "react";

interface CashfreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  defaultAmount?: number;
  letterId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export default function CashfreeModal({
  isOpen,
  onClose,
  onSuccess,
  defaultAmount = 500,
  letterId,
  customerName = "Advocate Rajesh Verma",
  customerEmail = "user@example.com",
  customerPhone = "9811223344",
}: CashfreeModalProps) {
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CARD" | "NETBANKING">("UPI");
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>("gpay");
  const [upiIdInput, setUpiIdInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderCreated, setOrderCreated] = useState<any | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateOrder = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/v1/payments/cashfree/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_inr: amount,
          letterId,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrderCreated(data);
      } else {
        setStatusMessage(data.error || "Failed to create payment order.");
      }
    } catch (err: any) {
      setStatusMessage(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!orderCreated?.order_id) return;
    setVerifying(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/v1/payments/cashfree/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderCreated.order_id,
          amount_inr: amount,
          letterId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage("✅ Payment verified! GST Tax Invoice created.");
        setTimeout(() => {
          onSuccess(data);
          onClose();
        }, 1200);
      } else {
        setStatusMessage(data.message || "Payment verification failed.");
      }
    } catch (err: any) {
      setStatusMessage(err.message || "Error verifying payment");
    } finally {
      setVerifying(false);
    }
  };

  const quickAmounts = [250, 500, 1000, 2500, 5000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-800 to-red-950 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-lg">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg">Cashfree Checkout</h3>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 rounded">
                  256-bit SSL
                </span>
              </div>
              <p className="text-xs text-red-200">
                {letterId ? "Dispatch Postage Payment" : "Wallet Recharge & GST Invoicing"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {!orderCreated ? (
            <>
              {/* Amount Selection */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  Recharge Amount (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-lg">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={10}
                    step={10}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    disabled={Boolean(letterId)}
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-stone-300 text-xl font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                </div>

                {!letterId && (
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {quickAmounts.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setAmount(q)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-colors ${
                          amount === q
                            ? "bg-red-700 text-white border-red-700 font-semibold"
                            : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                        }`}
                      >
                        +₹{q}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* GST Breakdown Box */}
              <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between text-stone-600">
                  <span>Base Amount:</span>
                  <span>₹{(amount / 1.18).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>GST (18% Postal HSN 996812):</span>
                  <span>₹{(amount - amount / 1.18).toFixed(2)}</span>
                </div>
                <div className="border-t border-stone-200 pt-1 flex justify-between font-bold text-slate-900 text-sm">
                  <span>Total Payable:</span>
                  <span className="text-red-700">₹{amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("UPI")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === "UPI"
                        ? "border-red-700 bg-red-50/50 text-red-900 ring-2 ring-red-700/20"
                        : "border-stone-200 hover:bg-stone-50 text-stone-700"
                    }`}
                  >
                    <span className="text-base">📱</span>
                    <span>UPI / QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CARD")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === "CARD"
                        ? "border-red-700 bg-red-50/50 text-red-900 ring-2 ring-red-700/20"
                        : "border-stone-200 hover:bg-stone-50 text-stone-700"
                    }`}
                  >
                    <span className="text-base">💳</span>
                    <span>Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("NETBANKING")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === "NETBANKING"
                        ? "border-red-700 bg-red-50/50 text-red-900 ring-2 ring-red-700/20"
                        : "border-stone-200 hover:bg-stone-50 text-stone-700"
                    }`}
                  >
                    <span className="text-base">🏛️</span>
                    <span>NetBanking</span>
                  </button>
                </div>
              </div>

              {/* Proceed Button */}
              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={loading || amount < 10}
                className="w-full py-3.5 rounded-xl bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-semibold shadow-md shadow-red-700/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Initializing Secure Cashfree Session...</span>
                ) : (
                  <>
                    <span>Proceed to Pay ₹{amount}</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </>
          ) : (
            /* Order Created / Checkout Step */
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold block">Order Generated:</span>
                  <span className="font-mono text-[11px]">{orderCreated.order_id}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm block font-mono">₹{amount}</span>
                  <span className="text-[10px] text-emerald-600">Active</span>
                </div>
              </div>

              {/* UPI Option active */}
              {paymentMethod === "UPI" && (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-center space-y-3">
                  <div className="flex justify-center gap-3">
                    {["gpay", "phonepe", "paytm", "bhim"].map((app) => (
                      <button
                        key={app}
                        type="button"
                        onClick={() => setSelectedUpiApp(app)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold uppercase ${
                          selectedUpiApp === app
                            ? "bg-red-700 text-white border-red-700"
                            : "bg-white text-stone-700 border-stone-200"
                        }`}
                      >
                        {app}
                      </button>
                    ))}
                  </div>

                  {/* QR Box */}
                  <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl border border-stone-300 shadow-inner flex flex-col items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(
                        `upi://pay?pa=cashfree@icici&pn=AnagataPost&am=${amount}&cu=INR&tr=${orderCreated.order_id}`
                      )}`}
                      alt="UPI QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-[11px] text-stone-500 font-mono">
                    Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)
                  </p>
                </div>
              )}

              {paymentMethod === "CARD" && (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-stone-500 text-[11px] font-mono">
                    <span>RuPay / Visa / MasterCard</span>
                    <span>100% RBI Compliant</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Card Number (4000 1234 5678 9010)"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono text-xs"
                    defaultValue="4532 •••• •••• 8892"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="px-3 py-2 rounded-lg border border-stone-300 font-mono text-xs"
                      defaultValue="12/28"
                    />
                    <input
                      type="password"
                      placeholder="CVV"
                      className="px-3 py-2 rounded-lg border border-stone-300 font-mono text-xs"
                      defaultValue="123"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === "NETBANKING" && (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2 text-xs">
                  <label className="block font-semibold text-stone-700">Popular Indian Banks</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank"].map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        className="p-2 rounded-lg border border-stone-200 bg-white text-left font-mono text-[11px] hover:border-red-700 transition-colors"
                      >
                        🏛️ {bank}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action verify / simulate */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleVerifyPayment}
                  disabled={verifying}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <span>Verifying with Cashfree Network...</span>
                  ) : (
                    <span>Confirm & Verify Payment (₹{amount})</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setOrderCreated(null)}
                  className="w-full py-2 text-xs text-stone-500 hover:text-stone-700"
                >
                  ← Change amount or payment method
                </button>
              </div>
            </div>
          )}

          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-mono text-center ${
                statusMessage.includes("✅")
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {statusMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
