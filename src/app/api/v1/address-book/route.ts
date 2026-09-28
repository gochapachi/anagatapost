import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/db";
import { requireSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  try {
    // Address books hold recipient PII and are always scoped to the caller.
    const entries = await store.getAddressBook(auth.user.id);
    return NextResponse.json({ entries });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const {
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

    const saved = await store.saveAddressBookEntry({
      // Ownership always comes from the session.
      userId: auth.user.id,
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

    await store.logAudit("ADDRESS_BOOK_ADDED", `Saved recipient ${recipientName}`, auth.user.id);

    return NextResponse.json({ success: true, entry: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = auth.user.id;

    if (!id) {
      return NextResponse.json({ error: "Address ID is required" }, { status: 400 });
    }

    const deleted = await store.deleteAddressBookEntry(id, userId);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
