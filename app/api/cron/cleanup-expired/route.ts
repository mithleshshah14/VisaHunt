import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { chunk } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date().toISOString();

    // Find expired jobs (single field query to avoid needing composite index)
    const expiredSnap = await adminDb
      .collection("jobs")
      .where("expiresAt", "<", now)
      .limit(2000)
      .get();

    if (expiredSnap.empty) {
      return NextResponse.json({ success: true, deactivated: 0 });
    }

    // Mark as inactive (soft delete)
    const batches = chunk(expiredSnap.docs, 499);
    let deactivated = 0;

    for (const batch of batches) {
      const writeBatch = adminDb.batch();
      for (const doc of batch) {
        writeBatch.update(doc.ref, { isActive: false, updatedAt: now });
        deactivated++;
      }
      await writeBatch.commit();
    }

    return NextResponse.json({ success: true, deactivated });
  } catch (err) {
    console.error("[Cleanup] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
