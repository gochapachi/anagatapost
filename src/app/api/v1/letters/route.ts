import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/db";
import { CreateLetterPayload, Letter, DeliveryType, HandwritingFont } from "@/lib/types";
import { validateIndianPincode, lookupPincode } from "@/lib/pincodes";
import { triggerN8nWebhook } from "@/lib/n8n";
import { isStaff, requireSession } from "@/lib/session";

function calculateLetterCost(deliveryType: DeliveryType, colorPrint: boolean): number {
  let basePaise = 9900; // Speed Post default ₹99
  if (deliveryType === "REGISTERED_POST") basePaise = 12900; // ₹129
  if (deliveryType === "STANDARD") basePaise = 4900; // ₹49
  if (colorPrint) basePaise += 2000; // +₹20 for color laser
  return basePaise;
}

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const all = await store.getLetters();
  const letters = isStaff(auth.user)
    ? all
    : all.filter((letter) => letter.userId === auth.user.id);
  return NextResponse.json({ letters, total: letters.length });
}

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  try {
    const body: CreateLetterPayload = await request.json();

    // 1. Validation
    if (!body.recipient || body.recipient.trim().length === 0) {
      return NextResponse.json({ error: "Missing required field: recipient" }, { status: 400 });
    }

    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json({ error: "Missing required field: content" }, { status: 400 });
    }

    if (!body.address || !body.address.street || !body.address.pincode) {
      return NextResponse.json(
        { error: "Missing required address fields: street and 6-digit pincode are mandatory" },
        { status: 400 }
      );
    }

    const cleanPin = body.address.pincode.trim();
    if (!validateIndianPincode(cleanPin)) {
      return NextResponse.json(
        { error: "Invalid Indian PIN code. Must be exactly 6 digits (e.g. 560034, 110001)." },
        { status: 400 }
      );
    }

    // Auto-resolve state & district if missing
    let city = body.address.city?.trim() || "";
    let district = body.address.district?.trim() || "";
    let state = body.address.state?.trim() || "";

    if (!state || !city) {
      const pinInfo = await lookupPincode(cleanPin);
      if (pinInfo) {
        if (!state) state = pinInfo.state;
        if (!district) district = pinInfo.district;
        if (!city) city = pinInfo.postOffice.replace(/(H\.O|S\.O|G\.P\.O\.)/g, "").trim();
      }
    }

    const shouldSendImmediately = body.send !== false;
    const deliveryType: DeliveryType = body.delivery_type || "SPEED_POST";
    const colorPrint = Boolean(body.color);
    const costPaise = calculateLetterCost(deliveryType, colorPrint);

    // Parse handwriting font
    let hwFont: HandwritingFont = "NONE";
    if (typeof body.handwriting === "boolean" && body.handwriting) {
      hwFont = "CAVEAT";
    } else if (typeof body.handwriting === "string") {
      const upper = body.handwriting.toUpperCase() as HandwritingFont;
      if (["CAVEAT", "KALAM", "SACRAMENTO"].includes(upper)) {
        hwFont = upper;
      }
    }

    // 2. Build the letter. The balance check and the debit are deliberately not
    //    done here: `createLetterCharged` performs both in one database
    //    transaction, so a stale read here can no longer spend money twice.
    const letterId = `ltr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const newLetter: Letter = {
      id: letterId,
      userId: user.id,
      recipientName: body.recipient.trim(),
      recipientPhone: body.phone?.trim() || null,
      address: {
        street: body.address.street.trim(),
        locality: body.address.locality?.trim(),
        city: city || "Postal Delivery",
        district: district || undefined,
        state: state || "India",
        pincode: cleanPin,
        country: "IN",
      },
      sender: body.sender || {
        name: "AnagataPost Dispatch Hub",
        street: "Postal Logistics Center",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
      },
      content: body.content,
      handwritingFont: hwFont,
      hasLetterhead: Boolean(body.letterhead),
      letterheadTitle: typeof body.letterhead === "string" ? body.letterhead : undefined,
      colorPrint,
      deliveryType,
      status: shouldSendImmediately ? "QUEUED" : "DRAFT",
      trackingUrl: `/track/${letterId}`,
      costPaise,
      createdAt: nowIso,
      updatedAt: nowIso,
      queuedAt: shouldSendImmediately ? nowIso : null,
    };

    // Charge and persist together. Either the wallet is debited and the letter is
    // queued, or neither happened — the previous version debited first and could
    // lose the money if the insert failed.
    let storedLetter = newLetter;
    let remainingBalance: number;
    if (shouldSendImmediately) {
      const charge = await store.createLetterCharged(
        newLetter,
        `Letter to ${newLetter.recipientName} (${deliveryType})`
      );
      if (!charge.ok) {
        return NextResponse.json(
          {
            error: "Insufficient balance to send letter",
            balance_paise: charge.balancePaise,
            letter_cost_paise: costPaise,
            balance_inr: (charge.balancePaise / 100).toFixed(2),
            cost_inr: (costPaise / 100).toFixed(2),
          },
          { status: 402 }
        );
      }
      storedLetter = charge.letter ?? newLetter;
      remainingBalance = charge.balancePaise;
    } else {
      await store.saveLetter(newLetter);
      remainingBalance = await store.getBalancePaise(user.id);
    }

    // Trigger n8n webhook asynchronously
    triggerN8nWebhook(shouldSendImmediately ? "letter.queued" : "letter.created", storedLetter);

    return NextResponse.json(
      {
        id: storedLetter.id,
        status: storedLetter.status.toLowerCase(),
        balance_paise: remainingBalance,
        balance_inr: (remainingBalance / 100).toFixed(2),
        cost_inr: (costPaise / 100).toFixed(2),
        tracking_url: storedLetter.trackingUrl,
        letter: storedLetter,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[POST /api/v1/letters Error]", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
