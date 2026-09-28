import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

/**
 * Server-side guard for the customer area. `src/middleware.ts` only checks that a
 * session cookie exists; this layout verifies the signature, so a stale or forged
 * cookie cannot render an authenticated shell.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?callbackUrl=%2Fdashboard");
  }

  return <>{children}</>;
}
