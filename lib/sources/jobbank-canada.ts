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

const SOURCE: JobSource = "jobbank-canada";
const COUNTRY = "CA";

// RSS feed URL — Job Bank Canada provides Atom feeds
const SEARCH_TERMS = [
  "software+developer",
  "frontend+developer",
  "backend+developer",
  "devops+engineer",
  "data+scientist",
  "cloud+engineer",
  "full+stack+developer",
];

// Parse Atom/RSS XML entries
function parseAtomEntries(xml: string): Array<{
  title: string;
  link: string;
  summary: string;
  updated: string;
}> {
  const entries: Array<{ title: string; link: string; summary: string; updated: string }> = [];

  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    const title = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
    const link = entry.match(/<link[^>]*href="([^"]*)"[^>]*\/>/i)?.[1] ||
                 entry.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim() || "";
    const summary = entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1]?.trim() || "";
    const updated = entry.match(/<updated>([\s\S]*?)<\/updated>/i)?.[1]?.trim() || "";

    if (title && link) {
      entries.push({ title, link, summary, updated });
    }
  }

  return entries;
}

// Parse structured info from RSS summary
// Example: "Job Number: 123 | Location: Toronto, ON | Employer: Company Name | Salary: $80,000-$100,000"
function parseSummary(summary: string): {
  company?: string;
  location?: string;
  salary?: string;
} {
  const clean = summary.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  const company = clean.match(/(?:employer|company)\s*:\s*([^|;\n]+)/i)?.[1]?.trim();
  const location = clean.match(/(?:location|city)\s*:\s*([^|;\n]+)/i)?.[1]?.trim();
  const salary = clean.match(/(?:salary|wage)\s*:\s*([^|;\n]+)/i)?.[1]?.trim();
  return { company, location, salary };
}

// Parse salary string like "$80,000-$100,000" or "$45.00/hour"
function parseSalary(salary: string): { min?: number; max?: number } {
  const numbers = salary.match(/[\d,]+(?:\.\d+)?/g);
  if (!numbers || numbers.length === 0) return {};

  const values = numbers.map((n) => parseFloat(n.replace(/,/g, "")));
  const isHourly = /hour/i.test(salary);
  const multiplier = isHourly ? 2080 : 1; // ~40h/week * 52 weeks

  return {
    min: Math.round(values[0] * multiplier),
    max: values.length > 1 ? Math.round(values[1] * multiplier) : undefined,
  };
}

export async function fetchJobBankCanadaJobs(): Promise<NormalizedJob[]> {
  const allJobs = new Map<string, NormalizedJob>();

  for (const term of SEARCH_TERMS) {
    try {
      const rssUrl = `https://www.jobbank.gc.ca/jobsearch/feed/jobSearchRSSfeed?searchstring=${term}&rows=50`;
      const res = await fetch(rssUrl, {
        headers: { Accept: "application/atom+xml, application/xml, text/xml" },
      });

      if (!res.ok) {
        console.error(`[JobBank CA] RSS "${term}" failed: ${res.status}`);
        continue;
      }

      const xml = await res.text();
      const entries = parseAtomEntries(xml);

      for (const entry of entries) {
        const normalized = normalizeJobBankJob(entry);
        if (normalized && !allJobs.has(normalized.id)) {
          allJobs.set(normalized.id, normalized);
        }
      }
    } catch (err) {
      console.error(`[JobBank CA] Error for "${term}":`, err);
    }
  }

  const jobs = [...allJobs.values()];
  console.log(`[Job Bank Canada] Fetched ${jobs.length} tech jobs`);
  return jobs;
}

function normalizeJobBankJob(entry: {
  title: string;
  link: string;
  summary: string;
  updated: string;
}): NormalizedJob | null {
  if (!entry.title) return null;

  const parsed = parseSummary(entry.summary);
  const company = parsed.company || "Employer (via Job Bank)";
  const location = parsed.location
    ? `${parsed.location}, Canada`
    : "Canada";

  const description = entry.summary.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (description && hasNoVisaSignal(description)) return null;

  const techStack = extractTechStack(entry.title + " " + description);
  const now = new Date().toISOString();
  const remoteAnywhere = isRemoteAnywhere(description);

  // Parse salary
  let salaryMin: number | undefined;
  let salaryMax: number | undefined;
  if (parsed.salary) {
    const sal = parseSalary(parsed.salary);
    salaryMin = sal.min;
    salaryMax = sal.max;
  }

  return {
    id: generateJobId(company, entry.title, location),
    title: entry.title,
    company,
    companyNormalized: normalizeCompanyName(company),
    location,
    country: COUNTRY,
    countryName: getCountryName(COUNTRY),
    description: description || entry.title,
    descriptionSnippet: createSnippet(description || entry.title),
    url: entry.link,
    source: SOURCE,
    sources: [SOURCE],
    postedDate: entry.updated || now,
    ingestedAt: now,
    updatedAt: now,
    expiresAt: calculateExpiryDate(),
    ...(salaryMin ? { salaryMin, salaryCurrency: "CAD" } : {}),
    ...(salaryMax ? { salaryMax } : {}),
    techStack,
    techStackLower: techStack.map((t) => t.toLowerCase()),
    ...(remoteAnywhere ? { remoteAnywhere: true } : {}),
    verifiedSponsor: false,
    sponsorTier: "inferred",
    searchTokens: generateSearchTokens({
      title: entry.title,
      company,
      techStack,
      location,
    }),
    isActive: true,
  };
}
