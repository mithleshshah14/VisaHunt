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
import type { NormalizedJob, IngestionLog } from "@/lib/types";

export const maxDuration = 300; // 5 min for Vercel Pro
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log: IngestionLog = {
    id: `ingest-${Date.now()}`,
    source: "arbeitnow", // Will be updated
    startedAt: new Date().toISOString(),
    jobsFetched: 0,
    jobsNew: 0,
    jobsUpdated: 0,
    jobsSkipped: 0,
    errors: [],
    status: "running",
  };

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
      log.errors.push(`Arbeitnow: ${arbeitnowJobs.reason}`);
    }

    if (githubJobs.status === "fulfilled") {
      allJobs.push(...githubJobs.value);
    } else {
      log.errors.push(`GitHub: ${githubJobs.reason}`);
    }

    if (visaSponsorJobs.status === "fulfilled") {
      allJobs.push(...visaSponsorJobs.value);
    } else {
      log.errors.push(`VisaSponsor: ${visaSponsorJobs.reason}`);
    }

    log.jobsFetched = allJobs.length;

    // Deduplicate
    const deduped = deduplicateJobs(allJobs);
    log.jobsSkipped = allJobs.length - deduped.length;

    // Verify sponsors + convert salaries
    for (const job of deduped) {
      // Sponsor verification
      const sponsorResult = await verifySponsor(job.company, job.country);
      job.verifiedSponsor = sponsorResult.verified;
      job.sponsorTier = sponsorResult.tier;
      if (sponsorResult.details) {
        job.sponsorDetails = sponsorResult.details;
      }

      // INR conversion
      if (job.salaryMin && job.salaryCurrency) {
        job.salaryMinINR = await convertToINR(job.salaryMin, job.salaryCurrency);
      }
      if (job.salaryMax && job.salaryCurrency) {
        job.salaryMaxINR = await convertToINR(job.salaryMax, job.salaryCurrency);
      }
    }

    // Batch write to Firestore (499 per batch)
    const batches = chunk(deduped, 499);
    for (const batch of batches) {
      const writeBatch = adminDb.batch();
      for (const job of batch) {
        const docRef = adminDb.collection("jobs").doc(job.id);
        // Use set with merge to update existing jobs
        writeBatch.set(docRef, job, { merge: true });
      }
      await writeBatch.commit();
    }

    log.jobsNew = deduped.length; // Simplified — merge handles new vs update
    log.status = "completed";
    log.completedAt = new Date().toISOString();

    // Update global stats
    await updateGlobalStats();

    // Invalidate search caches
    await invalidateCache("jobs:search:*");
    await invalidateCache("jobs:trending:*");

    // Save ingestion log
    await adminDb.collection("ingestion_logs").doc(log.id).set(log);

    return NextResponse.json({
      success: true,
      fetched: log.jobsFetched,
      ingested: deduped.length,
      skipped: log.jobsSkipped,
      errors: log.errors,
    });
  } catch (err) {
    log.status = "failed";
    log.errors.push(String(err));
    log.completedAt = new Date().toISOString();

    try {
      await adminDb.collection("ingestion_logs").doc(log.id).set(log);
    } catch {}

    console.error("[Ingest Jobs] Fatal error:", err);
    return NextResponse.json(
      { error: "Ingestion failed", details: String(err) },
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
      // Merge sources
      if (!existing.sources.includes(job.source)) {
        existing.sources.push(job.source);
      }
      // Keep the one with more data (longer description)
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
  try {
    const jobsSnap = await adminDb
      .collection("jobs")
      .where("isActive", "==", true)
      .count()
      .get();

    const sponsorsSnap = await adminDb
      .collection("sponsors")
      .count()
      .get();

    // Count by country
    const countrySnap = await adminDb
      .collection("jobs")
      .where("isActive", "==", true)
      .select("country")
      .limit(10000)
      .get();

    const jobsByCountry: Record<string, number> = {};
    countrySnap.docs.forEach((doc) => {
      const country = doc.data().country;
      jobsByCountry[country] = (jobsByCountry[country] || 0) + 1;
    });

    await adminDb
      .collection("stats")
      .doc("global")
      .set(
        {
          totalJobs: jobsSnap.data().count,
          totalSponsors: sponsorsSnap.data().count,
          countriesCount: Object.keys(jobsByCountry).length,
          jobsByCountry,
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      );
  } catch (err) {
    console.error("[Stats] Update failed:", err);
  }
}
