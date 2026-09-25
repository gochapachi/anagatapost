import { NextRequest, NextResponse } from "next/server";
import { inMemoryStore } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || undefined;
    const invoices = await inMemoryStore.getInvoices(userId);

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
