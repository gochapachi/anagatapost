import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env, isCashfreeConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

const APP_VERSION = process.env.npm_package_version ?? "1.0.0";

function probeDatabase(): Promise<{ ok: boolean; latencyMs: number | null; error?: string }> {
  const started = Date.now();
  // `prisma` is null when DATABASE_URL is absent (the in-memory fallback store).
  if (!prisma) {
    return Promise.resolve({ ok: false, latencyMs: null, error: "DATABASE_URL is not set" });
  }
  const timeout = new Promise<{ ok: false; latencyMs: number; error: string }>((resolve) =>
    setTimeout(() => resolve({ ok: false, latencyMs: Date.now() - started, error: "timeout" }), 2500)
  );
  const query = prisma.$queryRaw`SELECT 1`.then(
    () => ({ ok: true as const, latencyMs: Date.now() - started }),
    (error: unknown) => ({
      ok: false as const,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : "unknown_error",
    })
  );
  return Promise.race([query, timeout]);
}

/**
 * Liveness + readiness probe for Docker/Coolify.
 * 200 = database reachable, 503 = degraded (never report healthy without a DB,
 * because the previous in-memory build reported "healthy" while losing everything).
 */
export async function GET() {
  const db = await probeDatabase();
  const body = {
    status: db.ok ? "ok" : "degraded",
    version: APP_VERSION,
    environment: env.nodeEnv,
    uptime_seconds: Math.round(process.uptime()),
    db: { ok: db.ok, latency_ms: db.latencyMs, ...(db.error ? { error: db.error } : {}) },
    payments: { cashfree_configured: isCashfreeConfigured() },
    auth: {
      session_secret_configured: true,
      admin_email_count: env.adminEmails.length,
    },
  };
  return NextResponse.json(body, { status: db.ok ? 200 : 503 });
}
