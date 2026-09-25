import { NextRequest, NextResponse } from "next/server";
import { inMemoryStore } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "usr_demo";
    const entries = await inMemoryStore.getAddressBook(userId);
    return NextResponse.json({ entries });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId = "usr_demo",
      label,
      recipientName,
      recipientPhone,
      recipientStreet,
      recipientLocality,
      recipientCity,
      recipientDistrict,
      recipientState,
      recipientPincode,
      isDefault,
    } = body;

    if (!recipientName || !recipientStreet || !recipientCity || !recipientState || !recipientPincode) {
      return NextResponse.json(
        { error: "Recipient name, street, city, state, and 6-digit PIN code are required." },
        { status: 400 }
      );
    }

    const saved = await inMemoryStore.saveAddressBookEntry({
      userId,
      label: label || "Office",
      recipientName,
      recipientPhone: recipientPhone || null,
      recipientStreet,
      recipientLocality: recipientLocality || null,
      recipientCity,
      recipientDistrict: recipientDistrict || null,
      recipientState,
      recipientPincode,
      isDefault: Boolean(isDefault),
    });

    inMemoryStore.logAudit("ADDRESS_BOOK_ADDED", `Saved recipient ${recipientName}`, userId);

    return NextResponse.json({ success: true, entry: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId") || "usr_demo";

    if (!id) {
      return NextResponse.json({ error: "Address ID is required" }, { status: 400 });
    }

    const deleted = await inMemoryStore.deleteAddressBookEntry(id, userId);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
