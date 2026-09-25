import { NextRequest, NextResponse } from "next/server";
import { inMemoryStore } from "@/lib/db";
import { LetterStatus } from "@/lib/types";
import { sendDispatchWhatsAppNotification } from "@/lib/evolution-api";
import { triggerN8nWebhook } from "@/lib/n8n";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { letterId, status, consignmentNumber } = body;

    if (!letterId || !status) {
      return NextResponse.json({ error: "letterId and status are required" }, { status: 400 });
    }

    const letter = await inMemoryStore.getLetterById(letterId);
    if (!letter) {
      return NextResponse.json({ error: `Letter not found: ${letterId}` }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    const updates: any = {
      status: status as LetterStatus,
    };

    if (status === "PRINTED") {
      updates.printedAt = nowIso;
    } else if (status === "IN_TRANSIT") {
      updates.dispatchedAt = nowIso;
      if (consignmentNumber) {
        updates.consignmentNumber = consignmentNumber.trim();
      } else if (!letter.consignmentNumber) {
        // Auto-generate Speed Post EMS consignment if not provided
        const randNum = Math.floor(100000000 + Math.random() * 900000000);
        updates.consignmentNumber = `ED${randNum}IN`;
      }
    } else if (status === "DELIVERED") {
      updates.deliveredAt = nowIso;
    }

    const updated = await inMemoryStore.updateLetter(letterId, updates);
    if (!updated) {
      return NextResponse.json({ error: "Failed to update letter" }, { status: 500 });
    }

    let whatsappResult = null;

    // If dispatched and recipient phone is present, trigger Evolution API WhatsApp alert!
    if (status === "IN_TRANSIT" && updated.recipientPhone) {
      whatsappResult = await sendDispatchWhatsAppNotification({
        phone: updated.recipientPhone,
        recipientName: updated.recipientName,
        letterId: updated.id,
        consignmentNumber: updated.consignmentNumber || "ED100000000IN",
        city: updated.address.city,
        state: updated.address.state,
        pincode: updated.address.pincode,
        trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://post.anagataitsolutions.in"}/track/${updated.id}`,
      });
    }

    // Trigger n8n webhook
    if (status === "IN_TRANSIT") {
      triggerN8nWebhook("letter.dispatched", updated);
    } else if (status === "DELIVERED") {
      triggerN8nWebhook("letter.delivered", updated);
    } else if (status === "PRINTED") {
      triggerN8nWebhook("letter.printed", updated);
    }

    return NextResponse.json({
      success: true,
      letter: updated,
      whatsapp: whatsappResult,
    });
  } catch (error: any) {
    console.error("[Fulfill Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
