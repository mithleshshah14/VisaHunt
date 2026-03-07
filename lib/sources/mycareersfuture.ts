import {
  normalizeCompanyName,
  generateJobId,
  createSnippet,
  extractTechStack,
  generateSearchTokens,
  getCountryName,
  calculateExpiryDate,
  hasNoVisaSignal,
} from "@/lib/normalizer";
import type { NormalizedJob, JobSource } from "@/lib/types";

const SOURCE: JobSource = "mycareersfuture";
const API_URL = "https://api.mycareersfuture.gov.sg/v2/jobs";
const COUNTRY = "SG";

// Tech-related search terms to fetch relevant jobs
const SEARCH_TERMS = [
  "software engineer",
  "frontend developer",
  "backend developer",
  "full stack developer",
  "devops engineer",
  "data engineer",
  "data scientist",
  "machine learning",
  "cloud engineer",
  "mobile developer",
];

interface MCFJob {
  uuid: string;
  title: string;
  description: string;
  postedCompany?: { name: string };
  address?: { postalCode?: string; block?: string; street?: string };
  salary?: { minimum?: number; maximum?: number; type?: { salaryType?: string } };
  skills?: Array<{ skill: string }>;
  minimumYearsExperience?: number;
  employmentTypes?: string[];
  positionLevels?: string[];
  categories?: Array<{ category: string }>;
  metadata?: { jobDetailsUrl?: string; createdAt?: string };
  numberOfVacancies?: number;
}

interface MCFResponse {
  results: MCFJob[];
  total: number;
}

export async function fetchMyCareersFutureJobs(): Promise<NormalizedJob[]> {
  const allJobs = new Map<string, NormalizedJob>();

  // Search multiple tech terms to get broad coverage
  for (const term of SEARCH_TERMS) {
    try {
      const res = await fetch(
        `${API_URL}?limit=50&page=0&sortBy=new_posting_date&search=${encodeURIComponent(term)}`,
        { headers: { Accept: "application/json" } }
      );

      if (!res.ok) {
        console.error(`[MCF] Search "${term}" failed: ${res.status}`);
        continue;
      }

      const data: MCFResponse = await res.json();
      if (!data.results) continue;

      for (const job of data.results) {
        const normalized = normalizeMCFJob(job);
        if (normalized && !allJobs.has(normalized.id)) {
          allJobs.set(normalized.id, normalized);
        }
      }
    } catch (err) {
      console.error(`[MCF] Error searching "${term}":`, err);
    }
  }

  const jobs = [...allJobs.values()];
  console.log(`[MyCareersFuture] Fetched ${jobs.length} tech jobs from ${SEARCH_TERMS.length} searches`);
  return jobs;
}

function normalizeMCFJob(job: MCFJob): NormalizedJob | null {
  if (!job.title || !job.postedCompany?.name) return null;

  const description = (job.description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (description && hasNoVisaSignal(description)) return null;

  const company = job.postedCompany.name;
  const location = "Singapore";
  const skills = (job.skills || []).map((s) => s.skill);
  const techStack = skills.length > 0
    ? skills.slice(0, 15)
    : extractTechStack(description + " " + job.title);
  const now = new Date().toISOString();

  // Salary — MCF provides monthly salary, convert to annual
  let salaryMin: number | undefined;
  let salaryMax: number | undefined;
  const isMonthly = job.salary?.type?.salaryType === "Monthly";
  if (job.salary?.minimum) {
    salaryMin = isMonthly ? job.salary.minimum * 12 : job.salary.minimum;
  }
  if (job.salary?.maximum) {
    salaryMax = isMonthly ? job.salary.maximum * 12 : job.salary.maximum;
  }

  const url = job.metadata?.jobDetailsUrl
    ? `https://www.mycareersfuture.gov.sg${job.metadata.jobDetailsUrl}`
    : `https://www.mycareersfuture.gov.sg/job/${job.uuid}`;

  // Map experience
  let experienceLevel: NormalizedJob["experienceLevel"];
  const years = job.minimumYearsExperience || 0;
  if (years <= 2) experienceLevel = "entry";
  else if (years <= 5) experienceLevel = "mid";
  else if (years <= 10) experienceLevel = "senior";
  else experienceLevel = "lead";

  return {
    id: generateJobId(company, job.title, location),
    title: job.title,
    company,
    companyNormalized: normalizeCompanyName(company),
    location,
    country: COUNTRY,
    countryName: getCountryName(COUNTRY),
    description: description || `${job.title} at ${company} in Singapore`,
    descriptionSnippet: createSnippet(description || `${job.title} at ${company} in Singapore`),
    url,
    source: SOURCE,
    sources: [SOURCE],
    postedDate: job.metadata?.createdAt || now,
    ingestedAt: now,
    updatedAt: now,
    expiresAt: calculateExpiryDate(),
    ...(salaryMin ? { salaryMin } : {}),
    ...(salaryMax ? { salaryMax } : {}),
    salaryCurrency: "SGD",
    techStack,
    techStackLower: techStack.map((t) => t.toLowerCase()),
    verifiedSponsor: false,
    sponsorTier: "source-listed",
    ...(experienceLevel ? { experienceLevel } : {}),
    searchTokens: generateSearchTokens({
      title: job.title,
      company,
      techStack,
      location,
    }),
    isActive: true,
  };
}
