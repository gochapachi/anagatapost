import { NextResponse } from "next/server";
import { inMemoryStore } from "@/lib/db";

export async function GET() {
  try {
    const analytics = await inMemoryStore.getAnalyticsData();
    return NextResponse.json({ success: true, ...analytics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
