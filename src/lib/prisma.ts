import { PrismaClient } from "@prisma/client";

/**
 * A single lazily-created Prisma client.
 *
 * The client is only constructed when `DATABASE_URL` is present. Without that
 * guard, importing this module on a laptop with no `.env` threw while Next.js
 * was still loading the route module, which made the failure look like a
 * routing bug instead of a missing environment variable.
 */
declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const hasDatabase: boolean = Boolean(
  process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0
);

function buildClient(): PrismaClient | null {
  if (!hasDatabase) return null;
  return (
    globalThis.prismaGlobal ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    })
  );
}

export const prisma: PrismaClient | null = buildClient();

if (prisma && process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

/** The client, or a clear error. Use this everywhere money or data is written. */
export function getDb(): PrismaClient {
  if (!prisma) {
    throw new Error(
      "DATABASE_URL is not set — the Postgres data layer cannot be used. " +
        "Run `docker compose up -d postgres` and add DATABASE_URL to .env."
    );
  }
  return prisma;
}
