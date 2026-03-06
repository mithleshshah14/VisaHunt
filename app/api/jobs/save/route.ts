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
  const savedJobs: string[] = userDoc.data()?.savedJobs || [];

  const alreadySaved = savedJobs.includes(jobId);

  if (alreadySaved) {
    await userRef.update({ savedJobs: FieldValue.arrayRemove(jobId) });
    return NextResponse.json({ saved: false });
  }

  if (savedJobs.length >= 100) {
    return NextResponse.json(
      { error: "Maximum 100 saved jobs reached. Remove some before adding more." },
      { status: 400 }
    );
  }

  await userRef.update({ savedJobs: FieldValue.arrayUnion(jobId) });
  return NextResponse.json({ saved: true });
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

  const savedJobIds: string[] = userDoc.data()?.savedJobs || [];
  return NextResponse.json({ savedJobIds });
}
