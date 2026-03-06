import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await req.json();
  if (!jobId || typeof jobId !== "string") {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  const userRef = adminDb.collection("users").doc(session.user.email);
  const userDoc = await userRef.get();
  const appliedJobs: string[] = userDoc.data()?.appliedJobs || [];

  const alreadyApplied = appliedJobs.includes(jobId);

  if (alreadyApplied) {
    await userRef.update({ appliedJobs: FieldValue.arrayRemove(jobId) });
    return NextResponse.json({ applied: false });
  }

  await userRef.update({ appliedJobs: FieldValue.arrayUnion(jobId) });
  return NextResponse.json({ applied: true });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userDoc = await adminDb
    .collection("users")
    .doc(session.user.email)
    .get();

  const appliedJobIds: string[] = userDoc.data()?.appliedJobs || [];
  return NextResponse.json({ appliedJobIds });
}
