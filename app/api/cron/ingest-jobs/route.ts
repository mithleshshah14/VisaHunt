import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { invalidateCache } from "@/lib/redis";
import {
  fetchArbeitnowJobs,
  fetchHimalayasJobs,
  fetchGreenhouseJobs,
  fetchLandingJobs,
} from "@/lib/sources";
import { batchVerifySponsors } from "@/lib/sponsors";
import { getExchangeRates, FALLBACK_RATES } from "@/lib/exchange";
import { generateDedupeKey, normalizeCompanyName } from "@/lib/normalizer";
import { chunk } from "@/lib/utils";
import type { NormalizedJob } from "@/lib/types";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const errors: string[] = [];

  try {
    // Fetch from all sources in parallel
    const results = await Promise.allSettled([
      fetchArbeitnowJobs(),
      fetchHimalayasJobs(10),    // ~200 jobs (10 pages × 20)
      fetchGreenhouseJobs(),      // ~3,000-5,000 jobs from 33 companies (all parallel)
      fetchLandingJobs(),         // ~50 European visa jobs
    ]);

    const sourceNames = ["Arbeitnow", "Himalayas", "Greenhouse", "LandingJobs"];
    const allJobs: NormalizedJob[] = [];

    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        allJobs.push(...result.value);
      } else {
        errors.push(`${sourceNames[i]}: ${result.reason}`);
      }
    });

    // If no jobs fetched at all, return success with 0
    if (allJobs.length === 0) {
      return NextResponse.json({
        success: true,
        fetched: 0,
        ingested: 0,
        skipped: 0,
        errors,
        message: "No jobs fetched from any source",
      });
    }

    // Deduplicate
    const deduped = deduplicateJobs(allJobs);

    // Verify sponsors — deduplicate by company+country, then batch
    try {
      const uniqueCompanies = new Map<string, { company: string; country: string }>();
      for (const job of deduped) {
        const key = `${normalizeCompanyName(job.company)}|${job.country}`;
        if (!uniqueCompanies.has(key)) {
          uniqueCompanies.set(key, { company: job.company, country: job.country });
        }
      }

      const sponsorResults = await batchVerifySponsors([...uniqueCompanies.values()]);

      for (const job of deduped) {
        const key = `${normalizeCompanyName(job.company)}|${job.country}`;
        const result = sponsorResults.get(key);
        if (result) {
          job.verifiedSponsor = result.verified;
          job.sponsorTier = result.tier;
          if (result.details) job.sponsorDetails = result.details;
        }
      }
    } catch (e) {
      errors.push(`Sponsor verification: ${e}`);
    }

    // Convert salaries — fetch rates once, then convert synchronously
    try {
      const rates = await getExchangeRates() || FALLBACK_RATES;
      for (const job of deduped) {
        if (job.salaryMin && job.salaryCurrency && job.salaryCurrency !== "INR") {
          const rate = rates[job.salaryCurrency.toUpperCase()];
          if (rate) job.salaryMinINR = Math.round(job.salaryMin * rate);
        }
        if (job.salaryMax && job.salaryCurrency && job.salaryCurrency !== "INR") {
          const rate = rates[job.salaryCurrency.toUpperCase()];
          if (rate) job.salaryMaxINR = Math.round(job.salaryMax * rate);
        }
      }
    } catch (e) {
      errors.push(`Salary conversion: ${e}`);
    }

    // Truncate descriptions to save Firestore storage + avoid large docs
    for (const job of deduped) {
      if (job.description.length > 2000) {
        job.description = job.description.slice(0, 2000);
      }
    }

    // Batch write to Firestore (250 per batch, 3 concurrent to avoid DEADLINE_EXCEEDED)
    const batches = chunk(deduped, 250);
    const CONCURRENT_BATCHES = 3;
    for (let i = 0; i < batches.length; i += CONCURRENT_BATCHES) {
      const group = batches.slice(i, i + CONCURRENT_BATCHES);
      const promises = group.map((batch) => {
        const writeBatch = adminDb.batch();
        for (const job of batch) {
          const docRef = adminDb.collection("jobs").doc(job.id);
          const clean = JSON.parse(JSON.stringify(job));
          writeBatch.set(docRef, clean, { merge: true });
        }
        return writeBatch.commit();
      });
      await Promise.all(promises);
    }

    // Update global stats (best-effort)
    try {
      await updateGlobalStats();
    } catch (e) {
      errors.push(`Stats update: ${e}`);
    }

    // Invalidate caches (best-effort)
    try {
      await invalidateCache("jobs:search:*");
      await invalidateCache("jobs:trending:*");
      await invalidateCache("jobs:stats:*");
    } catch {}

    // Save ingestion log (best-effort)
    try {
      await adminDb.collection("ingestion_logs").doc(`ingest-${Date.now()}`).set({
        startedAt: new Date().toISOString(),
        jobsFetched: allJobs.length,
        jobsIngested: deduped.length,
        jobsSkipped: allJobs.length - deduped.length,
        errors,
        status: "completed",
      });
    } catch {}

    return NextResponse.json({
      success: true,
      fetched: allJobs.length,
      ingested: deduped.length,
      skipped: allJobs.length - deduped.length,
      errors,
    });
  } catch (err) {
    console.error("[Ingest Jobs] Fatal error:", err);
    return NextResponse.json(
      { error: "Ingestion failed", details: String(err), errors },
      { status: 500 }
    );
  }
}

function deduplicateJobs(jobs: NormalizedJob[]): NormalizedJob[] {
  const seen = new Map<string, NormalizedJob>();

  for (const job of jobs) {
    const key = generateDedupeKey(job.company, job.title, job.country);
    const existing = seen.get(key);

    if (existing) {
      if (!existing.sources.includes(job.source)) {
        existing.sources.push(job.source);
      }
      if (job.description.length > existing.description.length) {
        seen.set(key, { ...job, sources: existing.sources });
      }
    } else {
      seen.set(key, job);
    }
  }

  return [...seen.values()];
}

async function updateGlobalStats() {
  // Simple approach: get all active jobs and count
  const jobsSnap = await adminDb
    .collection("jobs")
    .where("isActive", "==", true)
    .select("country")
    .limit(10000)
    .get();

  const jobsByCountry: Record<string, number> = {};
  jobsSnap.docs.forEach((doc) => {
    const country = doc.data().country;
    jobsByCountry[country] = (jobsByCountry[country] || 0) + 1;
  });

  const sponsorsSnap = await adminDb
    .collection("sponsors")
    .select("country")
    .limit(1)
    .get();

  await adminDb.collection("stats").doc("global").set(
    {
      totalJobs: jobsSnap.size,
      totalSponsors: sponsorsSnap.size,
      countriesCount: Object.keys(jobsByCountry).length,
      jobsByCountry,
      lastUpdated: new Date().toISOString(),
    },
    { merge: true }
  );
}
