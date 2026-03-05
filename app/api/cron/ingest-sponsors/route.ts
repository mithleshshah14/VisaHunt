import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { normalizeCompanyName } from "@/lib/normalizer";
import { chunk } from "@/lib/utils";
import { invalidateCache } from "@/lib/redis";
import type { Sponsor } from "@/lib/types";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// UK Government Sponsor Register CSV
const UK_SPONSOR_CSV_URL =
  "https://assets.publishing.service.gov.uk/media/register-of-licensed-sponsors/2024-12-19_-_Worker_and_Temporary_Worker.csv";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { uk: 0, errors: [] as string[] };

  try {
    // Ingest UK sponsor register
    const ukSponsors = await fetchUKSponsors();
    results.uk = ukSponsors.length;

    // Batch write to Firestore
    const batches = chunk(ukSponsors, 499);
    for (const batch of batches) {
      const writeBatch = adminDb.batch();
      for (const sponsor of batch) {
        const docRef = adminDb.collection("sponsors").doc(sponsor.id);
        writeBatch.set(docRef, sponsor, { merge: true });
      }
      await writeBatch.commit();
    }

    // Invalidate sponsor caches
    await invalidateCache("sponsor:lookup:*");

    return NextResponse.json({
      success: true,
      sponsors: { uk: results.uk },
      errors: results.errors,
    });
  } catch (err) {
    console.error("[Ingest Sponsors] Fatal error:", err);
    return NextResponse.json(
      { error: "Sponsor ingestion failed", details: String(err) },
      { status: 500 }
    );
  }
}

async function fetchUKSponsors(): Promise<Sponsor[]> {
  try {
    const res = await fetch(UK_SPONSOR_CSV_URL, { next: { revalidate: 0 } });
    if (!res.ok) {
      console.error(`[UK Sponsors] CSV fetch failed: ${res.status}`);
      return [];
    }

    const csvText = await res.text();
    const lines = csvText.split("\n").slice(1); // Skip header
    const sponsors: Sponsor[] = [];
    const now = new Date().toISOString();

    for (const line of lines) {
      if (!line.trim()) continue;

      // CSV columns: Organisation Name, Town/City, County, Type & Rating, Route
      const cols = parseCSVLine(line);
      if (cols.length < 4) continue;

      const companyName = cols[0].trim();
      if (!companyName) continue;

      const normalized = normalizeCompanyName(companyName);
      const id = `${normalized.replace(/\s+/g, "_")}__GB`;

      sponsors.push({
        id,
        companyName,
        companyNormalized: normalized,
        country: "GB",
        registrySource: "UK Government Sponsor Register",
        licenseType: cols[3]?.trim() || "Worker",
        topRoles: [],
        aliases: [],
        lastVerified: now,
      });
    }

    console.log(`[UK Sponsors] Parsed ${sponsors.length} sponsors`);
    return sponsors;
  } catch (err) {
    console.error("[UK Sponsors] Error:", err);
    return [];
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
