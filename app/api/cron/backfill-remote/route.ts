import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { isRemoteAnywhere, isLocationRemoteAnywhere } from "@/lib/normalizer";
import { chunk } from "@/lib/utils";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all active jobs
    const snap = await adminDb
      .collection("jobs")
      .where("isActive", "==", true)
      .select("description", "location", "remoteAnywhere")
      .get();

    let updated = 0;
    let alreadyTagged = 0;
    const toUpdate: { id: string }[] = [];

    for (const doc of snap.docs) {
      const data = doc.data();

      // Skip already tagged
      if (data.remoteAnywhere === true) {
        alreadyTagged++;
        continue;
      }

      const desc = data.description || "";
      const loc = data.location || "";

      if (isRemoteAnywhere(desc) || isLocationRemoteAnywhere(loc)) {
        toUpdate.push({ id: doc.id });
      }
    }

    // Batch update
    if (toUpdate.length > 0) {
      const batches = chunk(toUpdate, 250);
      for (const batch of batches) {
        const writeBatch = adminDb.batch();
        for (const item of batch) {
          writeBatch.update(adminDb.collection("jobs").doc(item.id), {
            remoteAnywhere: true,
          });
        }
        await writeBatch.commit();
        updated += batch.length;
      }
    }

    return NextResponse.json({
      success: true,
      totalJobs: snap.size,
      alreadyTagged,
      newlyTagged: updated,
      unchanged: snap.size - alreadyTagged - updated,
    });
  } catch (err) {
    console.error("[Backfill Remote] Error:", err);
    return NextResponse.json(
      { error: "Backfill failed", details: String(err) },
      { status: 500 }
    );
  }
}
