import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { store } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, phone, company, gstin } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await store.findUserByEmail(normalizedEmail);

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await store.createUser({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "USER",
      phone: phone || null,
      company: company || null,
      gstin: gstin ? gstin.toUpperCase().trim() : null,
      balancePaise: 50000, // ₹500 complimentary sign-up credit
    });

    await store.logAudit("USER_REGISTER", `Registered new user ${normalizedEmail}`, newUser.id);

    return NextResponse.json({
      success: true,
      message: "Account created successfully with ₹500 welcome credit.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create account" },
      { status: 500 }
    );
  }
}
