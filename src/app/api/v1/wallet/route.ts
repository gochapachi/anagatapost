import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/db";
import { requireAdmin, requireSession } from "@/lib/session";

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const balancePaise = await store.getBalancePaise(auth.user.id);
  return NextResponse.json({
    user_id: auth.user.id,
    balance_paise: balancePaise,
    balance_inr: (balancePaise / 100).toFixed(2),
    currency: "INR",
  });
}

/**
 * Manual balance adjustment — ADMIN only.
 *
 * This endpoint used to be public: any anonymous POST with `amount_inr` raised a
 * wallet balance, i.e. it minted money for free. PR-2 replaces the mutation with
 * an audited ledger entry; payment-driven credit arrives only from the Cashfree
 * webhook.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const amountInr = Number(body.amount_inr);

    if (!Number.isFinite(amountInr) || amountInr <= 0) {
      return NextResponse.json(
        { error: "Invalid amount. Must be a number greater than 0." },
        { status: 400 }
      );
    }

    const targetUserId = String(body.target_user_id ?? body.user_id ?? auth.user.id);
    const amountPaise = Math.round(amountInr * 100);
    const newBalance = await store.topupBalance(amountPaise, targetUserId);

    await store.logAudit(
      "ADMIN_BALANCE_ADJUSTMENT",
      `Admin ${auth.user.email ?? auth.user.id} credited ₹${amountInr.toFixed(2)} to ${targetUserId}`,
      auth.user.id
    );

    return NextResponse.json({
      success: true,
      user_id: targetUserId,
      added_paise: amountPaise,
      added_inr: amountInr.toFixed(2),
      balance_paise: newBalance,
      balance_inr: (newBalance / 100).toFixed(2),
      message: `Credited ₹${amountInr.toFixed(2)} to ${targetUserId}.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
