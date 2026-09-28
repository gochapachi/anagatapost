/**
 * The one place that decides where the app's data lives.
 *
 * Routes import `store` from here and never touch Prisma or the in-memory maps
 * directly, so the implementation can change without touching a handler:
 *
 * - `DATABASE_URL` set (always true in production — `src/lib/env.ts` refuses to
 *   boot without it) → `PostgresStore`, where money moves inside transactions
 *   and `PaymentEvent` makes webhook settlement exactly-once.
 * - no `DATABASE_URL` → the legacy in-memory store, so a fresh clone runs
 *   without a database. It loses everything on restart, so it is never the
 *   right answer for a deployment.
 */
import { memoryStore } from "./data/memory";
import { postgresStore } from "./data/postgres";
import type { Store } from "./data/types";
import { hasDatabase } from "./prisma";

export const store: Store = hasDatabase ? postgresStore : memoryStore;

if (!hasDatabase) {
  console.warn(
    "[db] DATABASE_URL is not set — using the in-memory store. " +
      "All data is lost on restart; set DATABASE_URL and run `npx prisma migrate deploy`."
  );
}

/** Re-exported for the health probe. Null when no database is configured. */
export { prisma } from "./prisma";
