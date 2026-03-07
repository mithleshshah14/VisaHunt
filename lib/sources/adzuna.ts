import {
  normalizeCompanyName,
  generateJobId,
  createSnippet,
  extractTechStack,
  generateSearchTokens,
  getCountryName,
  calculateExpiryDate,
  hasNoVisaSignal,
  isRemoteAnywhere,
  isLocationRemoteAnywhere,
} from "@/lib/normalizer";
import type { NormalizedJob, JobSource } from "@/lib/types";

const SOURCE: JobSource = "adzuna";

interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string; area?: string[] };
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  description: string;
  created: string;
  category?: { label: string; tag: string };
}

interface AdzunaResponse {
  results: AdzunaJob[];
  count: number;
}

// Countries and their Adzuna API codes + search terms
const ADZUNA_COUNTRIES = [
  { code: "gb", country: "GB", terms: ["software engineer visa sponsorship", "developer visa sponsor"] },
  { code: "de", country: "DE", terms: ["software engineer", "developer english"] },
  { code: "nl", country: "NL", terms: ["software engineer", "developer english"] },
  { code: "au", country: "AU", terms: ["software engineer visa sponsorship", "developer sponsor"] },
  { code: "ca", country: "CA", terms: ["software engineer", "developer"] },
  { code: "fr", country: "FR", terms: ["software engineer english", "developer english"] },
  { code: "at", country: "AT", terms: ["software engineer", "developer"] },
  { code: "pl", country: "PL", terms: ["software engineer", "developer"] },
];

async function searchAdzuna(
  countryCode: string,
  query: string,
  appId: string,
  appKey: string
): Promise<AdzunaJob[]> {
  try {
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: "50",
      what: query,
      sort_by: "date",
      max_days_old: "21",
    });

    const url = `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/1?${params}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "VisaHunt Job Aggregator (visa-hunt.com)" },
    });

    if (!res.ok) return [];
    const data: AdzunaResponse = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

export async function fetchAdzunaJobs(): Promise<NormalizedJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.log("[Adzuna] Skipped — no API credentials configured");
    return [];
  }

  try {
    const allJobs = new Map<string, NormalizedJob>();

    for (const { code, country, terms } of ADZUNA_COUNTRIES) {
      for (const term of terms) {
        const results = await searchAdzuna(code, term, appId, appKey);
        for (const job of results) {
          const normalized = normalizeAdzunaJob(job, country);
          if (normalized && !allJobs.has(normalized.id)) {
            allJobs.set(normalized.id, normalized);
          }
        }
      }
    }

    const jobs = [...allJobs.values()];
    console.log(`[Adzuna] Fetched ${jobs.length} jobs across ${ADZUNA_COUNTRIES.length} countries`);
    return jobs;
  } catch (err) {
    console.error("[Adzuna] Error:", err);
    return [];
  }
}

function normalizeAdzunaJob(job: AdzunaJob, countryCode: string): NormalizedJob | null {
  if (!job.title || !job.company?.display_name) return null;

  const description = (job.description || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (description && hasNoVisaSignal(description)) return null;

  const location = job.location?.display_name || getCountryName(countryCode);
  const remoteAnywhere =
    isRemoteAnywhere(description) || isLocationRemoteAnywhere(location);

  const techStack = extractTechStack(job.title + " " + description);
  const now = new Date().toISOString();

  // Determine salary currency based on country
  const currencyMap: Record<string, string> = {
    GB: "GBP", DE: "EUR", NL: "EUR", AU: "AUD", CA: "CAD",
    FR: "EUR", AT: "EUR", PL: "PLN",
  };

  return {
    id: generateJobId(job.company.display_name, job.title, location),
    title: job.title,
    company: job.company.display_name,
    companyNormalized: normalizeCompanyName(job.company.display_name),
    location,
    country: countryCode,
    countryName: getCountryName(countryCode),
    description: description || `${job.title} at ${job.company.display_name}`,
    descriptionSnippet: createSnippet(description || `${job.title} at ${job.company.display_name}`),
    url: job.redirect_url,
    source: SOURCE,
    sources: [SOURCE],
    postedDate: job.created || now,
    ingestedAt: now,
    updatedAt: now,
    expiresAt: calculateExpiryDate(),
    techStack,
    techStackLower: techStack.map((t) => t.toLowerCase()),
    ...(remoteAnywhere ? { remoteAnywhere: true } : {}),
    verifiedSponsor: false,
    sponsorTier: "inferred",
    ...(job.salary_min ? { salaryMin: Math.round(job.salary_min), salaryCurrency: currencyMap[countryCode] || "EUR" } : {}),
    ...(job.salary_max ? { salaryMax: Math.round(job.salary_max) } : {}),
    searchTokens: generateSearchTokens({
      title: job.title,
      company: job.company.display_name,
      techStack,
      location,
    }),
    isActive: true,
  };
}
