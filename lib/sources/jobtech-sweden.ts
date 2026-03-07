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
} from "@/lib/normalizer";
import type { NormalizedJob, JobSource } from "@/lib/types";

const SOURCE: JobSource = "jobtech-sweden";
const API_URL = "https://jobsearch.api.jobtechdev.se/search";
const COUNTRY = "SE";

// English tech search terms
const SEARCH_TERMS = [
  "software developer",
  "frontend",
  "backend",
  "full stack",
  "devops",
  "data engineer",
  "cloud engineer",
  "machine learning",
];

interface JobTechJob {
  id: string;
  headline: string;
  employer?: { name: string };
  workplace_address?: {
    municipality?: string;
    region?: string;
    city?: string;
    country?: string;
  };
  description?: { text?: string };
  salary_type?: { label?: string };
  salary_description?: string;
  employment_type?: { label?: string };
  working_hours_type?: { label?: string };
  duration?: { label?: string };
  application_deadline?: string;
  publication_date?: string;
  webpage_url?: string;
  application_details?: { url?: string };
  must_have?: { skills?: Array<{ label: string }> };
  nice_to_have?: { skills?: Array<{ label: string }> };
  experience_required?: boolean;
}

interface JobTechResponse {
  total: { value: number };
  hits: JobTechJob[];
}

export async function fetchJobTechSwedenJobs(): Promise<NormalizedJob[]> {
  const allJobs = new Map<string, NormalizedJob>();

  for (const term of SEARCH_TERMS) {
    try {
      const res = await fetch(
        `${API_URL}?q=${encodeURIComponent(term)}&limit=100&offset=0`,
        { headers: { Accept: "application/json" } }
      );

      if (!res.ok) {
        console.error(`[JobTech] Search "${term}" failed: ${res.status}`);
        continue;
      }

      const data: JobTechResponse = await res.json();
      if (!data.hits) continue;

      for (const job of data.hits) {
        const normalized = normalizeJobTechJob(job);
        if (normalized && !allJobs.has(normalized.id)) {
          allJobs.set(normalized.id, normalized);
        }
      }
    } catch (err) {
      console.error(`[JobTech] Error searching "${term}":`, err);
    }
  }

  const jobs = [...allJobs.values()];
  console.log(`[JobTech Sweden] Fetched ${jobs.length} tech jobs`);
  return jobs;
}

function normalizeJobTechJob(job: JobTechJob): NormalizedJob | null {
  if (!job.headline || !job.employer?.name) return null;

  const description = job.description?.text || "";
  if (description && hasNoVisaSignal(description)) return null;

  const company = job.employer.name;
  const city = job.workplace_address?.city || job.workplace_address?.municipality || "Sweden";
  const location = `${city}, Sweden`;

  // Extract skills from must_have + nice_to_have
  const apiSkills = [
    ...(job.must_have?.skills || []).map((s) => s.label),
    ...(job.nice_to_have?.skills || []).map((s) => s.label),
  ];
  const techStack = apiSkills.length > 0
    ? apiSkills.slice(0, 15)
    : extractTechStack(description + " " + job.headline);

  const now = new Date().toISOString();
  const url = job.application_details?.url || job.webpage_url || `https://jobsearch.api.jobtechdev.se/ad/${job.id}`;
  const remoteAnywhere = isRemoteAnywhere(description);

  return {
    id: generateJobId(company, job.headline, location),
    title: job.headline,
    company,
    companyNormalized: normalizeCompanyName(company),
    location,
    country: COUNTRY,
    countryName: getCountryName(COUNTRY),
    description: description || `${job.headline} at ${company} in ${location}`,
    descriptionSnippet: createSnippet(description || `${job.headline} at ${company}`),
    url,
    source: SOURCE,
    sources: [SOURCE],
    postedDate: job.publication_date || now,
    ingestedAt: now,
    updatedAt: now,
    expiresAt: job.application_deadline || calculateExpiryDate(),
    techStack,
    techStackLower: techStack.map((t) => t.toLowerCase()),
    ...(remoteAnywhere ? { remoteAnywhere: true } : {}),
    verifiedSponsor: false,
    sponsorTier: "inferred",
    ...(!job.experience_required ? { experienceLevel: "entry" as const } : {}),
    searchTokens: generateSearchTokens({
      title: job.headline,
      company,
      techStack,
      location,
    }),
    isActive: true,
  };
}
