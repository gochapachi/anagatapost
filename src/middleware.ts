/**
 * Edge middleware — the cheap first line of defence, not the security boundary.
 *
 * It only asks "is a session cookie present?". That is enough to stop anonymous
 * scrapers from reading customer data and to keep signed-out users from flashing
 * protected pages, without depending on JWT signature verification inside the
 * Edge runtime (next-auth v4's `getToken()` is fragile against Next's
 * `NextRequest` cookie object).
 *
 * A forged or expired cookie therefore gets exactly one request deeper and is
 * rejected there by `src/lib/session.ts` (route handlers) or the protected page
 * layouts, which verify the session server-side.
 */
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "__Host-next-auth.session-token",
];

/**
 * Endpoints that stay anonymous on purpose:
 * - the Cashfree webhook is authenticated by its HMAC signature, never by cookie
 * - pincode lookup powers the public pricing/send forms
 * - GET /api/v1/letters/{id} is the public tracking link; that handler returns a
 *   redacted payload (no letter body, no phone, no street) to anonymous callers
 */
function isPublicApiRequest(pathname: string, method: string): boolean {
  if (pathname === "/api/v1/payments/cashfree/webhook") return true;
  if (method === "GET" && pathname.startsWith("/api/v1/pincode/")) return true;
  if (method === "GET" && /^\/api\/v1\/letters\/[^/]+$/.test(pathname)) return true;
  return false;
}

function hasSessionCookie(req: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) => Boolean(req.cookies.get(name)?.value));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authenticated = hasSessionCookie(req);

  if (pathname.startsWith("/api/")) {
    if (isPublicApiRequest(pathname, req.method) || authenticated) {
      return NextResponse.next();
    }
    return NextResponse.json(
      {
        error: "authentication_required",
        message: "Sign in to call this endpoint.",
      },
      { status: 401, headers: { "WWW-Authenticate": "Session" } }
    );
  }

  if (!authenticated) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("callbackUrl", `${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/v1/:path*",
    "/admin",
    "/admin/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/send",
    "/send/:path*",
    "/letters/:path*",
  ],
};
