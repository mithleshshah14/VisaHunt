import {
  normalizeCompanyName,
  generateJobId,
  createSnippet,
  extractTechStack,
  generateSearchTokens,
  resolveCountryCode,
  getCountryName,
  calculateExpiryDate,
} from "@/lib/normalizer";
import type { NormalizedJob, JobSource } from "@/lib/types";

const SOURCE: JobSource = "justremote";
const PAGE_URL = "https://justremote.co/remote-developer-jobs";

interface JustRemoteJob {
  id?: string;
  title?: string;
  company_name?: string;
  job_type?: string;
  date?: string;
  category?: string;
  href?: string;
  remote_type?: string;
  job_country?: string;
  location_restrictions?: string[];
  is_active?: boolean;
  description?: string;
}

export async function fetchJustRemoteJobs(): Promise<NormalizedJob[]> {
  try {
    const res = await fetch(PAGE_URL, {
      headers: {
        Accept: "text/html",
        "User-Agent": "VisaHunt Job Aggregator (visa-hunt.com)",
      },
    });

    if (!res.ok) {
      console.error(`[JustRemote] Failed: ${res.status}`);
      return [];
    }

    const html = await res.text();

    // Extract __PRELOADED_STATE__ or __NEXT_DATA__
    let jobList: JustRemoteJob[] = [];

    // Try __PRELOADED_STATE__
    const preloadMatch = html.match(/window\.__PRELOADED_STATE__\s*=\s*({[\s\S]*?});?\s*<\/script>/);
    if (preloadMatch) {
      try {
        const state = JSON.parse(preloadMatch[1]);
        jobList = state?.jobs || state?.listings || [];
      } catch {}
    }

    // Try __NEXT_DATA__
    if (jobList.length === 0) {
      const nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (nextMatch) {
        try {
          const nextData = JSON.parse(nextMatch[1]);
          const pageProps = nextData?.props?.pageProps;
          jobList = pageProps?.jobs || pageProps?.listings || pageProps?.initialJobs || [];
        } catch {}
      }
    }

    if (jobList.length === 0) {
      console.log("[JustRemote] No jobs found in embedded data");
      return [];
    }

    const jobs: NormalizedJob[] = [];
    for (const job of jobList) {
      if (job.is_active === false) continue;
      const normalized = normalizeJustRemoteJob(job);
      if (normalized) jobs.push(normalized);
    }

    console.log(`[JustRemote] Fetched ${jobs.length} remote dev jobs`);
    return jobs;
  } catch (err) {
    console.error("[JustRemote] Error:", err);
    return [];
  }
}

function normalizeJustRemoteJob(job: JustRemoteJob): NormalizedJob | null {
  if (!job.title || !job.company_name) return null;

  // Determine remote-anywhere vs country-specific
  const hasRestrictions = job.location_restrictions && job.location_restrictions.length > 0;
  const isWorldwide = !hasRestrictions;

  // Resolve country
  let country = "";
  let location = "Remote";

  if (isWorldwide) {
    country = "US"; // Default for worldwide
    location = "Remote — Worldwide";
  } else if (job.job_country) {
    country = resolveCountryCode(job.job_country) || "";
    location = `Remote — ${job.job_country}`;
  } else if (job.location_restrictions && job.location_restrictions.length > 0) {
    country = resolveCountryCode(job.location_restrictions[0]) || "";
    location = `Remote — ${job.location_restrictions.join(", ")}`;
  }

  if (!country) return null;

  const description = job.description || `${job.title} at ${job.company_name}`;
  const techStack = extractTechStack(description + " " + job.title + " " + (job.category || ""));
  const now = new Date().toISOString();
  const url = job.href
    ? (job.href.startsWith("http") ? job.href : `https://justremote.co${job.href}`)
    : "https://justremote.co/remote-developer-jobs";

  return {
    id: generateJobId(job.company_name, job.title, location),
    title: job.title,
    company: job.company_name,
    companyNormalized: normalizeCompanyName(job.company_name),
    location,
    country,
    countryName: getCountryName(country),
    description,
    descriptionSnippet: createSnippet(description),
    url,
    source: SOURCE,
    sources: [SOURCE],
    postedDate: job.date || now,
    ingestedAt: now,
    updatedAt: now,
    expiresAt: calculateExpiryDate(),
    techStack,
    techStackLower: techStack.map((t) => t.toLowerCase()),
    ...(isWorldwide ? { remoteAnywhere: true } : {}),
    remote: "remote",
    verifiedSponsor: false,
    sponsorTier: "inferred",
    searchTokens: generateSearchTokens({
      title: job.title,
      company: job.company_name,
      techStack,
      location,
    }),
    isActive: true,
  };
}
