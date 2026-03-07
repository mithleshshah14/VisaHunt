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
  isRemoteAnywhere,
  isLocationRemoteAnywhere,
} from "@/lib/normalizer";
import type { NormalizedJob, JobSource } from "@/lib/types";

const SOURCE: JobSource = "remoteok";
const API_URL = "https://remoteok.com/api";

interface RemoteOKJob {
  id: string;
  epoch: string;
  date: string;
  company: string;
  company_logo?: string;
  position: string;
  tags?: string[];
  description?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  url: string;
  apply_url?: string;
}

export async function fetchRemoteOKJobs(): Promise<NormalizedJob[]> {
  try {
    const res = await fetch(API_URL, {
      headers: {
        "User-Agent": "VisaHunt Job Aggregator (visa-hunt.com)",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.error(`[RemoteOK] Failed: ${res.status}`);
      return [];
    }

    const data: RemoteOKJob[] = await res.json();

    // First item is metadata, skip it
    const jobList = data.filter((j) => j.position && j.company);

    const jobs: NormalizedJob[] = [];
    for (const job of jobList) {
      const normalized = normalizeRemoteOKJob(job);
      if (normalized) jobs.push(normalized);
    }

    console.log(`[RemoteOK] Fetched ${jobs.length} jobs`);
    return jobs;
  } catch (err) {
    console.error("[RemoteOK] Error:", err);
    return [];
  }
}

function normalizeRemoteOKJob(job: RemoteOKJob): NormalizedJob | null {
  const description = (job.description || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (description && hasNoVisaSignal(description)) return null;

  // Determine location and country
  const locationStr = job.location || "Remote";
  const remoteAnywhere =
    isRemoteAnywhere(description) ||
    isLocationRemoteAnywhere(locationStr) ||
    !job.location; // No location specified = worldwide remote

  let country = "";
  if (remoteAnywhere) {
    country = "US"; // Default for worldwide remote
  } else {
    country = resolveCountryCode(locationStr) || "";
  }
  if (!country) return null;

  const location = remoteAnywhere ? "Remote — Worldwide" : locationStr;
  const techStack = extractTechStack(
    job.position + " " + description + " " + (job.tags || []).join(" ")
  );
  const now = new Date().toISOString();
  const url = job.apply_url || job.url || `https://remoteok.com/remote-jobs/${job.id}`;

  return {
    id: generateJobId(job.company, job.position, location),
    title: job.position,
    company: job.company,
    companyNormalized: normalizeCompanyName(job.company),
    location,
    country,
    countryName: getCountryName(country),
    description: description || `${job.position} at ${job.company}`,
    descriptionSnippet: createSnippet(description || `${job.position} at ${job.company}`),
    url,
    source: SOURCE,
    sources: [SOURCE],
    postedDate: job.date || now,
    ingestedAt: now,
    updatedAt: now,
    expiresAt: calculateExpiryDate(),
    techStack,
    techStackLower: techStack.map((t) => t.toLowerCase()),
    ...(remoteAnywhere ? { remoteAnywhere: true } : {}),
    remote: "remote",
    verifiedSponsor: false,
    sponsorTier: "inferred",
    ...(job.salary_min ? { salaryMin: job.salary_min, salaryCurrency: "USD" } : {}),
    ...(job.salary_max ? { salaryMax: job.salary_max } : {}),
    searchTokens: generateSearchTokens({
      title: job.position,
      company: job.company,
      techStack,
      location,
    }),
    isActive: true,
  };
}
