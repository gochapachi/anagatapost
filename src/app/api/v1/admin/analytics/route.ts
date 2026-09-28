import { NextResponse } from "next/server";
import { store } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

/** Business-wide analytics (revenue, customer counts) — ADMIN only. */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const analytics = await store.getAnalyticsData();
    return NextResponse.json({ success: true, ...analytics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
