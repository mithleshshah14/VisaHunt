// ============================================================
// Core Job Types
// ============================================================

export type SponsorTier = "government" | "source-listed" | "self-reported" | "inferred";
export type ExperienceLevel = "entry" | "mid" | "senior" | "lead" | "executive";
export type JobType = "full-time" | "part-time" | "contract" | "internship";
export type RemoteType = "onsite" | "hybrid" | "remote";
export type VisaType = "skilled-worker" | "blue-card" | "h1b" | "ict" | "general";
export type JobSource = "arbeitnow" | "visasponsor" | "github-awesome" | "himalayas" | "adzuna" | "reed";

export interface SponsorDetails {
  registrySource: string;
  licenseType?: string;
  validUntil?: string;
  visasSponsored?: number;
}

export interface NormalizedJob {
  id: string; // sha256(company + title + location)
  title: string;
  company: string;
  companyNormalized: string;
  location: string;
  country: string; // ISO 3166-1 alpha-2
  countryName: string;
  description: string;
  descriptionSnippet: string; // 300 chars
  url: string; // External apply link
  source: JobSource;
  sources: JobSource[]; // After dedup
  postedDate: string; // ISO date
  ingestedAt: string;
  updatedAt: string;
  expiresAt: string; // 30 days from ingestion
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryMinINR?: number;
  salaryMaxINR?: number;
  jobType?: JobType;
  experienceLevel?: ExperienceLevel;
  remote?: RemoteType;
  techStack: string[];
  techStackLower: string[];
  visaType?: VisaType;
  verifiedSponsor: boolean;
  sponsorTier: SponsorTier;
  sponsorDetails?: SponsorDetails;
  searchTokens: string[]; // Pre-computed for Firestore text search
  isActive: boolean;
}

// ============================================================
// Sponsor Types
// ============================================================

export interface Sponsor {
  id: string; // normalized_name + country
  companyName: string;
  companyNormalized: string;
  country: string;
  registrySource: string;
  licenseType?: string;
  validFrom?: string;
  validUntil?: string;
  visasSponsored?: number;
  topRoles: string[];
  aliases: string[];
  lastVerified: string;
}

// ============================================================
// User Types
// ============================================================

export interface User {
  id: string;
  email: string;
  name?: string;
  provider: string;
  createdAt: string;
  savedJobs: string[]; // Job IDs, max 100
  preferences: {
    countries: string[];
    roles: string[];
    techStack: string[];
    experienceLevel?: ExperienceLevel;
  };
  alertSettings: {
    enabled: boolean;
    frequency: "daily" | "weekly";
    lastSentAt?: string;
  };
}

// ============================================================
// Alert Types
// ============================================================

export interface Alert {
  id: string;
  email: string;
  userId?: string; // Nullable for anonymous
  countries: string[];
  roles: string[];
  techStack: string[];
  frequency: "daily" | "weekly";
  isActive: boolean;
  unsubscribeToken: string;
  lastSentAt?: string;
  matchCount: number;
  createdAt: string;
}

// ============================================================
// Visa Guide Types
// ============================================================

export interface VisaTypeInfo {
  name: string;
  salaryThreshold?: string;
  salaryThresholdINR?: string;
  processingTime: string;
  prPathway: boolean;
  description: string;
}

export interface CostBreakdown {
  item: string;
  costLocal: string;
  costINR: string;
}

export interface VisaGuide {
  countryCode: string;
  countryName: string;
  flag: string;
  visaTypes: VisaTypeInfo[];
  costBreakdown: CostBreakdown[];
  indiaSpecificNotes: string;
  averageSalaryTechINR: string;
  costOfLivingIndex: number; // Relative to Bangalore = 100
}

// ============================================================
// API Response Types
// ============================================================

export interface SearchFilters {
  q?: string;
  country?: string;
  techStack?: string[];
  experienceLevel?: ExperienceLevel;
  remote?: RemoteType;
  verifiedOnly?: boolean;
  salaryMin?: number;
  postedWithin?: number; // Days
  cursor?: string;
  limit?: number;
}

export interface SearchResponse {
  jobs: NormalizedJob[];
  totalCount: number;
  cursor?: string;
  hasMore: boolean;
}

export interface GlobalStats {
  totalJobs: number;
  totalSponsors: number;
  countriesCount: number;
  lastUpdated: string;
  jobsByCountry: Record<string, number>;
}

// ============================================================
// Ingestion Types
// ============================================================

export interface IngestionLog {
  id: string;
  source: JobSource | "sponsors";
  startedAt: string;
  completedAt?: string;
  jobsFetched: number;
  jobsNew: number;
  jobsUpdated: number;
  jobsSkipped: number;
  errors: string[];
  status: "running" | "completed" | "failed";
}

// ============================================================
// Country Data
// ============================================================

export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  visaTypes: string[];
}

export const SUPPORTED_COUNTRIES: CountryInfo[] = [
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", visaTypes: ["Skilled Worker"] },
  { code: "DE", name: "Germany", flag: "🇩🇪", visaTypes: ["EU Blue Card", "Job Seeker"] },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", visaTypes: ["Highly Skilled Migrant"] },
  { code: "CA", name: "Canada", flag: "🇨🇦", visaTypes: ["LMIA", "Express Entry"] },
  { code: "US", name: "United States", flag: "🇺🇸", visaTypes: ["H-1B", "L-1", "O-1"] },
  { code: "IE", name: "Ireland", flag: "🇮🇪", visaTypes: ["Critical Skills"] },
  { code: "SE", name: "Sweden", flag: "🇸🇪", visaTypes: ["Work Permit"] },
  { code: "DK", name: "Denmark", flag: "🇩🇰", visaTypes: ["Pay Limit Scheme"] },
  { code: "AU", name: "Australia", flag: "🇦🇺", visaTypes: ["Skilled Worker 482"] },
  { code: "SG", name: "Singapore", flag: "🇸🇬", visaTypes: ["Employment Pass"] },
  { code: "FR", name: "France", flag: "🇫🇷", visaTypes: ["Talent Passport"] },
];

export const COUNTRY_MAP = Object.fromEntries(
  SUPPORTED_COUNTRIES.map((c) => [c.code, c])
);
