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

const SOURCE: JobSource = "himalayas";
const API_URL = "https://himalayas.app/jobs/api";
const PER_PAGE = 20; // API max

interface HimalayasJob {
  title: string;
  excerpt: string;
  companyName: string;
  companyLogo?: string;
  employmentType?: string;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  seniority?: string[];
  locationRestrictions?: string[];
  categories?: string[];
  description: string;
  pubDate: number;
  expiryDate?: number;
  applicationLink?: string;
  guid: string;
}

interface HimalayasResponse {
  totalCount: number;
  offset: number;
  limit: number;
  jobs: HimalayasJob[];
}

export async function fetchHimalayasJobs(maxPages = 10): Promise<NormalizedJob[]> {
  const jobs: NormalizedJob[] = [];
  let offset = 0;
  let totalRaw = 0;

  for (let page = 0; page < maxPages; page++) {
    try {
      const res = await fetch(
        `${API_URL}?visa_sponsorship=true&limit=${PER_PAGE}&offset=${offset}`,
        { headers: { Accept: "application/json" } }
      );

      if (!res.ok) {
        console.error(`[Himalayas] Page ${page} failed: ${res.status}`);
        break;
      }

      const data: HimalayasResponse = await res.json();
      if (!data.jobs || data.jobs.length === 0) break;

      totalRaw += data.jobs.length;
      for (const job of data.jobs) {
        const normalized = normalizeHimalayasJob(job);
        if (normalized) jobs.push(normalized);
      }

      offset += data.jobs.length;
      if (offset >= data.totalCount) break;
    } catch (err) {
      console.error(`[Himalayas] Error at offset ${offset}:`, err);
      break;
    }
  }

  const filtered = totalRaw - jobs.length;
  console.log(`[Himalayas] Fetched ${totalRaw} raw, kept ${jobs.length}, filtered ${filtered} (no-visa/no-country)`);
  return jobs;
}

function normalizeHimalayasJob(job: HimalayasJob): NormalizedJob | null {
  if (!job.title || !job.companyName) return null;

  // Skip jobs that explicitly say they don't sponsor visas
  if (job.description && hasNoVisaSignal(job.description)) return null;
  if (job.excerpt && hasNoVisaSignal(job.excerpt)) return null;

  // Resolve country from locationRestrictions
  const country = resolveCountryFromRestrictions(job.locationRestrictions);
  if (!country) return null;

  const location = job.locationRestrictions?.join(", ") || "Remote";
  const techStack = extractTechStack(
    job.description + " " + (job.categories || []).join(" ")
  );
  const now = new Date().toISOString();
  const url = job.applicationLink || `https://himalayas.app/jobs/${job.guid}`;

  return {
    id: generateJobId(job.companyName, job.title, location),
    title: job.title,
    company: job.companyName,
    companyNormalized: normalizeCompanyName(job.companyName),
    location,
    country,
    countryName: getCountryName(country),
    description: job.description || job.excerpt,
    descriptionSnippet: createSnippet(job.excerpt || job.description),
    url,
    source: SOURCE,
    sources: [SOURCE],
    postedDate: job.pubDate
      ? new Date(job.pubDate * 1000).toISOString()
      : now,
    ingestedAt: now,
    updatedAt: now,
    expiresAt: job.expiryDate
      ? new Date(job.expiryDate * 1000).toISOString()
      : calculateExpiryDate(),
    ...(job.minSalary ? { salaryMin: job.minSalary } : {}),
    ...(job.maxSalary ? { salaryMax: job.maxSalary } : {}),
    ...(job.currency ? { salaryCurrency: job.currency } : {}),
    techStack,
    techStackLower: techStack.map((t) => t.toLowerCase()),
    verifiedSponsor: false,
    sponsorTier: "source-listed",
    searchTokens: generateSearchTokens({
      title: job.title,
      company: job.companyName,
      techStack,
      location,
    }),
    isActive: true,
    ...(job.employmentType === "full_time"
      ? { jobType: "full-time" as const }
      : job.employmentType === "contract"
        ? { jobType: "contract" as const }
        : {}),
  };
}

function resolveCountryFromRestrictions(
  restrictions?: string[]
): string {
  if (!restrictions || restrictions.length === 0) return "";

  // Try each restriction — take the first that resolves
  for (const loc of restrictions) {
    const code = resolveCountryCode(loc);
    if (code) return code;
  }

  return "";
}
