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

const SOURCE: JobSource = "visasponsor";

// VisaSponsor.jobs — all jobs are visa-sponsored
const API_URL = "https://visasponsor.jobs/api/jobs";

interface VisaSponsorJob {
  id: string;
  title: string;
  company: string;
  location: string;
  country: string;
  description: string;
  url: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  posted_date?: string;
  tags?: string[];
}

export async function fetchVisaSponsorJobs(): Promise<NormalizedJob[]> {
  try {
    const res = await fetch(API_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.error(`[VisaSponsor] Failed: ${res.status}`);
      return [];
    }

    const data: VisaSponsorJob[] = await res.json();
    const jobs: NormalizedJob[] = [];

    for (const job of data) {
      const normalized = normalizeVisaSponsorJob(job);
      if (normalized) jobs.push(normalized);
    }

    console.log(`[VisaSponsor] Fetched ${jobs.length} jobs`);
    return jobs;
  } catch (err) {
    console.error("[VisaSponsor] Error:", err);
    return [];
  }
}

function normalizeVisaSponsorJob(job: VisaSponsorJob): NormalizedJob | null {
  if (!job.title || !job.company || !job.url) return null;

  const country = resolveCountryCode(job.country || extractCountry(job.location));
  if (!country) return null;

  const techStack = extractTechStack(
    job.description + " " + (job.tags || []).join(" ")
  );
  const now = new Date().toISOString();

  return {
    id: generateJobId(job.company, job.title, job.location),
    title: job.title,
    company: job.company,
    companyNormalized: normalizeCompanyName(job.company),
    location: job.location,
    country,
    countryName: getCountryName(country),
    description: job.description,
    descriptionSnippet: createSnippet(job.description),
    url: job.url,
    source: SOURCE,
    sources: [SOURCE],
    postedDate: job.posted_date || now,
    ingestedAt: now,
    updatedAt: now,
    expiresAt: calculateExpiryDate(),
    salaryMin: job.salary_min,
    salaryMax: job.salary_max,
    salaryCurrency: job.salary_currency,
    techStack,
    techStackLower: techStack.map((t) => t.toLowerCase()),
    verifiedSponsor: false,
    sponsorTier: "source-listed",
    searchTokens: generateSearchTokens({
      title: job.title,
      company: job.company,
      techStack,
      location: job.location,
    }),
    isActive: true,
  };
}

function extractCountry(location: string): string {
  const parts = location.split(",").map((p) => p.trim());
  return parts[parts.length - 1] || "";
}
