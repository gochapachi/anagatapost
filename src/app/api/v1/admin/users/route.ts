import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { Role } from "@/lib/types";

/** Full customer roster (identity fields + balances) — ADMIN only. */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const rawUsers = await store.getAllUsers();
    const letters = await store.getLetters();

    const users = rawUsers.map((u) => {
      const userLetters = letters.filter((l) => l.userId === u.id);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        company: u.company,
        gstin: u.gstin,
        balanceInr: (u.balancePaise / 100).toFixed(2),
        totalLettersSent: userLetters.length,
        createdAt: u.createdAt,
      };
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Role changes and balance minting are the highest-privilege writes — ADMIN only. */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { userId, role, balanceAdjustmentInr } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (role) {
      if (!["USER", "ADMIN", "PRINT_PARTNER"].includes(role)) {
        return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
      }
      await store.updateUserRole(userId, role as Role);
      await store.logAudit(
        "ADMIN_ROLE_CHANGE",
        `Admin ${auth.user.email ?? auth.user.id} updated user ${userId} role to ${role}`,
        auth.user.id
      );
    }

    if (balanceAdjustmentInr !== undefined) {
      const deltaPaise = Math.round(Number(balanceAdjustmentInr) * 100);
      const newBal = await store.adjustUserBalance(userId, deltaPaise);
      await store.logAudit(
        "ADMIN_BALANCE_ADJUSTMENT",
        `Admin ${auth.user.email ?? auth.user.id} adjusted user ${userId} balance by ₹${balanceAdjustmentInr}`,
        auth.user.id
      );
      return NextResponse.json({
        success: true,
        message: "User updated successfully",
        newBalanceInr: newBal !== null ? (newBal / 100).toFixed(2) : undefined,
      });
    }

    return NextResponse.json({ success: true, message: "User updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
