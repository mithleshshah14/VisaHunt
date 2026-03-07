import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { invalidateCache } from "@/lib/redis";
import {
  fetchArbeitnowJobs,
  fetchHimalayasJobs,
  fetchGreenhouseJobs,
  fetchLandingJobs,
  fetchMyCareersFutureJobs,
  fetchJobTechSwedenJobs,
  fetchJobBankCanadaJobs,
  fetchArcDevJobs,
  fetchJustRemoteJobs,
  fetchBerlinStartupJobs,
  fetchHNHiringJobs,
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
      fetchHimalayasJobs(10),
      fetchGreenhouseJobs(),
      fetchLandingJobs(),
      fetchMyCareersFutureJobs(),
      fetchJobTechSwedenJobs(),
      fetchJobBankCanadaJobs(),
      fetchArcDevJobs(),
      fetchJustRemoteJobs(),
      fetchBerlinStartupJobs(),
      fetchHNHiringJobs(),
    ]);

    const sourceNames = [
      "Arbeitnow", "Himalayas", "Greenhouse", "LandingJobs",
      "MyCareersFuture", "JobTech Sweden", "Job Bank Canada",
      "Arc.dev", "JustRemote", "Berlin Startup Jobs", "HN Hiring",
    ];
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

    // Verify sponsors — only for jobs not already verified by their source
    try {
      const unverifiedJobs = deduped.filter((j) => !j.verifiedSponsor);
      const uniqueCompanies = new Map<string, { company: string; country: string }>();
      for (const job of unverifiedJobs) {
        const key = `${normalizeCompanyName(job.company)}|${job.country}`;
        if (!uniqueCompanies.has(key)) {
          uniqueCompanies.set(key, { company: job.company, country: job.country });
        }
      }

      if (uniqueCompanies.size > 0) {
        const sponsorResults = await batchVerifySponsors([...uniqueCompanies.values()]);

        for (const job of unverifiedJobs) {
          const key = `${normalizeCompanyName(job.company)}|${job.country}`;
          const result = sponsorResults.get(key);
          if (result && result.verified) {
            job.verifiedSponsor = true;
            job.sponsorTier = result.tier;
            if (result.details) job.sponsorDetails = result.details;
          }
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

    // Check which jobs already exist in Firestore — only write new ones
    const existingIds = new Set<string>();
    const idCheckBatches = chunk(deduped, 100);
    for (const batch of idCheckBatches) {
      const refs = batch.map((j) => adminDb.collection("jobs").doc(j.id));
      const snaps = await adminDb.getAll(...refs);
      snaps.forEach((snap) => {
        if (snap.exists) existingIds.add(snap.id);
      });
    }

    const newJobs = deduped.filter((j) => !existingIds.has(j.id));

    // Only write new jobs to Firestore
    if (newJobs.length > 0) {
      const batches = chunk(newJobs, 250);
      const CONCURRENT_BATCHES = 3;
      for (let i = 0; i < batches.length; i += CONCURRENT_BATCHES) {
        const group = batches.slice(i, i + CONCURRENT_BATCHES);
        const promises = group.map((batch) => {
          const writeBatch = adminDb.batch();
          for (const job of batch) {
            const docRef = adminDb.collection("jobs").doc(job.id);
            const clean = JSON.parse(JSON.stringify(job));
            writeBatch.set(docRef, clean);
          }
          return writeBatch.commit();
        });
        await Promise.all(promises);
      }
    }

    // Notify Discord about new jobs
    if (newJobs.length > 0) {
      try {
        await notifyDiscordNewJobs(newJobs);
      } catch (e) {
        errors.push(`Discord notify: ${e}`);
      }
    }

    // Clean up stale jobs older than 21 days
    let deletedCount = 0;
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 21);
      const staleSnap = await adminDb
        .collection("jobs")
        .where("postedDate", "<", cutoff.toISOString())
        .select()
        .limit(500)
        .get();

      if (staleSnap.size > 0) {
        const deleteBatches = chunk(staleSnap.docs, 250);
        for (const batch of deleteBatches) {
          const writeBatch = adminDb.batch();
          for (const doc of batch) {
            writeBatch.delete(doc.ref);
          }
          await writeBatch.commit();
        }
        deletedCount = staleSnap.size;
      }
    } catch (e) {
      errors.push(`Cleanup: ${e}`);
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
      deduped: deduped.length,
      newJobs: newJobs.length,
      alreadyExisted: existingIds.size,
      deleted: deletedCount,
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

const DISCORD_JOBS_WEBHOOK = process.env.DISCORD_JOBS_WEBHOOK_URL;

async function notifyDiscordNewJobs(jobs: NormalizedJob[]) {
  if (!DISCORD_JOBS_WEBHOOK) return;

  // Group jobs by country for a cleaner summary
  const byCountry: Record<string, NormalizedJob[]> = {};
  for (const job of jobs) {
    const key = job.countryName || job.country;
    if (!byCountry[key]) byCountry[key] = [];
    byCountry[key].push(job);
  }

  // Post a summary embed + individual job listings (max 10 to avoid spam)
  const topJobs = jobs.slice(0, 10);
  const fields = topJobs.map((job) => ({
    name: job.title,
    value: `**${job.company}** — ${job.location}${job.verifiedSponsor ? " ✅" : ""}\n[Apply](${job.url}) · [Details](https://visa-hunt.com/jobs/${job.id})`,
    inline: false,
  }));

  const countrySummary = Object.entries(byCountry)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 8)
    .map(([country, list]) => `${country}: **${list.length}**`)
    .join(" · ");

  const embed = {
    title: `🆕 ${jobs.length} New Visa-Sponsored Jobs`,
    description: `${countrySummary}\n\n[Browse all jobs →](https://visa-hunt.com/jobs)`,
    color: 0x0ea5e9, // sky-500
    fields,
    footer: {
      text: jobs.length > 10
        ? `Showing 10 of ${jobs.length} new jobs · visa-hunt.com`
        : "visa-hunt.com",
    },
    timestamp: new Date().toISOString(),
  };

  await fetch(DISCORD_JOBS_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] }),
  });
}
