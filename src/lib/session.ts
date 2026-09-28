/**
 * Server-only authorization helpers.
 *
 * These are the authoritative access-control checks for every route handler and
 * protected page layout. `src/middleware.ts` only does a cheap cookie-presence
 * check for UX; a forged or expired cookie therefore stops here (or in a page
 * layout) with a 401/403, never further into the app.
 */
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";
import { env } from "./env";
import { Role } from "./types";

export type SessionUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  company: string | null;
  gstin: string | null;
};

type AuthSuccess = { ok: true; user: SessionUser };
type AuthFailure = { ok: false; response: NextResponse };
export type AuthResult = AuthSuccess | AuthFailure;

/**
 * Resolve the signed-in user, or null when the request is anonymous.
 *
 * `ADMIN_EMAILS` overrides the stored role so that the very first operator can
 * be promoted without a working user table (PR-1 moves roles into Postgres).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string | number } | undefined)?.id;
  if (!session || id === undefined || id === null || id === "") return null;

  const email = session.user?.email ? session.user.email.toLowerCase().trim() : null;
  const storedRole = ((session.user as { role?: Role })?.role ?? "USER") as Role;
  const role: Role =
    email !== null && env.adminEmails.includes(email) ? "ADMIN" : storedRole;

  return {
    id: String(id),
    name: session.user?.name ?? null,
    email,
    role,
    company: (session.user as { company?: string | null })?.company ?? null,
    gstin: (session.user as { gstin?: string | null })?.gstin ?? null,
  };
}

function unauthorized(): NextResponse {
  return NextResponse.json(
    {
      error: "authentication_required",
      message: "Sign in to call this endpoint.",
    },
    { status: 401, headers: { "WWW-Authenticate": "Session" } }
  );
}

function forbidden(code: string, message: string): NextResponse {
  return NextResponse.json({ error: code, message }, { status: 403 });
}

/** Any signed-in user. */
export async function requireSession(): Promise<AuthResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, response: unauthorized() };
  return { ok: true, user };
}

/** ADMIN only — money movement, user administration, business-wide analytics. */
export async function requireAdmin(): Promise<AuthResult> {
  const result = await requireSession();
  if (!result.ok) return result;
  if (result.user.role !== "ADMIN") {
    return {
      ok: false,
      response: forbidden("admin_required", "This operation requires an admin account."),
    };
  }
  return result;
}

/** ADMIN or PRINT_PARTNER — the fulfilment queue. */
export async function requireStaff(): Promise<AuthResult> {
  const result = await requireSession();
  if (!result.ok) return result;
  if (result.user.role !== "ADMIN" && result.user.role !== "PRINT_PARTNER") {
    return {
      ok: false,
      response: forbidden("staff_required", "This operation requires a print-partner or admin account."),
    };
  }
  return result;
}

export function isStaff(user: SessionUser): boolean {
  return user.role === "ADMIN" || user.role === "PRINT_PARTNER";
}

/**
 * Ownership gate: only the owner, or staff, may touch a resource belonging to
 * `ownerUserId`.
 */
export function requireOwner(user: SessionUser, ownerUserId: string | null | undefined): NextResponse | null {
  if (ownerUserId === user.id || isStaff(user)) return null;
  return forbidden("forbidden", "You do not have access to this resource.");
}
