import { NextRequest, NextResponse } from "next/server";
import { verifyCashfreeWebhookSignature } from "@/lib/cashfree";
import { inMemoryStore } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature") || "";
    const timestamp = req.headers.get("x-webhook-timestamp") || "";

    const isValid = verifyCashfreeWebhookSignature(rawBody, signature, timestamp);
    if (!isValid) {
      console.warn("[Cashfree Webhook] Invalid signature received");
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody || "{}");
    const eventType = payload.type || payload.event;
    const orderData = payload.data?.order || payload.order || {};
    const paymentData = payload.data?.payment || payload.payment || {};

    const orderId = orderData.order_id || payload.orderId;
    const orderAmount = Number(orderData.order_amount || paymentData.payment_amount || 0);
    const customerId = orderData.customer_details?.customer_id || "usr_demo";

    console.log(`[Cashfree Webhook Event] ${eventType} for order ${orderId} (₹${orderAmount})`);

    if (
      eventType === "PAYMENT_SUCCESS_WEBHOOK" ||
      eventType === "ORDER_PAID_SUCCESS" ||
      paymentData.payment_status === "SUCCESS"
    ) {
      const amountPaise = Math.round(orderAmount * 100);

      // Check if this was a letter dispatch or wallet recharge
      if (orderId.includes("_ltr_")) {
        const letterIdMatch = orderId.match(/ltr_[a-z0-9_]+/i);
        if (letterIdMatch) {
          await inMemoryStore.updateLetter(letterIdMatch[0], {
            status: "QUEUED",
            queuedAt: new Date().toISOString(),
          });
        }
      } else {
        await inMemoryStore.topupBalance(amountPaise);
      }

      // Generate GST Tax Invoice
      await inMemoryStore.createTaxInvoice({
        userId: customerId,
        totalAmountInr: orderAmount,
        paymentRef: orderId,
        gstin: "29AAAAA0000A1Z5",
      });

      inMemoryStore.logAudit(
        "CASHFREE_WEBHOOK_PROCESSED",
        `Webhook verified: payment received ₹${orderAmount} for order ${orderId}`,
        customerId
      );
    }

    return NextResponse.json({ status: "OK", received: true });
  } catch (error: any) {
    console.error("[Cashfree Webhook Error]", error);
    return NextResponse.json(
      { error: error.message || "Failed to process webhook" },
      { status: 500 }
    );
  }
}
