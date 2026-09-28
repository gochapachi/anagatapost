import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/db";
import { requireStaff } from "@/lib/session";

/** Print queue exposes every customer's letter — ADMIN or PRINT_PARTNER only. */
export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;

  try {
    const letters = await store.getLetters();
    const queued = letters.filter((l) => l.status === "QUEUED");
    return NextResponse.json({ queued, count: queued.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { letterIds } = body;

    if (!Array.isArray(letterIds) || letterIds.length === 0) {
      return NextResponse.json({ error: "Array of letter IDs required" }, { status: 400 });
    }

    const updated = [];
    for (const id of letterIds) {
      const res = await store.updateLetter(id, {
        status: "PRINTED",
        printedAt: new Date().toISOString(),
      });
      if (res) updated.push(res);
    }

    await store.logAudit(
      "BATCH_PRINT_COMPLETED",
      `${auth.user.role} ${auth.user.email ?? auth.user.id} batch printed ${updated.length} letters`,
      auth.user.id
    );

    return NextResponse.json({
      success: true,
      printedCount: updated.length,
      letters: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
