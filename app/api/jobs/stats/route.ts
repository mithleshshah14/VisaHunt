import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getCached, setCache } from "@/lib/redis";
import type { GlobalStats } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const cached = await getCached<GlobalStats>("jobs:stats:global");
    if (cached) return NextResponse.json(cached);

    // Compute live stats from active jobs
    const jobsSnap = await adminDb
      .collection("jobs")
      .where("isActive", "==", true)
      .select("country")
      .limit(10000)
      .get();

    const jobsByCountry: Record<string, number> = {};
    jobsSnap.docs.forEach((doc) => {
      const country = doc.data().country;
      if (country) jobsByCountry[country] = (jobsByCountry[country] || 0) + 1;
    });

    const stats: GlobalStats = {
      totalJobs: jobsSnap.size,
      totalSponsors: 0,
      countriesCount: Object.keys(jobsByCountry).length,
      lastUpdated: new Date().toISOString(),
      jobsByCountry,
    };

    await setCache("jobs:stats:global", stats, 900); // 15 min

    return NextResponse.json(stats, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" },
    });
  } catch (err) {
    console.error("[Stats] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
