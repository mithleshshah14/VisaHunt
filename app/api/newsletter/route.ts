import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const emailHash = crypto
      .createHash("sha256")
      .update(email.toLowerCase().trim())
      .digest("hex");

    await adminDb
      .collection("newsletter")
      .doc(emailHash)
      .set(
        {
          email: email.toLowerCase().trim(),
          subscribedAt: new Date().toISOString(),
          isActive: true,
        },
        { merge: true }
      );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Newsletter] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
