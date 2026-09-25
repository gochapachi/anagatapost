import { NextRequest, NextResponse } from "next/server";
import { inMemoryStore } from "@/lib/db";
import { Role } from "@/lib/types";

export async function GET() {
  try {
    const rawUsers = await inMemoryStore.getAllUsers();
    const letters = await inMemoryStore.getLetters();

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

export async function PATCH(req: NextRequest) {
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
      await inMemoryStore.updateUserRole(userId, role as Role);
      inMemoryStore.logAudit("ADMIN_ROLE_CHANGE", `Updated user ${userId} role to ${role}`);
    }

    if (balanceAdjustmentInr !== undefined) {
      const deltaPaise = Math.round(Number(balanceAdjustmentInr) * 100);
      const newBal = await inMemoryStore.adjustUserBalance(userId, deltaPaise);
      inMemoryStore.logAudit(
        "ADMIN_BALANCE_ADJUSTMENT",
        `Adjusted user ${userId} balance by ₹${balanceAdjustmentInr}`
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
