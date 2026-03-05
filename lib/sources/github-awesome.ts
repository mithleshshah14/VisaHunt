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

const SOURCE: JobSource = "github-awesome";

// Lamiiine/Awesome-daily-list — daily updated JSON of visa-sponsored jobs
const GITHUB_RAW_URL =
  "https://raw.githubusercontent.com/Lamiiine/Awesome-daily-list/main/data/jobs.json";

interface GitHubAwesomeJob {
  title: string;
  company: string;
  location: string;
  url: string;
  description?: string;
  date?: string;
  tags?: string[];
}

export async function fetchGitHubAwesomeJobs(): Promise<NormalizedJob[]> {
  try {
    const res = await fetch(GITHUB_RAW_URL, { next: { revalidate: 0 } });

    if (!res.ok) {
      console.error(`[GitHub Awesome] Failed: ${res.status}`);
      return [];
    }

    const data: GitHubAwesomeJob[] = await res.json();
    const jobs: NormalizedJob[] = [];

    for (const job of data) {
      const normalized = normalizeGitHubJob(job);
      if (normalized) jobs.push(normalized);
    }

    console.log(`[GitHub Awesome] Fetched ${jobs.length} jobs`);
    return jobs;
  } catch (err) {
    console.error("[GitHub Awesome] Error:", err);
    return [];
  }
}

function normalizeGitHubJob(job: GitHubAwesomeJob): NormalizedJob | null {
  if (!job.title || !job.company || !job.url) return null;

  const country = resolveCountryCode(extractCountry(job.location || ""));
  if (!country) return null;

  const description = job.description || `${job.title} at ${job.company} in ${job.location}`;
  const techStack = extractTechStack(
    description + " " + (job.tags || []).join(" ")
  );
  const now = new Date().toISOString();

  return {
    id: generateJobId(job.company, job.title, job.location || ""),
    title: job.title,
    company: job.company,
    companyNormalized: normalizeCompanyName(job.company),
    location: job.location || "Not specified",
    country,
    countryName: getCountryName(country),
    description,
    descriptionSnippet: createSnippet(description),
    url: job.url,
    source: SOURCE,
    sources: [SOURCE],
    postedDate: job.date || now,
    ingestedAt: now,
    updatedAt: now,
    expiresAt: calculateExpiryDate(),
    techStack,
    techStackLower: techStack.map((t) => t.toLowerCase()),
    verifiedSponsor: false,
    sponsorTier: "source-listed",
    searchTokens: generateSearchTokens({
      title: job.title,
      company: job.company,
      techStack,
      location: job.location || "",
    }),
    isActive: true,
  };
}

function extractCountry(location: string): string {
  const parts = location.split(",").map((p) => p.trim());
  return parts[parts.length - 1] || "";
}
