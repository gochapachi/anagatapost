/**
 * Server-side environment configuration.
 *
 * Fail-fast rule: a production container must refuse to boot when a variable
 * that decides *security* (session signing, OAuth host) or *durability*
 * (database) is absent. Silently falling back to a hard-coded signing key — the
 * previous behaviour of `src/lib/auth.ts` — means every deployed instance trusts
 * the same JWTs, and anyone who reads the public repository can mint a session.
 *
 * Import surface is server-only. Anything imported into a client component must
 * use the `publicEnv` export instead.
 */

export const isProduction = process.env.NODE_ENV === "production";

/**
 * `next build` imports every server module with NODE_ENV=production, but the
 * deploy secrets are injected into the running container, not the builder. We
 * therefore only *warn* while building and hard-fail when the server boots.
 */
const isNextBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

/** Dev-only signing key. Never reachable in production (we throw first). */
const DEV_ONLY_NEXTAUTH_SECRET = "anagatapost-dev-only-insecure-secret";

function read(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readList(name: string): string[] {
  return (read(name) ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

const errors: string[] = [];

const nextauthSecret = read("NEXTAUTH_SECRET") ?? read("AUTH_SECRET");
const nextauthUrl = read("NEXTAUTH_URL");
const databaseUrl = read("DATABASE_URL");

if (isProduction) {
  if (!nextauthSecret) {
    errors.push("NEXTAUTH_SECRET is required in production (session signing key).");
  }
  if (!nextauthUrl) {
    // Without a pinned URL, next-auth v4 derives the callback origin from
    // request headers, which lets a spoofed Host/X-Forwarded-Host steer OAuth.
    errors.push("NEXTAUTH_URL is required in production (pins the auth callback origin).");
  }
  if (!databaseUrl) {
    errors.push("DATABASE_URL is required in production (data is otherwise lost on restart).");
  }
  if (errors.length > 0 && !isNextBuildPhase) {
    throw new Error(
      `[env] Refusing to start with an unsafe configuration:\n - ${errors.join("\n - ")}`
    );
  }
  if (errors.length > 0) {
    console.warn(
      `[env] Missing during build (must be set at runtime):\n - ${errors.join("\n - ")}`
    );
  }
}

if (!isProduction && !nextauthSecret) {
  console.warn(
    "[env] NEXTAUTH_SECRET is not set — falling back to an INSECURE dev-only key. Never do this in production."
  );
}

const appUrl = (read("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000").replace(/\/+$/, "");

const cashfreeAppId = read("CASHFREE_APP_ID");
const cashfreeSecretKey = read("CASHFREE_SECRET_KEY");

export const env = {
  isProduction,
  nodeEnv: read("NODE_ENV") ?? "development",
  appUrl,
  /** Empty in local runs without a database; `src/lib/db.ts` owns the client. */
  databaseUrl: databaseUrl ?? "",
  nextauthSecret: nextauthSecret ?? DEV_ONLY_NEXTAUTH_SECRET,
  nextauthUrl,
  /**
   * Email addresses that are always treated as ADMIN. Bootstraps the first
   * operator before a real role table exists (PR-1 moves roles to Postgres).
   */
  adminEmails: readList("ADMIN_EMAILS"),
  cashfree: {
    appId: cashfreeAppId ?? "",
    secretKey: cashfreeSecretKey ?? "",
    // "PROD" selects the live Cashfree endpoint; anything else is sandbox.
    environment: read("CASHFREE_ENVIRONMENT") ?? "TEST",
  },
} as const;

/** True only when real Cashfree credentials exist. */
export function isCashfreeConfigured(): boolean {
  return env.cashfree.appId.length > 0 && env.cashfree.secretKey.length > 0;
}

/**
 * Safe to import from client components. Never add secrets here.
 */
export const publicEnv = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  cashfreeEnvironment: process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT ?? "TEST",
} as const;
