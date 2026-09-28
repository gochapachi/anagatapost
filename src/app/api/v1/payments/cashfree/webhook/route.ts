import { NextRequest, NextResponse } from "next/server";
import {
  verifyCashfreeWebhookSignature,
  isCashfreeConfigured,
} from "@/lib/cashfree";
import { store } from "@/lib/db";
import { isProduction } from "@/lib/env";

/** Maximum tolerated gap between the webhook timestamp and the server clock. */
const MAX_WEBHOOK_SKEW_SECONDS = 300;

/**
 * Cashfree delivers webhooks at-least-once. Idempotency is no longer handled in
 * this process: `store.settlePaidOrder` claims the order id in the `PaymentEvent`
 * table (unique index), so a retried delivery is a no-op even after a restart.
 * PR-0 used an in-memory array here, which lost the record on every deploy.
 */

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature")?.trim() ?? "";
    const timestamp = req.headers.get("x-webhook-timestamp")?.trim() ?? "";

    if (!signature || !timestamp) {
      // `verifyCashfreeWebhookSignature` returns true while unconfigured (it is
      // the simulation path). Never let an unsigned request reach the credit code.
      console.warn("[Cashfree Webhook] Rejected: missing signature or timestamp header");
      return NextResponse.json(
        { error: "Missing webhook signature or timestamp" },
        { status: 401 }
      );
    }

    const skew = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
    if (!Number.isFinite(skew) || skew > MAX_WEBHOOK_SKEW_SECONDS) {
      console.warn(`[Cashfree Webhook] Rejected: timestamp outside replay window (${timestamp})`);
      return NextResponse.json(
        { error: "Webhook timestamp outside replay window" },
        { status: 400 }
      );
    }

    const isValid = verifyCashfreeWebhookSignature(rawBody, signature, timestamp);
    if (!isValid) {
      console.warn("[Cashfree Webhook] Invalid signature received");
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    if (!isCashfreeConfigured() && isProduction) {
      // env.ts already refuses to boot in this state; this is the last gate before
      // money moves, so it does not rely on the check upstream having happened.
      console.error("[Cashfree Webhook] Rejected: payments unconfigured in production");
      return NextResponse.json(
        { error: "Payments are not configured." },
        { status: 503 }
      );
    }

    const payload = JSON.parse(rawBody || "{}");
    const eventType = payload.type || payload.event;
    const orderData = payload.data?.order || payload.order || {};
    const paymentData = payload.data?.payment || payload.payment || {};

    const orderId = String(orderData.order_id || payload.orderId || "");
    const orderAmount = Number(orderData.order_amount || paymentData.payment_amount || 0);

    console.log(`[Cashfree Webhook Event] ${eventType} for order ${orderId} (₹${orderAmount})`);

    if (
      eventType === "PAYMENT_SUCCESS_WEBHOOK" ||
      eventType === "ORDER_PAID_SUCCESS" ||
      paymentData.payment_status === "SUCCESS"
    ) {
      const amountPaise = Math.round(orderAmount * 100);
      // The payer is the session user the order was created for. The old code
      // fell back to a shared demo account, so one payer's top-up funded every
      // account; an order without a customer id is refused instead.
      const customerId = orderData.customer_details?.customer_id;

      if (!orderId || !customerId || !Number.isFinite(amountPaise) || amountPaise <= 0) {
        console.error(
          `[Cashfree Webhook] Unusable success event (order=${orderId}, customer=${customerId}, amount=${orderAmount}) — nothing credited`
        );
        // 200 so Cashfree stops retrying something we will never accept.
        return NextResponse.json({ status: "IGNORED", reason: "incomplete_event" });
      }

      // `cf_order_…_ltr_<id>` means the order paid for one letter; otherwise it
      // is a wallet top-up.
      const letterId = orderId.includes("_ltr_")
        ? orderId.match(/ltr_[a-z0-9_]+/i)?.[0] ?? null
        : null;

      const settlement = await store.settlePaidOrder({
        orderId,
        userId: String(customerId),
        amountPaise,
        eventType: String(eventType ?? "PAYMENT_SUCCESS_WEBHOOK"),
        payload: rawBody || "{}",
        letterId,
      });

      await store.logAudit(
        "CASHFREE_WEBHOOK_PROCESSED",
        settlement.duplicate
          ? `Duplicate delivery ignored for order ${orderId}`
          : `Webhook verified: payment received ₹${orderAmount} for order ${orderId}`,
        String(customerId)
      );

      return NextResponse.json({
        status: "OK",
        received: true,
        duplicate: settlement.duplicate,
        invoice_number: settlement.invoiceNumber,
      });
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
