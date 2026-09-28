import { NextRequest, NextResponse } from "next/server";
import { createCashfreeOrder } from "@/lib/cashfree";
import { store } from "@/lib/db";
import { env, isCashfreeConfigured } from "@/lib/env";
import { requireSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  // A production deployment must never fall back to a simulated payment session.
  if (env.isProduction && !isCashfreeConfigured()) {
    return NextResponse.json(
      {
        error: "payments_unavailable",
        message: "The payment provider is not configured on this deployment.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { amount_inr, letterId, customer_phone } = body;

    const amount = Number(amount_inr);
    if (!amount || amount < 10) {
      return NextResponse.json(
        { error: "Minimum payment amount is ₹10" },
        { status: 400 }
      );
    }

    const orderId = `cf_order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    // Payer identity always comes from the session — a caller cannot push a
    // charge onto someone else's account by spoofing customer_id.
    const user = auth.user;
    const custId = user.id;
    const custEmail = user.email || "customer@anagataitsolutions.in";
    const custName = user.name || "Anagata Customer";
    // Cashfree accepts only a 10-digit Indian mobile; PR-1 moves this to the profile.
    const custPhone = String(customer_phone || "9876543210").replace(/\D/g, "").slice(-10);

    const orderNote = letterId
      ? `Letter Postage Dispatch (${letterId})`
      : `AnagataPost Wallet Recharge (₹${amount})`;

    const result = await createCashfreeOrder({
      orderId,
      amountInr: amount,
      customer: {
        customer_id: custId,
        customer_email: custEmail,
        customer_phone: custPhone,
        customer_name: custName,
      },
      orderNote,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to initialize Cashfree order" },
        { status: 502 }
      );
    }

    await store.logAudit(
      "PAYMENT_ORDER_CREATED",
      `Created Cashfree order ${orderId} for ₹${amount}`,
      custId
    );

    return NextResponse.json({
      success: true,
      order_id: result.orderId,
      payment_session_id: result.paymentSessionId,
      order_status: result.orderStatus || "ACTIVE",
      amount_inr: amount,
      simulated: result.simulated,
    });
  } catch (error: any) {
    console.error("Cashfree Order Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
