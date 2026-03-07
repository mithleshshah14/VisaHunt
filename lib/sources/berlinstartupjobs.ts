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

const SOURCE: JobSource = "berlinstartupjobs";
const RSS_URL = "https://berlinstartupjobs.com/engineering/feed/";
const COUNTRY = "DE";

// Parse RSS 2.0 XML
function parseRSSItems(xml: string): Array<{
  title: string;
  link: string;
  creator: string;
  pubDate: string;
  categories: string[];
  description: string;
}> {
  const items: Array<{
    title: string;
    link: string;
    creator: string;
    pubDate: string;
    categories: string[];
    description: string;
  }> = [];

  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i)?.[1] ||
                  item.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "";
    const link = item.match(/<link>([\s\S]*?)<\/link>/i)?.[1]?.trim() || "";
    const creator = item.match(/<dc:creator><!\[CDATA\[([\s\S]*?)\]\]><\/dc:creator>/i)?.[1] ||
                    item.match(/<dc:creator>([\s\S]*?)<\/dc:creator>/i)?.[1]?.trim() || "";
    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() || "";
    const description = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i)?.[1] ||
                        item.match(/<description>([\s\S]*?)<\/description>/i)?.[1]?.trim() || "";

    // Extract all categories
    const categories: string[] = [];
    const catRegex = /<category><!\[CDATA\[([\s\S]*?)\]\]><\/category>/gi;
    let catMatch;
    while ((catMatch = catRegex.exec(item)) !== null) {
      categories.push(catMatch[1]);
    }

    if (title && link) {
      items.push({ title, link, creator, pubDate, categories, description });
    }
  }

  return items;
}

export async function fetchBerlinStartupJobs(): Promise<NormalizedJob[]> {
  try {
    const res = await fetch(RSS_URL, {
      headers: { Accept: "application/rss+xml, application/xml, text/xml" },
    });

    if (!res.ok) {
      console.error(`[BerlinStartupJobs] RSS failed: ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const items = parseRSSItems(xml);

    const jobs: NormalizedJob[] = [];
    for (const item of items) {
      const normalized = normalizeBSJJob(item);
      if (normalized) jobs.push(normalized);
    }

    console.log(`[BerlinStartupJobs] Fetched ${jobs.length} jobs from RSS`);
    return jobs;
  } catch (err) {
    console.error("[BerlinStartupJobs] Error:", err);
    return [];
  }
}

function normalizeBSJJob(item: {
  title: string;
  link: string;
  creator: string;
  pubDate: string;
  categories: string[];
  description: string;
}): NormalizedJob | null {
  // Title often includes company: "Senior Frontend Developer at Company Name"
  let title = item.title;
  let company = item.creator;

  // If creator is empty, try to extract from title
  if (!company) {
    const atMatch = title.match(/^(.+?)\s+at\s+(.+)$/i);
    if (atMatch) {
      title = atMatch[1].trim();
      company = atMatch[2].trim();
    } else {
      company = "Berlin Startup";
    }
  }

  const description = item.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (description && hasNoVisaSignal(description)) return null;

  const location = "Berlin, Germany";
  const techStack = extractTechStack(
    title + " " + description + " " + item.categories.join(" ")
  );
  const now = new Date().toISOString();
  const remoteAnywhere = isRemoteAnywhere(description);

  return {
    id: generateJobId(company, title, location),
    title,
    company,
    companyNormalized: normalizeCompanyName(company),
    location,
    country: COUNTRY,
    countryName: getCountryName(COUNTRY),
    description: description || `${title} at ${company} in Berlin`,
    descriptionSnippet: createSnippet(description || `${title} at ${company} in Berlin`),
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
    verifiedSponsor: false,
    sponsorTier: "inferred",
    searchTokens: generateSearchTokens({
      title,
      company,
      techStack,
      location,
    }),
    isActive: true,
  };
}
