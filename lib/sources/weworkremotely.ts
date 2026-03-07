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
  isRemoteAnywhere,
  isLocationRemoteAnywhere,
} from "@/lib/normalizer";
import type { NormalizedJob, JobSource } from "@/lib/types";

const SOURCE: JobSource = "weworkremotely";

// WeWorkRemotely has RSS feeds for different categories
const RSS_FEEDS = [
  "https://weworkremotely.com/categories/remote-programming-jobs.rss",
  "https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss",
  "https://weworkremotely.com/categories/remote-data-jobs.rss",
];

function parseRSSItems(xml: string): Array<{
  title: string;
  link: string;
  pubDate: string;
  description: string;
  company: string;
}> {
  const items: Array<{
    title: string;
    link: string;
    pubDate: string;
    description: string;
    company: string;
  }> = [];

  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const rawTitle =
      item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i)?.[1] ||
      item.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
    const link = item.match(/<link>([\s\S]*?)<\/link>/i)?.[1]?.trim() || "";
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() || "";
    const description =
      item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i)?.[1] ||
      item.match(/<description>([\s\S]*?)<\/description>/i)?.[1]?.trim() || "";

    // Title format: "Company: Job Title"
    let company = "";
    let title = rawTitle;
    const colonMatch = rawTitle.match(/^(.+?):\s*(.+)$/);
    if (colonMatch) {
      company = colonMatch[1].trim();
      title = colonMatch[2].trim();
    }

    if (title && link) {
      items.push({ title, link, pubDate, description, company });
    }
  }

  return items;
}

export async function fetchWeWorkRemotelyJobs(): Promise<NormalizedJob[]> {
  try {
    const allJobs: NormalizedJob[] = [];

    const results = await Promise.allSettled(
      RSS_FEEDS.map(async (feedUrl) => {
        const res = await fetch(feedUrl, {
          headers: {
            Accept: "application/rss+xml, application/xml, text/xml",
            "User-Agent": "VisaHunt Job Aggregator (visa-hunt.com)",
          },
        });
        if (!res.ok) return [];
        const xml = await res.text();
        return parseRSSItems(xml);
      })
    );

    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      for (const item of result.value) {
        const normalized = normalizeWWRJob(item);
        if (normalized) allJobs.push(normalized);
      }
    }

    console.log(`[WeWorkRemotely] Fetched ${allJobs.length} jobs from ${RSS_FEEDS.length} feeds`);
    return allJobs;
  } catch (err) {
    console.error("[WeWorkRemotely] Error:", err);
    return [];
  }
}

function normalizeWWRJob(item: {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  company: string;
}): NormalizedJob | null {
  if (!item.company) return null;

  const description = item.description
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (description && hasNoVisaSignal(description)) return null;

  // Most WWR jobs are remote-anywhere unless description says otherwise
  const remoteAnywhere =
    isRemoteAnywhere(description) ||
    isLocationRemoteAnywhere("Remote") ||
    !description.match(/\b(US only|USA only|UK only|EU only|US-based only)\b/i);

  // Try to extract country from description
  let country = resolveCountryFromLocation(description.slice(0, 300));
  if (!country) country = "US"; // Default for WWR

  const location = remoteAnywhere ? "Remote — Worldwide" : "Remote";
  const techStack = extractTechStack(item.title + " " + description);
  const now = new Date().toISOString();

  return {
    id: generateJobId(item.company, item.title, location),
    title: item.title,
    company: item.company,
    companyNormalized: normalizeCompanyName(item.company),
    location,
    country,
    countryName: getCountryName(country),
    description: description || `${item.title} at ${item.company}`,
    descriptionSnippet: createSnippet(description || `${item.title} at ${item.company}`),
    url: item.link,
    source: SOURCE,
    sources: [SOURCE],
    postedDate: item.pubDate ? new Date(item.pubDate).toISOString() : now,
    ingestedAt: now,
    updatedAt: now,
    expiresAt: calculateExpiryDate(),
    techStack,
    techStackLower: techStack.map((t) => t.toLowerCase()),
    ...(remoteAnywhere ? { remoteAnywhere: true } : {}),
    remote: "remote",
    verifiedSponsor: false,
    sponsorTier: "inferred",
    searchTokens: generateSearchTokens({
      title: item.title,
      company: item.company,
      techStack,
      location,
    }),
    isActive: true,
  };
}
