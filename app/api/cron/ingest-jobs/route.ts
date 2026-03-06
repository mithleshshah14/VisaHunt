import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { invalidateCache } from "@/lib/redis";
import {
  fetchArbeitnowJobs,
  fetchGitHubAwesomeJobs,
  fetchVisaSponsorJobs,
} from "@/lib/sources";
import { verifySponsor } from "@/lib/sponsors";
import { convertToINR } from "@/lib/exchange";
import { generateDedupeKey } from "@/lib/normalizer";
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
    const [arbeitnowJobs, githubJobs, visaSponsorJobs] = await Promise.allSettled([
      fetchArbeitnowJobs(),
      fetchGitHubAwesomeJobs(),
      fetchVisaSponsorJobs(),
    ]);

    const allJobs: NormalizedJob[] = [];

    if (arbeitnowJobs.status === "fulfilled") {
      allJobs.push(...arbeitnowJobs.value);
    } else {
      errors.push(`Arbeitnow: ${arbeitnowJobs.reason}`);
    }

    if (githubJobs.status === "fulfilled") {
      allJobs.push(...githubJobs.value);
    } else {
      errors.push(`GitHub: ${githubJobs.reason}`);
    }

    if (visaSponsorJobs.status === "fulfilled") {
      allJobs.push(...visaSponsorJobs.value);
    } else {
      errors.push(`VisaSponsor: ${visaSponsorJobs.reason}`);
    }

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

    // Verify sponsors + convert salaries (skip if it fails per-job)
    for (const job of deduped) {
      try {
        const sponsorResult = await verifySponsor(job.company, job.country);
        job.verifiedSponsor = sponsorResult.verified;
        job.sponsorTier = sponsorResult.tier;
        if (sponsorResult.details) {
          job.sponsorDetails = sponsorResult.details;
        }
      } catch {
        // Skip sponsor verification for this job
      }

      try {
        if (job.salaryMin && job.salaryCurrency) {
          job.salaryMinINR = await convertToINR(job.salaryMin, job.salaryCurrency);
        }
        if (job.salaryMax && job.salaryCurrency) {
          job.salaryMaxINR = await convertToINR(job.salaryMax, job.salaryCurrency);
        }
      } catch {
        // Skip salary conversion for this job
      }
    }

    // Batch write to Firestore (499 per batch)
    const batches = chunk(deduped, 499);
    for (const batch of batches) {
      const writeBatch = adminDb.batch();
      for (const job of batch) {
        const docRef = adminDb.collection("jobs").doc(job.id);
        writeBatch.set(docRef, job, { merge: true });
      }
      await writeBatch.commit();
    }

    // Update global stats (best-effort)
    try {
      await updateGlobalStats();
    } catch (e) {
      errors.push(`Stats update: ${e}`);
    }

    // Invalidate search caches (best-effort)
    try {
      await invalidateCache("jobs:search:*");
      await invalidateCache("jobs:trending:*");
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
