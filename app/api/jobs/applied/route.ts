import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import type { NormalizedJob } from "@/lib/types";

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

  if (appliedJobIds.length === 0) {
    return NextResponse.json({ jobs: [] });
  }

  const refs = appliedJobIds.map((id) => adminDb.collection("jobs").doc(id));
  const snapshots = await adminDb.getAll(...refs);

  const jobs: NormalizedJob[] = snapshots
    .filter((snap) => snap.exists)
    .map((snap) => ({ id: snap.id, ...snap.data() } as NormalizedJob));

  return NextResponse.json({ jobs });
}
