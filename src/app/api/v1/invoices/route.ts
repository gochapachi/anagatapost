import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/db";
import { isStaff, requireSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    // A GST invoice is a tax document: a customer only ever reads their own book.
    const userId = isStaff(auth.user)
      ? searchParams.get("userId") || undefined
      : auth.user.id;
    const invoices = await store.getInvoices(userId);

    const formatted = invoices.map((inv) => ({
      ...inv,
      amountInr: (inv.amountPaise / 100).toFixed(2),
      subtotalInr: (inv.subtotalPaise / 100).toFixed(2),
      cgstInr: (inv.cgstPaise / 100).toFixed(2),
      sgstInr: (inv.sgstPaise / 100).toFixed(2),
      igstInr: (inv.igstPaise / 100).toFixed(2),
      hsnCode: "996812", // Postal & Courier Mail Handling Services HSN Code
      sacDescription: "Postal Services by Registered / Speed Post",
    }));

    return NextResponse.json({ invoices: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
