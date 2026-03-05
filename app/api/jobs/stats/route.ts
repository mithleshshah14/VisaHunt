import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getCached, setCache } from "@/lib/redis";
import type { GlobalStats } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const cached = await getCached<GlobalStats>("jobs:stats:global");
    if (cached) return NextResponse.json(cached);

    const doc = await adminDb.collection("stats").doc("global").get();

    if (!doc.exists) {
      const fallback: GlobalStats = {
        totalJobs: 0,
        totalSponsors: 0,
        countriesCount: 0,
        lastUpdated: new Date().toISOString(),
        jobsByCountry: {},
      };
      return NextResponse.json(fallback);
    }

    const stats = doc.data() as GlobalStats;
    await setCache("jobs:stats:global", stats, 900); // 15 min

    return NextResponse.json(stats);
  } catch (err) {
    console.error("[Stats] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
