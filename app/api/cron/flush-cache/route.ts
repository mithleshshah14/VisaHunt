import { NextRequest, NextResponse } from "next/server";
import { invalidateCache } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await invalidateCache("jobs:search:*");
  await invalidateCache("jobs:trending:*");
  await invalidateCache("jobs:stats:*");

  return NextResponse.json({ success: true, message: "Cache flushed" });
}
