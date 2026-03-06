import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

const DEACTIVATE_THRESHOLD = 3; // Auto-deactivate after N reports

export async function POST(req: NextRequest) {
  try {
    const { jobId, reason } = await req.json();

    if (!jobId || typeof jobId !== "string") {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    // Check job exists
    const jobRef = adminDb.collection("jobs").doc(jobId);
    const jobDoc = await jobRef.get();
    if (!jobDoc.exists) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get IP for dedup (one report per IP per job)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    // Store report
    const reportRef = adminDb.collection("jobReports").doc(`${jobId}_${ip.replace(/\./g, "_")}`);
    const existing = await reportRef.get();
    if (existing.exists) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    await reportRef.set({
      jobId,
      reason: reason || "no-visa-sponsorship",
      ip,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Increment report count on job doc
    await jobRef.update({
      noVisaReportCount: FieldValue.increment(1),
    });

    // Check if threshold reached — deactivate the job
    const updated = await jobRef.get();
    const reportCount = updated.data()?.noVisaReportCount || 0;
    if (reportCount >= DEACTIVATE_THRESHOLD) {
      await jobRef.update({
        isActive: false,
        deactivatedReason: "community-reported-no-visa",
      });
    }

    return NextResponse.json({ ok: true, reportCount });
  } catch (error) {
    console.error("[Report Job]", error);
    return NextResponse.json({ error: "Failed to report" }, { status: 500 });
  }
}
