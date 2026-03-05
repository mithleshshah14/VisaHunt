import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import type { NormalizedJob } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const doc = await adminDb.collection("jobs").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = doc.data() as NormalizedJob;

    // Fetch similar jobs (same country, limit 4)
    const similarSnap = await adminDb
      .collection("jobs")
      .where("isActive", "==", true)
      .where("country", "==", job.country)
      .where("__name__", "!=", id)
      .orderBy("postedDate", "desc")
      .limit(4)
      .get();

    const similarJobs = similarSnap.docs.map((d) => d.data() as NormalizedJob);

    return NextResponse.json({ job, similarJobs });
  } catch (err) {
    console.error("[Job Detail] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch job", details: String(err) },
      { status: 500 }
    );
  }
}
