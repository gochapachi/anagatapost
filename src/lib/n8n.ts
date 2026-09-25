/**
 * n8n integration for AnagataPost
 * Triggers workflow webhooks on user's n8n instance at https://n8n.anagataitsolutions.in
 */

import { Letter } from "./types";

export interface N8nWebhookEvent {
  event: "letter.created" | "letter.queued" | "letter.printed" | "letter.dispatched" | "letter.delivered";
  timestamp: string;
  letter: Letter;
}

export async function triggerN8nWebhook(event: N8nWebhookEvent["event"], letter: Letter) {
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || "https://n8n.anagataitsolutions.in/webhook/anagatapost-events";

  const payload: N8nWebhookEvent = {
    event,
    timestamp: new Date().toISOString(),
    letter,
  };

  try {
    const res = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-AnagataPost-Event": event,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn(`[n8n Webhook Warning] status ${res.status} returned from ${n8nWebhookUrl}`);
      return { success: false, status: res.status };
    }

    return { success: true };
  } catch (error: any) {
    // Non-blocking log
    console.log(`[n8n Webhook Notification] Event ${event} queued. Webhook URL: ${n8nWebhookUrl}`);
    return { success: false, error: error.message };
  }
}
