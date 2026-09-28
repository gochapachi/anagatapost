import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

/**
 * Server-side guard for the operator console. The APIs behind it already answer
 * 403 to non-admins; this keeps the console from flashing at all.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?callbackUrl=%2Fadmin");
  }
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
