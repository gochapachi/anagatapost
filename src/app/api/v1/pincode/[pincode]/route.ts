import { NextRequest, NextResponse } from "next/server";
import { lookupPincode, validateIndianPincode } from "@/lib/pincodes";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ pincode: string }> }
) {
  const { pincode } = await context.params;

  if (!validateIndianPincode(pincode)) {
    return NextResponse.json(
      { error: "Invalid PIN code. Must be a 6-digit Indian postal code starting from 1-9." },
      { status: 400 }
    );
  }

  const info = await lookupPincode(pincode);
  if (!info) {
    return NextResponse.json(
      { error: `Postal details not found for PIN code ${pincode}` },
      { status: 404 }
    );
  }

  return NextResponse.json(info);
}
