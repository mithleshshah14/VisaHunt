import {
  normalizeCompanyName,
  generateJobId,
  createSnippet,
  extractTechStack,
  generateSearchTokens,
  resolveCountryCode,
  getCountryName,
  calculateExpiryDate,
  hasNoVisaSignal,
} from "@/lib/normalizer";
import type { NormalizedJob, JobSource } from "@/lib/types";

const SOURCE: JobSource = "arc-dev";
const PAGE_URL = "https://arc.dev/remote-jobs";

interface ArcJob {
  slug?: string;
  title?: string;
  companyName?: string;
  jobType?: string;
  jobRole?: string;
  experienceLevel?: string;
  minAnnualSalary?: number;
  maxAnnualSalary?: number;
  salaryCurrency?: string;
  categories?: string[];
  requiredCountries?: string[]; // ISO codes — empty = worldwide
  remoteType?: string;
  postedAt?: string;
  description?: string;
}

export async function fetchArcDevJobs(): Promise<NormalizedJob[]> {
  try {
    const res = await fetch(PAGE_URL, {
      headers: {
        Accept: "text/html",
        "User-Agent": "VisaHunt Job Aggregator (visa-hunt.com)",
      },
    });

    if (!res.ok) {
      console.error(`[Arc.dev] Failed: ${res.status}`);
      return [];
    }

    const html = await res.text();

    // Extract __NEXT_DATA__ JSON
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) {
      console.error("[Arc.dev] Could not find __NEXT_DATA__");
      return [];
    }

    let nextData: any;
    try {
      nextData = JSON.parse(match[1]);
    } catch {
      console.error("[Arc.dev] Failed to parse __NEXT_DATA__");
      return [];
    }

    // Navigate to job listings in the Next.js page props
    const pageProps = nextData?.props?.pageProps;
    const jobList: ArcJob[] = pageProps?.jobs || pageProps?.initialJobs || [];

    if (jobList.length === 0) {
      // Try to find jobs in any nested structure
      const jsonStr = match[1];
      console.log(`[Arc.dev] No jobs found in pageProps. Data keys: ${Object.keys(pageProps || {}).join(", ")}`);
      return [];
    }

    const jobs: NormalizedJob[] = [];
    for (const job of jobList) {
      const normalized = normalizeArcJob(job);
      if (normalized) jobs.push(normalized);
    }

    console.log(`[Arc.dev] Fetched ${jobs.length} remote jobs`);
    return jobs;
  } catch (err) {
    console.error("[Arc.dev] Error:", err);
    return [];
  }
}

function normalizeArcJob(job: ArcJob): NormalizedJob | null {
  if (!job.title || !job.companyName) return null;

  const description = job.description || "";
  if (description && hasNoVisaSignal(description)) return null;

  // Determine if remote-anywhere
  const isWorldwide = !job.requiredCountries || job.requiredCountries.length === 0;

  // Resolve country — use first required country, or "Worldwide"
  let country = "";
  let location = "Remote";

  if (isWorldwide) {
    // For worldwide jobs, we still need a country for our schema
    // Use US as default since Arc.dev is US-based
    country = "US";
    location = "Remote — Worldwide";
  } else {
    country = resolveCountryCode(job.requiredCountries![0]) || "";
    if (!country) return null;
    location = job.requiredCountries!.length > 1
      ? `Remote — ${job.requiredCountries!.join(", ")}`
      : `Remote — ${getCountryName(country)}`;
  }

  const techStack = job.categories && job.categories.length > 0
    ? job.categories.slice(0, 15)
    : extractTechStack(description + " " + job.title);
  const now = new Date().toISOString();
  const url = job.slug ? `https://arc.dev/remote-jobs/${job.slug}` : "https://arc.dev/remote-jobs";

  // Map experience level
  let experienceLevel: NormalizedJob["experienceLevel"];
  if (job.experienceLevel) {
    const level = job.experienceLevel.toLowerCase();
    if (level.includes("junior") || level.includes("entry")) experienceLevel = "entry";
    else if (level.includes("mid")) experienceLevel = "mid";
    else if (level.includes("senior")) experienceLevel = "senior";
    else if (level.includes("lead") || level.includes("principal")) experienceLevel = "lead";
  }

  return {
    id: generateJobId(job.companyName, job.title, location),
    title: job.title,
    company: job.companyName,
    companyNormalized: normalizeCompanyName(job.companyName),
    location,
    country,
    countryName: getCountryName(country),
    description: description || `${job.title} at ${job.companyName}`,
    descriptionSnippet: createSnippet(description || `${job.title} at ${job.companyName}`),
    url,
    source: SOURCE,
    sources: [SOURCE],
    postedDate: job.postedAt || now,
    ingestedAt: now,
    updatedAt: now,
    expiresAt: calculateExpiryDate(),
    ...(job.minAnnualSalary ? { salaryMin: job.minAnnualSalary } : {}),
    ...(job.maxAnnualSalary ? { salaryMax: job.maxAnnualSalary } : {}),
    ...(job.salaryCurrency ? { salaryCurrency: job.salaryCurrency } : {}),
    techStack,
    techStackLower: techStack.map((t) => t.toLowerCase()),
    ...(isWorldwide ? { remoteAnywhere: true } : {}),
    remote: "remote",
    verifiedSponsor: false,
    sponsorTier: "inferred",
    ...(experienceLevel ? { experienceLevel } : {}),
    searchTokens: generateSearchTokens({
      title: job.title,
      company: job.companyName,
      techStack,
      location,
    }),
    isActive: true,
  };
}
