import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }

    const { jobId, reason } = await req.json();
    if (!jobId || typeof jobId !== "string") {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    const jobRef = adminDb.collection("jobs").doc(jobId);
    const jobDoc = await jobRef.get();
    if (!jobDoc.exists) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Store the report for audit
    const reportRef = adminDb.collection("jobReports").doc(`${jobId}_${session.user.email}`);
    await reportRef.set({
      jobId,
      reason: reason || "no-visa-sponsorship",
      reportedBy: session.user.email,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Immediately deactivate the job
    await jobRef.update({
      isActive: false,
      deactivatedReason: "user-reported-no-visa",
      deactivatedBy: session.user.email,
      deactivatedAt: FieldValue.serverTimestamp(),
      noVisaReportCount: FieldValue.increment(1),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Report Job]", error);
    return NextResponse.json({ error: "Failed to report" }, { status: 500 });
  }
}
