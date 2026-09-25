import { NextRequest, NextResponse } from "next/server";
import { inMemoryStore } from "@/lib/db";

export async function GET() {
  try {
    const letters = await inMemoryStore.getLetters();
    const queued = letters.filter((l) => l.status === "QUEUED");
    return NextResponse.json({ queued, count: queued.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { letterIds } = body;

    if (!Array.isArray(letterIds) || letterIds.length === 0) {
      return NextResponse.json({ error: "Array of letter IDs required" }, { status: 400 });
    }

    const updated = [];
    for (const id of letterIds) {
      const res = await inMemoryStore.updateLetter(id, {
        status: "PRINTED",
        printedAt: new Date().toISOString(),
      });
      if (res) updated.push(res);
    }

    inMemoryStore.logAudit(
      "BATCH_PRINT_COMPLETED",
      `Batch printed ${updated.length} letters`
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
