import {
  normalizeCompanyName,
  generateJobId,
  createSnippet,
  extractTechStack,
  generateSearchTokens,
  resolveCountryCode,
  resolveCountryFromLocation,
  getCountryName,
  calculateExpiryDate,
  hasNoVisaSignal,
  isRemoteAnywhere,
  isLocationRemoteAnywhere,
} from "@/lib/normalizer";
import type { NormalizedJob, JobSource } from "@/lib/types";

const SOURCE: JobSource = "hn-hiring";
const HN_API = "https://hacker-news.firebaseio.com/v0";

// Patterns indicating visa sponsorship
const VISA_PATTERNS = [
  /\bvisa\s*(?:sponsor|sponsorship)\b/i,
  /\bwill\s+sponsor\b/i,
  /\bsponsors?\s+(?:h1b|visa|work\s+permit)/i,
  /\bh1b\b/i,
  /\brelocation\s+(?:support|assist|package|offered)\b/i,
  /\bwork\s+permit\s+(?:support|sponsor|assist)/i,
];

function mentionsVisa(text: string): boolean {
  return VISA_PATTERNS.some((p) => p.test(text));
}

// Parse a HN comment into structured job info
// Format is typically: "Company | Location | Role | Details"
// or: "Company (https://company.com) | Remote | ..."
function parseHNComment(text: string): {
  company: string;
  location: string;
  title: string;
  url: string;
  description: string;
  hasVisa: boolean;
  isRemote: boolean;
} | null {
  // Strip HTML
  const clean = text
    .replace(/<a\s+href="([^"]*)"[^>]*>[^<]*<\/a>/gi, "$1")
    .replace(/<p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");

  // Get first line — usually "Company | Location | Role | ..."
  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const firstLine = lines[0];
  const parts = firstLine.split("|").map((p) => p.trim());

  if (parts.length < 2) return null; // Need at least company + something

  // Extract company (first part, remove URL if inline)
  let company = parts[0].replace(/https?:\/\/\S+/g, "").replace(/\([\s]*\)/g, "").trim();
  if (!company || company.length < 2 || company.length > 100) return null;

  // Extract URL from anywhere in the text
  const urlMatch = clean.match(/https?:\/\/[^\s<>"]+/);
  const url = urlMatch ? urlMatch[0] : "";

  // Try to identify location and role from remaining parts
  let location = "";
  let title = "";

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    // Skip parts that look like tech stacks or salary
    if (/^\$|salary|comp/i.test(part)) continue;

    // Check if it looks like a location
    if (!location && (
      /remote/i.test(part) ||
      /\b(san francisco|new york|london|berlin|amsterdam|toronto|singapore|sydney)\b/i.test(part) ||
      /\b(US|UK|EU|CA|DE|NL|SG|AU|ONSITE|REMOTE)\b/.test(part)
    )) {
      location = part;
      continue;
    }

    // First non-location part is likely the role
    if (!title && part.length > 3 && part.length < 100) {
      title = part;
    }
  }

  // If no title found, use a generic one
  if (!title) title = `Open Position at ${company}`;
  if (!location) location = "Unknown";

  const description = lines.slice(1).join(" ").trim();
  const fullText = clean;

  return {
    company,
    location,
    title,
    url: url || `https://news.ycombinator.com`,
    description: description || firstLine,
    hasVisa: mentionsVisa(fullText),
    isRemote: /\bremote\b/i.test(location) || isRemoteAnywhere(fullText),
  };
}

// Find the latest "Who is Hiring" thread
async function findLatestHiringThread(): Promise<number | null> {
  try {
    // whoishiring is a HN user that posts monthly threads
    const res = await fetch(`${HN_API}/user/whoishiring.json`);
    if (!res.ok) return null;

    const user = await res.json();
    if (!user?.submitted || user.submitted.length === 0) return null;

    // Check the first few submissions to find the latest "Who is Hiring"
    for (const id of user.submitted.slice(0, 6)) {
      const itemRes = await fetch(`${HN_API}/item/${id}.json`);
      if (!itemRes.ok) continue;

      const item = await itemRes.json();
      if (item?.title?.includes("Who is hiring?") || item?.title?.includes("Who Is Hiring?")) {
        // Check if it's from the current or last month
        const postDate = new Date(item.time * 1000);
        const monthsAgo = (Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (monthsAgo <= 2) {
          return id;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function fetchHNHiringJobs(): Promise<NormalizedJob[]> {
  const threadId = await findLatestHiringThread();
  if (!threadId) {
    console.log("[HN Hiring] No recent hiring thread found");
    return [];
  }

  try {
    // Get the thread to find comment IDs
    const threadRes = await fetch(`${HN_API}/item/${threadId}.json`);
    if (!threadRes.ok) return [];

    const thread = await threadRes.json();
    const commentIds: number[] = thread.kids || [];

    if (commentIds.length === 0) {
      console.log("[HN Hiring] Thread has no comments");
      return [];
    }

    // Fetch comments in batches (top-level only = job postings)
    const MAX_COMMENTS = 200; // Limit to avoid timeout
    const toFetch = commentIds.slice(0, MAX_COMMENTS);

    const BATCH_SIZE = 20;
    const allJobs: NormalizedJob[] = [];
    let totalComments = 0;
    let visaJobs = 0;

    for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
      const batch = toFetch.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((id) =>
          fetch(`${HN_API}/item/${id}.json`).then((r) => r.json())
        )
      );

      for (const result of results) {
        if (result.status !== "fulfilled" || !result.value?.text) continue;

        totalComments++;
        const comment = result.value;
        const parsed = parseHNComment(comment.text);
        if (!parsed) continue;

        // Only include jobs that mention visa/sponsorship OR are remote-anywhere
        if (!parsed.hasVisa && !parsed.isRemote) continue;

        const normalized = normalizeHNJob(parsed, comment.id, comment.time);
        if (normalized) {
          allJobs.push(normalized);
          if (parsed.hasVisa) visaJobs++;
        }
      }
    }

    console.log(`[HN Hiring] Parsed ${totalComments} comments, found ${allJobs.length} jobs (${visaJobs} visa-sponsored)`);
    return allJobs;
  } catch (err) {
    console.error("[HN Hiring] Error:", err);
    return [];
  }
}

function normalizeHNJob(
  parsed: {
    company: string;
    location: string;
    title: string;
    url: string;
    description: string;
    hasVisa: boolean;
    isRemote: boolean;
  },
  commentId: number,
  timestamp: number
): NormalizedJob | null {
  if (hasNoVisaSignal(parsed.description)) return null;

  // Resolve country from location
  let country = resolveCountryFromLocation(parsed.location);
  const remoteAnywhere = parsed.isRemote && isLocationRemoteAnywhere(parsed.location);

  if (!country && remoteAnywhere) {
    country = "US"; // Default for remote-anywhere HN jobs
  }
  if (!country) {
    // Try to resolve from description
    country = resolveCountryFromLocation(parsed.description.slice(0, 200));
  }
  if (!country) return null;

  const location = remoteAnywhere ? "Remote — Worldwide" : parsed.location;
  const techStack = extractTechStack(parsed.title + " " + parsed.description);
  const now = new Date().toISOString();
  const postedDate = timestamp ? new Date(timestamp * 1000).toISOString() : now;

  // Use the job URL if available, otherwise link to the HN comment
  const url = parsed.url.startsWith("http")
    ? parsed.url
    : `https://news.ycombinator.com/item?id=${commentId}`;

  return {
    id: generateJobId(parsed.company, parsed.title, location),
    title: parsed.title,
    company: parsed.company,
    companyNormalized: normalizeCompanyName(parsed.company),
    location,
    country,
    countryName: getCountryName(country),
    description: parsed.description,
    descriptionSnippet: createSnippet(parsed.description),
    url,
    source: SOURCE,
    sources: [SOURCE],
    postedDate,
    ingestedAt: now,
    updatedAt: now,
    expiresAt: calculateExpiryDate(),
    techStack,
    techStackLower: techStack.map((t) => t.toLowerCase()),
    ...(remoteAnywhere ? { remoteAnywhere: true } : {}),
    ...(parsed.isRemote ? { remote: "remote" as const } : {}),
    verifiedSponsor: false,
    sponsorTier: parsed.hasVisa ? "self-reported" : "inferred",
    searchTokens: generateSearchTokens({
      title: parsed.title,
      company: parsed.company,
      techStack,
      location,
    }),
    isActive: true,
  };
}
