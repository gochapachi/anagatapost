import { NextRequest, NextResponse } from "next/server";
import { getCashfreeOrderStatus } from "@/lib/cashfree";
import { inMemoryStore } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, user_id, amount_inr, letterId } = body;

    if (!order_id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const orderData = await getCashfreeOrderStatus(order_id);
    const isPaid =
      orderData?.order_status === "PAID" ||
      orderData?.order_status === "SUCCESS" ||
      orderData?.simulated === true;

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

    const userId = user_id || "usr_demo";
    const amount = Number(amount_inr || orderData?.order_amount || 500);
    const amountPaise = Math.round(amount * 100);

    // If direct letter payment
    if (letterId) {
      await inMemoryStore.updateLetter(letterId, {
        status: "QUEUED",
        queuedAt: new Date().toISOString(),
      });
      inMemoryStore.logAudit(
        "LETTER_PAID_CASHFREE",
        `Letter ${letterId} paid via Cashfree order ${order_id} (₹${amount})`,
        userId
      );
    } else {
      // Wallet top-up
      await inMemoryStore.topupBalance(amountPaise);
      inMemoryStore.logAudit(
        "WALLET_TOPUP_CASHFREE",
        `Wallet recharged with ₹${amount} via Cashfree order ${order_id}`,
        userId
      );
    }

    // Auto-generate GST 18% Tax Invoice
    const invoice = await inMemoryStore.createTaxInvoice({
      userId,
      totalAmountInr: amount,
      paymentRef: order_id,
      gstin: "29AAAAA0000A1Z5",
    });

    const newBalancePaise = await inMemoryStore.getBalancePaise();

    return NextResponse.json({
      success: true,
      order_id,
      status: "PAID",
      amount_inr: amount,
      balance_inr: (newBalancePaise / 100).toFixed(2),
      invoice_number: invoice.invoiceNumber,
      message: `Payment of ₹${amount} verified successfully! GST Tax Invoice ${invoice.invoiceNumber} generated.`,
    });
  } catch (error: any) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}
