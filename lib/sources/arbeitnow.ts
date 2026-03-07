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
} from "@/lib/normalizer";
import type { NormalizedJob, JobSource } from "@/lib/types";

const SOURCE: JobSource = "arbeitnow";
const API_URL = "https://www.arbeitnow.com/api/job-board-api";

interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  job_types: string[];
  location: string;
  created_at: number;
}

interface ArbeitnowResponse {
  data: ArbeitnowJob[];
  links: { next: string | null };
  meta: { current_page: number; last_page: number };
}

export async function fetchArbeitnowJobs(maxPages = 5): Promise<NormalizedJob[]> {
  const jobs: NormalizedJob[] = [];
  let page = 1;

  while (page <= maxPages) {
    try {
      const url = `${API_URL}?visa_sponsorship=true&page=${page}`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        console.error(`[Arbeitnow] Page ${page} failed: ${res.status}`);
        break;
      }

      const data: ArbeitnowResponse = await res.json();

      for (const job of data.data) {
        const normalized = normalizeArbeitnowJob(job);
        if (normalized) jobs.push(normalized);
      }

      if (!data.links.next || page >= data.meta.last_page) break;
      page++;
    } catch (err) {
      console.error(`[Arbeitnow] Error on page ${page}:`, err);
      break;
    }
  }

  console.log(`[Arbeitnow] Fetched ${jobs.length} jobs from ${page} pages`);
  return jobs;
}

function normalizeArbeitnowJob(job: ArbeitnowJob): NormalizedJob | null {
  // Skip jobs that explicitly say they don't sponsor visas
  if (job.description && hasNoVisaSignal(job.description)) return null;

  const country = resolveCountryFromLocation(job.location);
  if (!country) return null;

  const techStack = extractTechStack(job.description + " " + job.tags.join(" "));
  const now = new Date().toISOString();

  const normalized: NormalizedJob = {
    id: generateJobId(job.company_name, job.title, job.location),
    title: job.title,
    company: job.company_name,
    companyNormalized: normalizeCompanyName(job.company_name),
    location: job.location,
    country,
    countryName: getCountryName(country),
    description: job.description,
    descriptionSnippet: createSnippet(job.description),
    url: job.url,
    source: SOURCE,
    sources: [SOURCE],
    postedDate: new Date(job.created_at * 1000).toISOString(),
    ingestedAt: now,
    updatedAt: now,
    expiresAt: calculateExpiryDate(),
    techStack,
    techStackLower: techStack.map((t) => t.toLowerCase()),
    verifiedSponsor: false,
    sponsorTier: "source-listed",
    searchTokens: generateSearchTokens({
      title: job.title,
      company: job.company_name,
      techStack,
      location: job.location,
    }),
    isActive: true,
    ...(job.remote ? { remote: "remote" as const } : {}),
    ...(job.job_types?.includes("Full Time") ? { jobType: "full-time" as const } : {}),
  };

  return normalized;
}

