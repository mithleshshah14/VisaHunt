import {
  normalizeCompanyName,
  generateJobId,
  createSnippet,
  extractTechStack,
  generateSearchTokens,
  resolveCountryFromLocation,
  getCountryName,
  calculateExpiryDate,
} from "@/lib/normalizer";
import type { NormalizedJob, JobSource } from "@/lib/types";

const SOURCE: JobSource = "greenhouse";
const API_BASE = "https://boards-api.greenhouse.io/v1/boards";

// Curated list of companies known to sponsor visas with international offices
// Board slug → display company name
const GREENHOUSE_COMPANIES: Record<string, string> = {
  stripe: "Stripe",
  cloudflare: "Cloudflare",
  datadog: "Datadog",
  databricks: "Databricks",
  figma: "Figma",
  reddit: "Reddit",
  gitlab: "GitLab",
  celonis: "Celonis",
  samsara: "Samsara",
  elastic: "Elastic",
  twilio: "Twilio",
  contentful: "Contentful",
  n26: "N26",
  monzo: "Monzo",
  coinbase: "Coinbase",
  discord: "Discord",
  brex: "Brex",
  affirm: "Affirm",
  duolingo: "Duolingo",
  airtable: "Airtable",
  webflow: "Webflow",
  intercom: "Intercom",
  pagerduty: "PagerDuty",
  squarespace: "Squarespace",
  instacart: "Instacart",
  robinhood: "Robinhood",
  toast: "Toast",
  anthropic: "Anthropic",
  scaleai: "Scale AI",
  vercel: "Vercel",
  cockroachlabs: "Cockroach Labs",
  gusto: "Gusto",
  chime: "Chime",
};

interface GreenhouseJob {
  id: number;
  title: string;
  updated_at: string;
  absolute_url: string;
  location: {
    name: string;
  };
  metadata?: Array<{
    name: string;
    value: string | string[] | null;
  }>;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

export async function fetchGreenhouseJobs(): Promise<NormalizedJob[]> {
  const allJobs: NormalizedJob[] = [];
  const slugs = Object.keys(GREENHOUSE_COMPANIES);

  // Fetch in batches of 5 to avoid overwhelming the API
  for (let i = 0; i < slugs.length; i += 5) {
    const batch = slugs.slice(i, i + 5);
    const results = await Promise.allSettled(
      batch.map((slug) => fetchCompanyJobs(slug))
    );

    for (let k = 0; k < results.length; k++) {
      if (results[k].status === "fulfilled") {
        allJobs.push(...(results[k] as PromiseFulfilledResult<NormalizedJob[]>).value);
      } else {
        console.error(
          `[Greenhouse] ${batch[k]} failed:`,
          (results[k] as PromiseRejectedResult).reason
        );
      }
    }

    // Small delay between batches
    if (i + 5 < slugs.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(
    `[Greenhouse] Fetched ${allJobs.length} jobs from ${slugs.length} companies`
  );
  return allJobs;
}

async function fetchCompanyJobs(slug: string): Promise<NormalizedJob[]> {
  const companyName = GREENHOUSE_COMPANIES[slug] || slug;

  const res = await fetch(`${API_BASE}/${slug}/jobs`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    console.error(`[Greenhouse] ${slug}: ${res.status}`);
    return [];
  }

  const data: GreenhouseResponse = await res.json();
  if (!data.jobs) return [];

  const jobs: NormalizedJob[] = [];

  for (const job of data.jobs) {
    const normalized = normalizeGreenhouseJob(job, companyName);
    if (normalized) jobs.push(normalized);
  }

  return jobs;
}

function normalizeGreenhouseJob(
  job: GreenhouseJob,
  companyName: string
): NormalizedJob | null {
  if (!job.title || !job.location?.name) return null;

  const locationName = job.location.name;

  // Skip generic/remote-only locations without country info
  if (
    locationName === "N/A" ||
    locationName === "LOCATION" ||
    locationName === "Remote" ||
    locationName === "Anywhere"
  ) {
    return null;
  }

  const country = resolveCountryFromLocation(locationName);
  if (!country) return null;

  const techStack = extractTechStack(job.title);
  const now = new Date().toISOString();

  return {
    id: generateJobId(companyName, job.title, locationName),
    title: job.title,
    company: companyName,
    companyNormalized: normalizeCompanyName(companyName),
    location: locationName,
    country,
    countryName: getCountryName(country),
    description: `${job.title} at ${companyName} in ${locationName}. Apply on the company website for full details.`,
    descriptionSnippet: `${job.title} at ${companyName} — ${locationName}`,
    url: job.absolute_url,
    source: SOURCE,
    sources: [SOURCE],
    postedDate: job.updated_at || now,
    ingestedAt: now,
    updatedAt: now,
    expiresAt: calculateExpiryDate(),
    techStack,
    techStackLower: techStack.map((t) => t.toLowerCase()),
    verifiedSponsor: true,
    sponsorTier: "source-listed",
    searchTokens: generateSearchTokens({
      title: job.title,
      company: companyName,
      techStack,
      location: locationName,
    }),
    isActive: true,
  };
}
