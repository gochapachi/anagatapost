import { NextRequest, NextResponse } from "next/server";
import { createCashfreeOrder } from "@/lib/cashfree";
import { inMemoryStore } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      amount_inr,
      letterId,
      customer_id,
      customer_name,
      customer_email,
      customer_phone,
    } = body;

    const amount = Number(amount_inr);
    if (!amount || amount < 10) {
      return NextResponse.json(
        { error: "Minimum payment amount is ₹10" },
        { status: 400 }
      );
    }

    const orderId = `cf_order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const custId = customer_id || "usr_demo";
    const custEmail = customer_email || "customer@anagataitsolutions.in";
    const custPhone = customer_phone || "9876543210";
    const custName = customer_name || "Anagata Customer";

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

    inMemoryStore.logAudit(
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
