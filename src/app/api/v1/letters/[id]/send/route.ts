import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/db";
import { triggerN8nWebhook } from "@/lib/n8n";
import { requireOwner, requireSession } from "@/lib/session";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const { id } = await context.params;
  const letter = await store.getLetterById(id);

  if (!letter) {
    return NextResponse.json({ error: `Letter not found with ID ${id}` }, { status: 404 });
  }

  const denied = requireOwner(user, letter.userId);
  if (denied) return denied;

  if (letter.status !== "DRAFT") {
    return NextResponse.json(
      { error: `Cannot send letter. Current status is already '${letter.status}'. Only drafts can be sent.` },
      { status: 409 }
    );
  }

  // Charge + queue in one transaction. Two concurrent sends of the same draft can
  // only ever debit once: the second one finds the letter is no longer a draft.
  const result = await store.sendDraftCharged(id, user.id, `Letter to ${letter.recipientName}`);

  if (!result.ok) {
    if (result.reason === "not_found") {
      return NextResponse.json({ error: `Letter not found with ID ${id}` }, { status: 404 });
    }
    if (result.reason === "not_draft") {
      return NextResponse.json(
        { error: `Cannot send letter. Current status is already '${letter.status}'. Only drafts can be sent.` },
        { status: 409 }
      );
    }
    return NextResponse.json(
      {
        error: "Insufficient balance to send letter",
        balance_paise: result.balancePaise,
        letter_cost_paise: letter.costPaise,
        balance_inr: (result.balancePaise / 100).toFixed(2),
        cost_inr: (letter.costPaise / 100).toFixed(2),
      },
      { status: 402 }
    );
  }

  const updated = result.letter ?? letter;
  triggerN8nWebhook("letter.queued", updated);

  return NextResponse.json({
    id: letter.id,
    status: "queued",
    balance_paise: result.balancePaise,
    balance_inr: (result.balancePaise / 100).toFixed(2),
    letter: updated,
  });
}
