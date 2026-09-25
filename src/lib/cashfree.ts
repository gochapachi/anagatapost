import crypto from "crypto";

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || "";
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || "";
const CASHFREE_ENV = (process.env.CASHFREE_ENVIRONMENT || "TEST").toUpperCase();
const CASHFREE_API_VERSION = process.env.CASHFREE_API_VERSION || "2023-08-01";

const BASE_URL =
  CASHFREE_ENV === "PROD"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

export interface CashfreeCustomerDetails {
  customer_id: string;
  customer_email: string;
  customer_phone: string;
  customer_name?: string;
}

export interface CreateOrderParams {
  orderId: string;
  amountInr: number;
  customer: CashfreeCustomerDetails;
  orderNote?: string;
  returnUrl?: string;
  notifyUrl?: string;
}

export interface CashfreeOrderResult {
  success: boolean;
  orderId: string;
  paymentSessionId?: string;
  orderStatus?: string;
  simulated?: boolean;
  error?: string;
}

/**
 * Checks if live/sandbox Cashfree credentials are provided.
 */
export function isCashfreeConfigured(): boolean {
  return Boolean(CASHFREE_APP_ID && CASHFREE_SECRET_KEY);
}

/**
 * Create a new payment order in Cashfree PG
 */
export async function createCashfreeOrder(
  params: CreateOrderParams
): Promise<CashfreeOrderResult> {
  if (!isCashfreeConfigured()) {
    // Graceful simulation mode for instant sandbox testing if API keys are yet to be entered
    const simulatedSessionId = `sim_session_${Date.now()}_${params.orderId}`;
    return {
      success: true,
      orderId: params.orderId,
      paymentSessionId: simulatedSessionId,
      orderStatus: "ACTIVE",
      simulated: true,
    };
  }

  try {
    const payload = {
      order_id: params.orderId,
      order_amount: Number(params.amountInr.toFixed(2)),
      order_currency: "INR",
      customer_details: {
        customer_id: params.customer.customer_id,
        customer_email: params.customer.customer_email,
        customer_phone: params.customer.customer_phone.replace(/^\+91/, "").replace(/\D/g, "") || "9876543210",
        customer_name: params.customer.customer_name || "Anagata Customer",
      },
      order_meta: {
        return_url:
          params.returnUrl ||
          `${process.env.NEXT_PUBLIC_APP_URL || "https://post.anagataitsolutions.in"}/dashboard/billing?order_id={order_id}`,
        notify_url:
          params.notifyUrl ||
          `${process.env.NEXT_PUBLIC_APP_URL || "https://post.anagataitsolutions.in"}/api/v1/payments/cashfree/webhook`,
      },
      order_note: params.orderNote || "AnagataPost Physical Mail Service",
    };

    const response = await fetch(`${BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": CASHFREE_API_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Cashfree API Error]", data);
      return {
        success: false,
        orderId: params.orderId,
        error: data.message || `Cashfree API responded with status ${response.status}`,
      };
    }

    return {
      success: true,
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      orderStatus: data.order_status,
      simulated: false,
    };
  } catch (error: any) {
    console.error("[Cashfree Exception]", error);
    return {
      success: false,
      orderId: params.orderId,
      error: error.message || "Failed to communicate with Cashfree",
    };
  }
}

/**
 * Verify Cashfree Webhook signature
 */
export function verifyCashfreeWebhookSignature(
  rawBody: string,
  signature: string,
  timestamp?: string
): boolean {
  if (!isCashfreeConfigured()) {
    // If running in development/simulation, accept simulation tokens
    return true;
  }

  try {
    const dataToSign = timestamp ? `${timestamp}${rawBody}` : rawBody;
    const expectedSignature = crypto
      .createHmac("sha256", CASHFREE_SECRET_KEY)
      .update(dataToSign)
      .digest("base64");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (err) {
    console.error("[Cashfree Signature Verification Failed]", err);
    return false;
  }
}

/**
 * Fetch Order Status from Cashfree
 */
export async function getCashfreeOrderStatus(orderId: string): Promise<any> {
  if (!isCashfreeConfigured()) {
    return {
      order_id: orderId,
      order_status: "PAID",
      simulated: true,
    };
  }

  try {
    const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
      method: "GET",
      headers: {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": CASHFREE_API_VERSION,
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("[Cashfree Fetch Status Error]", error);
    return null;
  }
}
