import crypto from "crypto";

/**
 * Normalize a company name for deduplication and sponsor matching.
 * "Delivery Hero SE" → "delivery hero"
 * "Booking.com B.V." → "booking.com"
 */
export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Remove common suffixes
    .replace(
      /\b(inc|ltd|llc|gmbh|ag|se|bv|b\.v\.|plc|corp|corporation|limited|pvt|private|co|company|group|holdings|international|technologies|technology|tech|software|solutions|services|consulting)\b\.?/gi,
      ""
    )
    // Remove parenthetical info
    .replace(/\(.*?\)/g, "")
    // Collapse whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generate a stable hash ID for a job based on company + title + location.
 * This ensures the same job from different sources gets the same ID.
 */
export function generateJobId(
  company: string,
  title: string,
  location: string
): string {
  const key = `${normalizeCompanyName(company)}|${title.toLowerCase().trim()}|${location.toLowerCase().trim()}`;
  return crypto.createHash("sha256").update(key).digest("hex").slice(0, 16);
}

/**
 * Generate a deduplication key for a job.
 */
export function generateDedupeKey(
  company: string,
  title: string,
  country: string
): string {
  return `${normalizeCompanyName(company)}|${title.toLowerCase().trim()}|${country.toUpperCase()}`;
}

/**
 * Create a snippet from a description (max 300 chars).
 */
export function createSnippet(description: string, maxLength = 300): string {
  const cleaned = description
    .replace(/<[^>]*>/g, "") // Strip HTML
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength - 3).replace(/\s\S*$/, "") + "...";
}

/**
 * Extract tech stack from job description using keyword matching.
 */
const TECH_KEYWORDS = new Set([
  "javascript", "typescript", "python", "java", "go", "golang", "rust",
  "c++", "c#", "ruby", "php", "swift", "kotlin", "scala", "elixir",
  "react", "angular", "vue", "svelte", "next.js", "nextjs", "nuxt",
  "node.js", "nodejs", "express", "fastify", "django", "flask", "rails",
  "spring", "spring boot", ".net", "asp.net",
  "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s",
  "terraform", "ansible", "jenkins", "ci/cd", "github actions",
  "postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch",
  "graphql", "rest", "grpc", "kafka", "rabbitmq",
  "react native", "flutter", "ios", "android",
  "machine learning", "ml", "ai", "deep learning", "nlp",
  "data engineering", "spark", "airflow", "databricks",
  "figma", "css", "tailwind", "sass",
]);

export function extractTechStack(description: string): string[] {
  const lower = description.toLowerCase();
  const found: string[] = [];

  for (const tech of TECH_KEYWORDS) {
    // Word boundary check
    const regex = new RegExp(`\\b${tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (regex.test(lower)) {
      // Use the canonical casing
      found.push(tech);
    }
  }

  return [...new Set(found)].slice(0, 15); // Max 15 techs
}

/**
 * Generate search tokens for Firestore array-contains queries.
 */
export function generateSearchTokens(job: {
  title: string;
  company: string;
  techStack: string[];
  location: string;
}): string[] {
  const tokens = new Set<string>();

  // Title words
  job.title
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .forEach((w) => tokens.add(w));

  // Company name
  tokens.add(job.company.toLowerCase().trim());

  // Tech stack
  job.techStack.forEach((t) => tokens.add(t.toLowerCase()));

  // Location words
  job.location
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((w) => w.length > 2)
    .forEach((w) => tokens.add(w));

  return [...tokens].slice(0, 30); // Firestore limit
}

/**
 * Calculate Levenshtein distance for fuzzy sponsor matching.
 */
export function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b.charAt(i - 1) === a.charAt(j - 1)
          ? matrix[i - 1][j - 1]
          : Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Map country names/codes to ISO 3166-1 alpha-2.
 */
const COUNTRY_ALIASES: Record<string, string> = {
  "united kingdom": "GB", uk: "GB", england: "GB", britain: "GB",
  germany: "DE", deutschland: "DE",
  netherlands: "NL", holland: "NL",
  canada: "CA",
  "united states": "US", usa: "US", "united states of america": "US",
  ireland: "IE",
  sweden: "SE",
  denmark: "DK",
  australia: "AU",
  singapore: "SG",
  france: "FR",
  spain: "ES",
  italy: "IT",
  switzerland: "CH",
  austria: "AT",
  belgium: "BE",
  norway: "NO",
  finland: "FI",
  poland: "PL",
  portugal: "PT",
  "czech republic": "CZ", czechia: "CZ",
  luxembourg: "LU",
  japan: "JP",
  "south korea": "KR", korea: "KR",
  "new zealand": "NZ",
  "united arab emirates": "AE", uae: "AE",
};

export function resolveCountryCode(input: string): string {
  if (!input) return "";
  const upper = input.toUpperCase().trim();
  if (upper.length === 2) return upper;
  return COUNTRY_ALIASES[input.toLowerCase().trim()] || "";
}

const COUNTRY_NAMES: Record<string, string> = {
  GB: "United Kingdom", DE: "Germany", NL: "Netherlands", CA: "Canada",
  US: "United States", IE: "Ireland", SE: "Sweden", DK: "Denmark",
  AU: "Australia", SG: "Singapore", FR: "France", ES: "Spain",
  IT: "Italy", CH: "Switzerland", AT: "Austria", BE: "Belgium",
  NO: "Norway", FI: "Finland", PL: "Poland", PT: "Portugal",
  CZ: "Czech Republic", LU: "Luxembourg", JP: "Japan", KR: "South Korea",
  NZ: "New Zealand", AE: "United Arab Emirates",
};

export function getCountryName(code: string): string {
  return COUNTRY_NAMES[code.toUpperCase()] || code;
}

/**
 * Calculate expiry date (30 days from now).
 */
export function calculateExpiryDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString();
}
