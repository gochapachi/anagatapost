import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/db";
import { Letter } from "@/lib/types";
import { getSessionUser, requireOwner, requireSession } from "@/lib/session";

/**
 * `/track/{id}` resolves a letter by ID alone, so the anonymous response carries
 * only tracking facts. Letter body, recipient phone, house street/locality and
 * sender identity never leave the server to an anonymous caller.
 */
function redactForTracking(letter: Letter): Record<string, unknown> {
  return {
    id: letter.id,
    status: letter.status,
    recipientName: letter.recipientName,
    address: {
      city: letter.address.city,
      state: letter.address.state,
      pincode: letter.address.pincode,
      country: "IN",
    },
    deliveryType: letter.deliveryType,
    consignmentNumber: letter.consignmentNumber ?? null,
    trackingUrl: letter.trackingUrl,
    createdAt: letter.createdAt,
    queuedAt: letter.queuedAt ?? null,
    printedAt: letter.printedAt ?? null,
    dispatchedAt: letter.dispatchedAt ?? null,
    deliveredAt: letter.deliveredAt ?? null,
    updatedAt: letter.updatedAt,
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const letter = await store.getLetterById(id);

  if (!letter) {
    return NextResponse.json({ error: `Letter not found with ID ${id}` }, { status: 404 });
  }

  // Anonymous callers get the tracking projection; the owner and staff get the
  // full record (the print sheet needs content, sender and phone).
  const viewer = await getSessionUser();
  if (viewer) {
    const denied = requireOwner(viewer, letter.userId);
    if (denied) return denied;
  }

  // Construct status timeline milestones
  const milestones = [
    {
      title: "Letter Created",
      timestamp: letter.createdAt,
      completed: true,
      description: "Order received in AnagataPost system",
    },
    {
      title: "Queued for Print Hub",
      timestamp: letter.queuedAt || null,
      completed: ["QUEUED", "PRINTED", "IN_TRANSIT", "DELIVERED"].includes(letter.status),
      description: "Assigned to regional print & packaging facility",
    },
    {
      title: "Printed & Stamped",
      timestamp: letter.printedAt || null,
      completed: ["PRINTED", "IN_TRANSIT", "DELIVERED"].includes(letter.status),
      description: "High-grade 100 GSM paper laser print & tamper-proof envelope sealed",
    },
    {
      title: "Dispatched via India Post",
      timestamp: letter.dispatchedAt || null,
      completed: ["IN_TRANSIT", "DELIVERED"].includes(letter.status),
      description: letter.consignmentNumber
        ? `Handed to India Post Speed Post. Consignment: ${letter.consignmentNumber}`
        : "Handed over to postal carrier",
    },
    {
      title: "Delivered to Recipient",
      timestamp: letter.deliveredAt || null,
      completed: letter.status === "DELIVERED",
      description: `Physical delivery confirmed at destination (${letter.address.city}, ${letter.address.pincode})`,
    },
  ];

  const payload = viewer ? letter : redactForTracking(letter);
  return NextResponse.json({
    letter: payload,
    milestones,
    ...(viewer ? {} : { privacy: "tracking" }),
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const existing = await store.getLetterById(id);

  if (!existing) {
    return NextResponse.json({ error: `Letter not found with ID ${id}` }, { status: 404 });
  }

  const denied = requireOwner(auth.user, existing.userId);
  if (denied) return denied;

  if (existing.status !== "DRAFT") {
    return NextResponse.json(
      { error: `Cannot modify letter with status '${existing.status}'. Only DRAFT letters can be edited.` },
      { status: 409 }
    );
  }

  const body = await request.json();
  const updates: Partial<Letter> = {};

  if (body.recipient) updates.recipientName = body.recipient.trim();
  if (body.phone !== undefined) updates.recipientPhone = body.phone;
  if (body.content) updates.content = body.content;
  if (body.handwritingFont) updates.handwritingFont = body.handwritingFont;
  if (body.colorPrint !== undefined) updates.colorPrint = Boolean(body.colorPrint);
  if (body.deliveryType) updates.deliveryType = body.deliveryType;

  if (body.address) {
    updates.address = {
      ...existing.address,
      ...body.address,
    };
  }

  if (body.sender) {
    updates.sender = {
      ...existing.sender,
      ...body.sender,
    };
  }

  const updated = await store.updateLetter(id, updates);
  return NextResponse.json({ letter: updated });
}
