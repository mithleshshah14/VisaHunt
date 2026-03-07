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

const SOURCE: JobSource = "landingjobs";
const API_URL = "https://landing.jobs/api/v1/offers";

interface LandingJob {
  id: number;
  company_id: number;
  currency_code?: string;
  title: string;
  role_description?: string;
  main_requirements?: string;
  url: string;
  published_at?: string;
  expires_at?: string;
  gross_salary_low?: number;
  gross_salary_high?: number;
  tags?: string[];
  locations?: Array<{ city: string; country_code: string }>;
  type?: string;
  remote?: boolean;
}

export async function fetchLandingJobs(): Promise<NormalizedJob[]> {
  const allJobs: NormalizedJob[] = [];

  try {
    // Fetch all visa-sponsored jobs (usually <100)
    for (let offset = 0; offset < 200; offset += 50) {
      const res = await fetch(`${API_URL}?visa=true&limit=50&offset=${offset}`, {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        console.error(`[LandingJobs] Failed: ${res.status}`);
        break;
      }

      const data: LandingJob[] = await res.json();
      if (!data || data.length === 0) break;

      for (const job of data) {
        const normalized = normalizeLandingJob(job);
        if (normalized) allJobs.push(normalized);
      }

      if (data.length < 50) break;
    }
  } catch (err) {
    console.error("[LandingJobs] Error:", err);
  }

  console.log(`[LandingJobs] Fetched ${allJobs.length} visa-sponsored jobs`);
  return allJobs;
}

function normalizeLandingJob(job: LandingJob): NormalizedJob | null {
  if (!job.title || !job.url) return null;

  // Skip jobs that explicitly say they don't sponsor visas
  const fullText = [job.role_description, job.main_requirements].filter(Boolean).join(" ");
  if (fullText && hasNoVisaSignal(fullText)) return null;

  const loc = job.locations?.[0];
  if (!loc?.country_code) return null;

  const country = resolveCountryCode(loc.country_code);
  if (!country) return null;

  const location = loc.city ? `${loc.city}, ${getCountryName(country)}` : getCountryName(country);
  const description = [job.role_description, job.main_requirements]
    .filter(Boolean)
    .join(" ")
    .replace(/<[^>]*>/g, " ");
  const techStack = extractTechStack(
    description + " " + (job.tags || []).join(" ")
  );
  const now = new Date().toISOString();

  return {
    id: generateJobId(String(job.company_id), job.title, location),
    title: job.title,
    company: `Company #${job.company_id}`,
    companyNormalized: String(job.company_id),
    location,
    country,
    countryName: getCountryName(country),
    description: description || `${job.title} in ${location}`,
    descriptionSnippet: createSnippet(description || `${job.title} in ${location}`),
    url: job.url,
    source: SOURCE,
    sources: [SOURCE],
    postedDate: job.published_at || now,
    ingestedAt: now,
    updatedAt: now,
    expiresAt: job.expires_at || calculateExpiryDate(),
    ...(job.gross_salary_low ? { salaryMin: job.gross_salary_low } : {}),
    ...(job.gross_salary_high ? { salaryMax: job.gross_salary_high } : {}),
    ...(job.currency_code ? { salaryCurrency: job.currency_code } : {}),
    techStack,
    techStackLower: techStack.map((t) => t.toLowerCase()),
    verifiedSponsor: false,
    sponsorTier: "source-listed",
    searchTokens: generateSearchTokens({
      title: job.title,
      company: String(job.company_id),
      techStack,
      location,
    }),
    isActive: true,
  };
}
