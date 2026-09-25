import { NextRequest, NextResponse } from "next/server";
import { inMemoryStore } from "@/lib/db";

export async function GET() {
  const balancePaise = await inMemoryStore.getBalancePaise();
  return NextResponse.json({
    balance_paise: balancePaise,
    balance_inr: (balancePaise / 100).toFixed(2),
    currency: "INR",
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const amountInr = Number(body.amount_inr || 500);

    if (isNaN(amountInr) || amountInr <= 0) {
      return NextResponse.json({ error: "Invalid amount. Must be greater than 0." }, { status: 400 });
    }

    const amountPaise = Math.round(amountInr * 100);
    const newBalance = await inMemoryStore.topupBalance(amountPaise);

    return NextResponse.json({
      success: true,
      added_paise: amountPaise,
      added_inr: amountInr.toFixed(2),
      balance_paise: newBalance,
      balance_inr: (newBalance / 100).toFixed(2),
      message: `Successfully topped up ₹${amountInr.toFixed(2)} to AnagataPost balance.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
