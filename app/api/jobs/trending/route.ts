import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getCached, setCache } from "@/lib/redis";
import type { NormalizedJob } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const country = req.nextUrl.searchParams.get("country");
    const cacheKey = `jobs:trending:${country || "all"}`;

    const cached = await getCached<NormalizedJob[]>(cacheKey);
    if (cached) return NextResponse.json({ jobs: cached });

    let query: FirebaseFirestore.Query = adminDb
      .collection("jobs")
      .where("isActive", "==", true)
      .where("verifiedSponsor", "==", true);

    if (country) {
      query = query.where("country", "==", country.toUpperCase());
    }

    const snap = await query
      .orderBy("postedDate", "desc")
      .limit(6)
      .get();

    const jobs = snap.docs.map((d) => d.data() as NormalizedJob);

    await setCache(cacheKey, jobs, 3600); // 1h

    return NextResponse.json({ jobs });
  } catch (err) {
    console.error("[Trending] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
