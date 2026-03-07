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
} from "@/lib/normalizer";
import type { NormalizedJob, JobSource } from "@/lib/types";

const SOURCE: JobSource = "eures";

// EURES (European Employment Services) public search API
const API_URL = "https://eures.europa.eu/api/v1/jv/search";

// ISCO occupation codes for tech roles
const TECH_SEARCH_TERMS = [
  "software developer",
  "software engineer",
  "data engineer",
  "frontend developer",
  "backend developer",
  "devops engineer",
  "cloud engineer",
  "full stack developer",
  "machine learning engineer",
  "cybersecurity",
];

interface EuresJob {
  header: {
    handle: string;
    dataSourceName?: string;
  };
  job: {
    title: string;
    description?: string;
  };
  employer?: {
    name?: string;
    website?: string;
  };
  location?: {
    countryCode?: string;
    countryName?: string;
    cityName?: string;
    regionName?: string;
  };
  conditions?: {
    salaryFrom?: number;
    salaryTo?: number;
    salaryCurrency?: string;
  };
  publishedDate?: string;
  applicationUrl?: string;
}

interface EuresResponse {
  data?: {
    items?: EuresJob[];
    totalCount?: number;
  };
  // Alternative response shape
  items?: EuresJob[];
  totalCount?: number;
}

async function searchEures(query: string): Promise<EuresJob[]> {
  try {
    // EURES has multiple API endpoints — try the public search
    const params = new URLSearchParams({
      keyword: query,
      resultPerPage: "50",
      sortBy: "RELEVANCE",
    });

    const res = await fetch(`${API_URL}?${params}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "VisaHunt Job Aggregator (visa-hunt.com)",
      },
    });

    if (!res.ok) {
      // Try alternative EURES endpoint
      const altUrl = `https://eures.europa.eu/api/v1/jv/search?keyword=${encodeURIComponent(query)}&limit=50`;
      const altRes = await fetch(altUrl, {
        headers: { Accept: "application/json" },
      });
      if (!altRes.ok) return [];
      const altData = await altRes.json();
      return altData?.data?.items || altData?.items || [];
    }

    const data: EuresResponse = await res.json();
    return data?.data?.items || data?.items || [];
  } catch {
    return [];
  }
}

export async function fetchEuresJobs(): Promise<NormalizedJob[]> {
  try {
    const allJobs = new Map<string, NormalizedJob>();

    // Search for each tech term
    for (const term of TECH_SEARCH_TERMS) {
      const items = await searchEures(term);
      for (const item of items) {
        const normalized = normalizeEuresJob(item);
        if (normalized && !allJobs.has(normalized.id)) {
          allJobs.set(normalized.id, normalized);
        }
      }
    }

    const jobs = [...allJobs.values()];
    console.log(`[EURES] Fetched ${jobs.length} tech jobs from EU portal`);
    return jobs;
  } catch (err) {
    console.error("[EURES] Error:", err);
    return [];
  }
}

function normalizeEuresJob(item: EuresJob): NormalizedJob | null {
  const title = item.job?.title;
  const company = item.employer?.name || "European Employer";
  if (!title) return null;

  const description = (item.job?.description || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (description && hasNoVisaSignal(description)) return null;

  // Resolve country
  let country = "";
  if (item.location?.countryCode) {
    country = item.location.countryCode.toUpperCase();
    // Validate it's a real 2-letter code
    if (country.length !== 2) country = "";
  }
  if (!country && item.location?.countryName) {
    country = resolveCountryCode(item.location.countryName) || "";
  }
  if (!country) return null;

  // Build location string
  const locationParts = [
    item.location?.cityName,
    item.location?.regionName,
    item.location?.countryName || getCountryName(country),
  ].filter(Boolean);
  const location = locationParts.join(", ") || getCountryName(country);

  const remoteAnywhere = isRemoteAnywhere(description);
  const techStack = extractTechStack(title + " " + description);
  const now = new Date().toISOString();
  const handle = item.header?.handle || generateJobId(company, title, location);
  const url = item.applicationUrl ||
    `https://eures.europa.eu/eures-services/job-search/jv-details/${handle}`;

  return {
    id: generateJobId(company, title, location),
    title,
    company,
    companyNormalized: normalizeCompanyName(company),
    location,
    country,
    countryName: getCountryName(country),
    description: description || `${title} at ${company} in ${location}`,
    descriptionSnippet: createSnippet(description || `${title} at ${company} in ${location}`),
    url,
    source: SOURCE,
    sources: [SOURCE],
    postedDate: item.publishedDate || now,
    ingestedAt: now,
    updatedAt: now,
    expiresAt: calculateExpiryDate(),
    techStack,
    techStackLower: techStack.map((t) => t.toLowerCase()),
    ...(remoteAnywhere ? { remoteAnywhere: true } : {}),
    verifiedSponsor: false,
    sponsorTier: "inferred",
    ...(item.conditions?.salaryFrom ? {
      salaryMin: item.conditions.salaryFrom,
      salaryCurrency: item.conditions.salaryCurrency || "EUR",
    } : {}),
    ...(item.conditions?.salaryTo ? { salaryMax: item.conditions.salaryTo } : {}),
    searchTokens: generateSearchTokens({
      title,
      company,
      techStack,
      location,
    }),
    isActive: true,
  };
}
