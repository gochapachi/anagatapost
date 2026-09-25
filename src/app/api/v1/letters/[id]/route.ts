import { NextRequest, NextResponse } from "next/server";
import { inMemoryStore } from "@/lib/db";
import { Letter } from "@/lib/types";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const letter = await inMemoryStore.getLetterById(id);

  if (!letter) {
    return NextResponse.json({ error: `Letter not found with ID ${id}` }, { status: 404 });
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

  return NextResponse.json({ letter, milestones });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const existing = await inMemoryStore.getLetterById(id);

  if (!existing) {
    return NextResponse.json({ error: `Letter not found with ID ${id}` }, { status: 404 });
  }

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

  const updated = await inMemoryStore.updateLetter(id, updates);
  return NextResponse.json({ letter: updated });
}
