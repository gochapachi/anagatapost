"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { validateIndianPincode } from "@/lib/pincodes";
import UpiPaymentModal from "@/components/UpiPaymentModal";

interface ParsedRow {
  id: number;
  recipient: string;
  phone: string;
  street: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  content: string;
  isValid: boolean;
  error?: string;
}

const SAMPLE_CSV = `recipient,phone,street,locality,city,state,pincode,content
Aditi Sharma,9876543210,402 Shanti Nilayam,Koramangala,Bengaluru,Karnataka,560034,Dear Aditi, Your annual shareholder notice is enclosed.
Rohan Gupta,9811223344,14 Cyber Heights,DLF Phase 2,Gurugram,Haryana,122002,Dear Rohan, Welcome to our corporate partner program.
Priya Nair,9845012345,12 Marine Drive,Nariman Point,Mumbai,Maharashtra,400020,Dear Priya, Your physical certificate of registration is ready.
Kavita Rao,9988776655,8th Cross Indiranagar,,Bengaluru,Karnataka,560038,Dear Kavita, Please find your VIP invitation enclosed.
Vikram Malhotra,9123456780,High Court Chamber 14,,New Delhi,Delhi,110003,Dear Vikram, Formal legal notice regarding pending arbitration.`;

export default function BulkSendPage() {
  const router = useRouter();
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTopup, setShowTopup] = useState(false);
  const [balanceInr, setBalanceInr] = useState(500);

  // Parse CSV text
  const handleParse = (text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length <= 1) {
      setParsedRows([]);
      return;
    }

    const rows: ParsedRow[] = [];
    // skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
      const [recipient, phone, street, locality, city, state, pincode, ...contentParts] = cols;
      const content = contentParts.join(", ");

      let isValid = true;
      let error = "";

      if (!recipient) {
        isValid = false;
        error = "Missing recipient";
      } else if (!street) {
        isValid = false;
        error = "Missing street";
      } else if (!pincode || !validateIndianPincode(pincode)) {
        isValid = false;
        error = `Invalid PIN: ${pincode || "empty"}`;
      } else if (!content) {
        isValid = false;
        error = "Missing content";
      }

      rows.push({
        id: i,
        recipient: recipient || "",
        phone: phone || "",
        street: street || "",
        locality: locality || "",
        city: city || "City",
        state: state || "State",
        pincode: pincode || "",
        content: content || "",
        isValid,
        error,
      });
    }

    setParsedRows(rows);
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const totalCost = validRows.length * 99; // ₹99 per Speed Post letter

  const handleDispatchBatch = async () => {
    if (validRows.length === 0) return;
    setIsProcessing(true);
    setProgress(0);

    let completed = 0;
    for (const row of validRows) {
      try {
        await fetch("/api/v1/letters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: row.recipient,
            phone: row.phone || undefined,
            address: {
              street: row.street,
              locality: row.locality || undefined,
              city: row.city,
              state: row.state,
              pincode: row.pincode,
            },
            content: row.content,
            delivery_type: "SPEED_POST",
            send: true,
          }),
        });
      } catch (err) {
        console.error(err);
      }
      completed++;
      setProgress(Math.round((completed / validRows.length) * 100));
    }

    setIsProcessing(false);
    router.push("/dashboard?batch_sent=true");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-mono text-stone-500 mb-2">
          <Link href="/" className="hover:text-red-700">
            Home
          </Link>
          <span>/</span>
          <Link href="/send" className="hover:text-red-700">
            Letter Studio
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">Bulk Dispatcher</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900">
              Bulk Physical Mail Dispatcher
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              Upload a CSV file or paste tabular addresses to dispatch hundreds of Speed Post letters
              in one click.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setCsvText(SAMPLE_CSV);
                handleParse(SAMPLE_CSV);
              }}
              className="px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-slate-800 text-xs font-semibold shadow-sm"
            >
              Load Sample 5-Letter Batch
            </button>
            <a
              href="data:text/csv;charset=utf-8,recipient,phone,street,locality,city,state,pincode,content%0A"
              download="anagatapost_bulk_template.csv"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm"
            >
              📥 Download CSV Template
            </a>
          </div>
        </div>
      </div>

      {/* CSV Input Area */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider font-mono">
            Paste CSV Data or Edit Batch Below:
          </label>
          <button
            onClick={() => handleParse(csvText)}
            className="px-3 py-1 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold"
          >
            Validate & Parse Addresses
          </button>
        </div>

        <textarea
          rows={6}
          value={csvText}
          onChange={(e) => {
            setCsvText(e.target.value);
            handleParse(e.target.value);
          }}
          placeholder="recipient,phone,street,locality,city,state,pincode,content..."
          className="w-full font-mono text-xs rounded-xl border border-stone-300 p-4 leading-relaxed focus:border-red-700 focus:outline-none bg-stone-50/50"
        />
      </div>

      {/* Parsed Table & Batch Summary */}
      {parsedRows.length > 0 && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="bg-stone-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-mono text-stone-400">BATCH SUMMARY</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="font-serif text-3xl font-bold">
                  {validRows.length} Letters Ready
                </span>
                {parsedRows.length - validRows.length > 0 && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-900/60 text-red-300 border border-red-800">
                    {parsedRows.length - validRows.length} Invalid
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs font-mono text-stone-400">ESTIMATED SPEED POST COST</p>
                <p className="font-serif text-2xl font-bold text-emerald-400">₹{totalCost}.00</p>
              </div>

              <button
                disabled={isProcessing || validRows.length === 0}
                onClick={handleDispatchBatch}
                className="px-6 py-3 rounded-xl bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2"
              >
                <span>
                  {isProcessing
                    ? `Dispatching (${progress}%)...`
                    : `Dispatch Batch (${validRows.length} Letters)`}
                </span>
                <span>🚀</span>
              </button>
            </div>
          </div>

          {/* Progress bar if sending */}
          {isProcessing && (
            <div className="w-full bg-stone-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-red-700 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          {/* Address Validation Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-mono uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3">#</th>
                    <th className="px-5 py-3">Recipient & Mobile</th>
                    <th className="px-5 py-3">Street & Locality</th>
                    <th className="px-5 py-3">City & State</th>
                    <th className="px-5 py-3">PIN Code</th>
                    <th className="px-5 py-3">Validation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {parsedRows.map((row) => (
                    <tr
                      key={row.id}
                      className={row.isValid ? "hover:bg-stone-50" : "bg-red-50/40 hover:bg-red-50"}
                    >
                      <td className="px-5 py-3.5 font-mono text-stone-400">{row.id}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-900">{row.recipient}</p>
                        {row.phone && (
                          <p className="text-[11px] font-mono text-stone-500">+91 {row.phone}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-stone-700">
                        {row.street} {row.locality && `• ${row.locality}`}
                      </td>
                      <td className="px-5 py-3.5 text-stone-700">
                        {row.city}, {row.state}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                        {row.pincode}
                      </td>
                      <td className="px-5 py-3.5">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 font-semibold">
                            <span>✓</span> Verified PIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-red-700 font-semibold">
                            <span>✗</span> {row.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Topup modal if needed */}
      <UpiPaymentModal
        isOpen={showTopup}
        onClose={() => setShowTopup(false)}
        onSuccess={(bal) => setBalanceInr(Number(bal))}
        defaultAmount={totalCost > 500 ? totalCost : 500}
      />
    </div>
  );
}
