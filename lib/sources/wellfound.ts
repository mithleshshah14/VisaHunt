import {
  normalizeCompanyName,
  generateJobId,
  createSnippet,
  extractTechStack,
  generateSearchTokens,
  resolveCountryFromLocation,
  getCountryName,
  calculateExpiryDate,
  hasNoVisaSignal,
  isRemoteAnywhere,
  isLocationRemoteAnywhere,
} from "@/lib/normalizer";
import type { NormalizedJob, JobSource } from "@/lib/types";

const SOURCE: JobSource = "wellfound";

// Wellfound (formerly AngelList) has a GraphQL API behind their public pages
// We'll scrape the job listing pages that are publicly accessible
const SEARCH_URLS = [
  "https://wellfound.com/role/r/software-engineer?visa=true",
  "https://wellfound.com/role/r/frontend-engineer?visa=true",
  "https://wellfound.com/role/r/backend-engineer?visa=true",
  "https://wellfound.com/role/r/full-stack-engineer?visa=true",
  "https://wellfound.com/role/r/data-engineer?visa=true",
  "https://wellfound.com/role/r/devops-engineer?visa=true",
  "https://wellfound.com/role/r/mobile-developer?visa=true",
];

interface WellfoundJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  postedDate: string;
  salary?: { min?: number; max?: number; currency?: string };
  remote?: boolean;
  visaSponsorship?: boolean;
}

function extractJobsFromHTML(html: string): WellfoundJob[] {
  const jobs: WellfoundJob[] = [];

  // Try __NEXT_DATA__ or Apollo cache
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1]);
      const props = nextData?.props?.pageProps;

      // Wellfound stores job listings in various structures
      const listings = props?.listings || props?.jobListings || props?.jobs || [];

      for (const listing of listings) {
        const job = listing?.job || listing?.startup_job || listing;
        if (!job?.title) continue;

        const company = job.startup?.name || job.company?.name || job.companyName || "";
        const location = job.location_names?.join(", ") ||
          job.locations?.map((l: { name: string }) => l.name).join(", ") ||
          job.location || "";

        jobs.push({
          id: String(job.id || job.slug || ""),
          title: job.title,
          company,
          location,
          description: job.description || job.job_description || "",
          url: job.url || `https://wellfound.com/jobs/${job.slug || job.id}`,
          postedDate: job.created_at || job.published_at || "",
          salary: job.compensation ? {
            min: job.compensation.min,
            max: job.compensation.max,
            currency: job.compensation.currency || "USD",
          } : undefined,
          remote: job.remote === true || /remote/i.test(location),
          visaSponsorship: job.visa_sponsorship === true,
        });
      }
    } catch {}
  }

  // Fallback: try Apollo state
  if (jobs.length === 0) {
    const apolloMatch = html.match(/window\.__APOLLO_STATE__\s*=\s*({[\s\S]*?});\s*<\/script>/);
    if (apolloMatch) {
      try {
        const state = JSON.parse(apolloMatch[1]);
        for (const [key, value] of Object.entries(state)) {
          if (!key.startsWith("StartupJob:") && !key.startsWith("JobListing:")) continue;
          const job = value as Record<string, unknown>;
          if (!job.title) continue;

          const companyRef = job.startup as { name?: string } | undefined;
          jobs.push({
            id: String(job.id || key),
            title: String(job.title || ""),
            company: companyRef?.name || String(job.companyName || ""),
            location: String(job.locationNames || job.location || ""),
            description: String(job.description || ""),
            url: `https://wellfound.com/jobs/${job.slug || job.id}`,
            postedDate: String(job.createdAt || ""),
            remote: Boolean(job.remote),
            visaSponsorship: Boolean(job.visaSponsorship),
          });
        }
      } catch {}
    }
  }

  return jobs;
}

export async function fetchWellfoundJobs(): Promise<NormalizedJob[]> {
  try {
    const allJobs: NormalizedJob[] = [];
    const seen = new Set<string>();

    // Fetch each search URL (sequential to be polite to the server)
    for (const searchUrl of SEARCH_URLS) {
      try {
        const res = await fetch(searchUrl, {
          headers: {
            Accept: "text/html",
            "User-Agent": "Mozilla/5.0 (compatible; VisaHunt/1.0; +https://visa-hunt.com)",
          },
        });

        if (!res.ok) continue;
        const html = await res.text();
        const extracted = extractJobsFromHTML(html);

        for (const job of extracted) {
          if (seen.has(job.id)) continue;
          seen.add(job.id);

          const normalized = normalizeWellfoundJob(job);
          if (normalized) allJobs.push(normalized);
        }
      } catch {
        // Skip failed pages
      }
    }

    console.log(`[Wellfound] Fetched ${allJobs.length} visa-sponsoring jobs`);
    return allJobs;
  } catch (err) {
    console.error("[Wellfound] Error:", err);
    return [];
  }
}

function normalizeWellfoundJob(job: WellfoundJob): NormalizedJob | null {
  if (!job.title || !job.company) return null;

  const description = job.description
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (description && hasNoVisaSignal(description)) return null;

  let country = resolveCountryFromLocation(job.location);
  const remoteAnywhere =
    isRemoteAnywhere(description) ||
    isLocationRemoteAnywhere(job.location) ||
    (job.remote && !job.location);

  if (!country && remoteAnywhere) country = "US";
  if (!country) country = resolveCountryFromLocation(description.slice(0, 300));
  if (!country) return null;

  const location = remoteAnywhere ? "Remote — Worldwide" : (job.location || "Unknown");
  const techStack = extractTechStack(job.title + " " + description);
  const now = new Date().toISOString();

  return {
    id: generateJobId(job.company, job.title, location),
    title: job.title,
    company: job.company,
    companyNormalized: normalizeCompanyName(job.company),
    location,
    country,
    countryName: getCountryName(country),
    description: description || `${job.title} at ${job.company}`,
    descriptionSnippet: createSnippet(description || `${job.title} at ${job.company}`),
    url: job.url,
    source: SOURCE,
    sources: [SOURCE],
    postedDate: job.postedDate || now,
    ingestedAt: now,
    updatedAt: now,
    expiresAt: calculateExpiryDate(),
    techStack,
    techStackLower: techStack.map((t) => t.toLowerCase()),
    ...(remoteAnywhere ? { remoteAnywhere: true } : {}),
    ...(job.remote ? { remote: "remote" as const } : {}),
    verifiedSponsor: job.visaSponsorship || false,
    sponsorTier: job.visaSponsorship ? "source-listed" : "inferred",
    ...(job.salary?.min ? { salaryMin: job.salary.min, salaryCurrency: job.salary.currency || "USD" } : {}),
    ...(job.salary?.max ? { salaryMax: job.salary.max } : {}),
    searchTokens: generateSearchTokens({
      title: job.title,
      company: job.company,
      techStack,
      location,
    }),
    isActive: true,
  };
}
