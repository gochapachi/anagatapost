import { NextRequest, NextResponse } from "next/server";
import { inMemoryStore } from "@/lib/db";
import { triggerN8nWebhook } from "@/lib/n8n";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const letter = await inMemoryStore.getLetterById(id);

  if (!letter) {
    return NextResponse.json({ error: `Letter not found with ID ${id}` }, { status: 404 });
  }

  if (letter.status !== "DRAFT") {
    return NextResponse.json(
      { error: `Cannot send letter. Current status is already '${letter.status}'. Only drafts can be sent.` },
      { status: 409 }
    );
  }

  const currentBalance = await inMemoryStore.getBalancePaise();
  if (currentBalance < letter.costPaise) {
    return NextResponse.json(
      {
        error: "Insufficient balance to send letter",
        balance_paise: currentBalance,
        letter_cost_paise: letter.costPaise,
        balance_inr: (currentBalance / 100).toFixed(2),
        cost_inr: (letter.costPaise / 100).toFixed(2),
      },
      { status: 402 }
    );
  }

  await inMemoryStore.deductBalance(letter.costPaise);
  const nowIso = new Date().toISOString();

  const updated = await inMemoryStore.updateLetter(id, {
    status: "QUEUED",
    queuedAt: nowIso,
  });

  if (updated) {
    triggerN8nWebhook("letter.queued", updated);
  }

  const remainingBalance = await inMemoryStore.getBalancePaise();

  return NextResponse.json({
    id: letter.id,
    status: "queued",
    balance_paise: remainingBalance,
    balance_inr: (remainingBalance / 100).toFixed(2),
    letter: updated,
  });
}
