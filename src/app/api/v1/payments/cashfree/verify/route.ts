import { NextRequest, NextResponse } from "next/server";
import { getCashfreeOrderStatus } from "@/lib/cashfree";
import { store } from "@/lib/db";
import { env, isCashfreeConfigured } from "@/lib/env";
import { requireOwner, requireSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  const user = auth.user;

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
    // Only the order reference and optional letter are client-supplied. Payer and
    // amount are read back from Cashfree: this endpoint used to credit whatever
    // amount the request body asked for, to whichever user it named.
    const { order_id, letterId } = body;

    if (!order_id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const orderData = await getCashfreeOrderStatus(order_id);
    // `simulated` is the local stand-in used when credentials are absent; it must
    // never authorise real money in production.
    const isPaid =
      orderData?.order_status === "PAID" ||
      orderData?.order_status === "SUCCESS" ||
      (orderData?.simulated === true && !env.isProduction);

    if (!isPaid) {
      return NextResponse.json(
        {
          success: false,
          status: orderData?.order_status || "PENDING",
          message: "Payment has not yet completed or was cancelled.",
        },
        { status: 400 }
      );
    }

    const amount = Number(orderData?.order_amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Order amount could not be confirmed with the payment provider." },
        { status: 400 }
      );
    }
    const amountPaise = Math.round(amount * 100);

    // A letter bought outright must belong to the caller before anything settles.
    if (letterId) {
      const letter = await store.getLetterById(letterId);
      if (!letter) {
        return NextResponse.json({ error: `Letter not found: ${letterId}` }, { status: 404 });
      }
      const denied = requireOwner(user, letter.userId);
      if (denied) return denied;
    }

    // Exactly-once settlement. The store claims the order id first, then credits
    // the wallet (or queues the letter) and issues the invoice in the same
    // transaction — so a double-clicked verify button, or a webhook that got
    // here first, cannot pay the same order twice.
    const settlement = await store.settlePaidOrder({
      orderId: String(order_id),
      userId: user.id,
      amountPaise,
      eventType: "ORDER_VERIFIED",
      payload: JSON.stringify({ order_id, amount_inr: amount, letterId: letterId ?? null, source: "verify" }),
      letterId: letterId ?? null,
      gstin: user.gstin ?? null,
    });

    if (settlement.duplicate) {
      return NextResponse.json({
        success: true,
        order_id,
        status: "PAID",
        amount_inr: amount,
        balance_inr: (settlement.balancePaise / 100).toFixed(2),
        invoice_number: settlement.invoiceNumber,
        already_settled: true,
        message: `Payment of ₹${amount} was already applied to this account.`,
      });
    }

    await store.logAudit(
      letterId ? "LETTER_PAID_CASHFREE" : "WALLET_TOPUP_CASHFREE",
      letterId
        ? `Letter ${letterId} paid via Cashfree order ${order_id} (₹${amount})`
        : `Wallet recharged with ₹${amount} via Cashfree order ${order_id}`,
      user.id
    );

    return NextResponse.json({
      success: true,
      order_id,
      status: "PAID",
      amount_inr: amount,
      balance_inr: (settlement.balancePaise / 100).toFixed(2),
      invoice_number: settlement.invoiceNumber,
      message: `Payment of ₹${amount} verified successfully! GST Tax Invoice ${settlement.invoiceNumber} generated.`,
    });
  } catch (error: any) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}
