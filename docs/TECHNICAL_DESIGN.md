# VisaHunt - Technical Design Document

## 1. System Architecture

```
                    +-------------------+
                    |   Vercel Edge     |
                    |   (Next.js 15)    |
                    +--------+----------+
                             |
              +--------------+--------------+
              |              |              |
        +-----v----+  +-----v----+  +------v-----+
        | App Pages |  | API Routes|  | Cron Routes |
        | (SSR/CSR) |  | (/api/*) |  | (/api/cron) |
        +----------+  +-----+----+  +------+------+
                             |              |
                    +--------v---------+    |
                    |  Business Logic   |<--+
                    |  (lib/*.ts)       |
                    +---+------+-------+
                        |      |
              +---------v+  +--v-----------+
              | Firestore |  | Upstash Redis|
              | (Admin)   |  | (Cache/Rate) |
              +-----------+  +--------------+

        External:
        +------------+  +----------+  +---------+
        | Job APIs   |  | Exchange |  | Discord |
        | (6 sources)|  | Rate API |  | Webhook |
        +------------+  +----------+  +---------+
```

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 15.3.3 |
| Runtime | React | 19.1.0 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.4.13 |
| Animation | Framer Motion | 12.28.1 |
| Database | Firebase Firestore (Admin SDK) | 13.6.1 |
| Cache | Upstash Redis | 1.36.2 |
| Auth | NextAuth.js (Google OAuth) | 4.24.13 |
| Email | Resend | 6.9.1 |
| Hosting | Vercel | - |
| Cron | GitHub Actions | - |
| DNS | Vercel (A record: 76.76.21.21) | - |

---

## 3. Database Schema

### 3.1 Firestore Collections (Database: `visahunt`)

#### `jobs` Collection
```typescript
interface NormalizedJob {
  id: string;                    // SHA256(company|title|location)[:16]
  title: string;
  company: string;
  location: string;
  country: string;               // ISO 2-letter (GB, US, DE, etc.)
  description: string;           // Truncated to 2000 chars
  descriptionSnippet: string;    // First 200 chars
  url: string;                   // Application URL
  sources: string[];             // ["arbeitnow", "greenhouse"]

  // Salary
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryMinINR?: number;
  salaryMaxINR?: number;

  // Tech
  techStack: string[];           // Extracted, max 15
  techStackLower: string[];      // Lowercase for queries
  searchTokens: string[];        // Words from title+company, max 30

  // Visa
  verifiedSponsor: boolean;
  sponsorTier?: string;
  sponsorDetails?: object;

  // Meta
  jobType?: string;              // full-time, contract, etc.
  experienceLevel?: string;      // junior, mid, senior, lead
  remote?: boolean;
  isActive: boolean;             // false = expired/reported
  postedDate: Timestamp;
  ingestedAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp;          // postedDate + 21 days
}
```

#### `sponsors` Collection
```typescript
interface Sponsor {
  id: string;                    // normalized_company__country
  companyName: string;
  companyNormalized: string;     // Lowercase, stripped
  country: string;
  registrySource: string;        // "uk_gov", "uscis", etc.
  licenseType?: string;
  validFrom?: string;
  validUntil?: string;
  visasSponsored?: number;
  topRoles?: string[];
  aliases?: string[];
  lastVerified: Timestamp;
}
```

#### `users` Collection
```typescript
interface User {
  id: string;                    // email
  email: string;
  name: string;
  image?: string;
  provider: string;              // "google"
  createdAt: Timestamp;
  savedJobs: string[];           // Job IDs, max 100
  appliedJobs: string[];         // Job IDs
  preferences?: {
    countries: string[];
    roles: string[];
    techStack: string[];
    experienceLevel: string;
  };
  alerts?: {
    enabled: boolean;
    frequency: "daily" | "weekly";
    lastSentAt?: Timestamp;
  };
}
```

#### `newsletter` Collection
```typescript
interface NewsletterSubscription {
  id: string;           // SHA256(email)
  email: string;
  subscribedAt: Timestamp;
  active: boolean;
}
```

#### `jobReports` Collection
```typescript
interface JobReport {
  id: string;           // jobId_email
  jobId: string;
  reportedBy: string;
  reason: string;
  createdAt: Timestamp;
}
```

#### `stats` Collection
```typescript
// Single doc: stats/global
interface GlobalStats {
  totalJobs: number;
  totalSponsors: number;
  jobsByCountry: Record<string, number>;
  lastUpdated: Timestamp;
}
```

#### `ingestion_logs` Collection
```typescript
interface IngestionLog {
  id: string;           // ingest-{timestamp}
  startedAt: Timestamp;
  completedAt: Timestamp;
  duration: number;
  sources: Record<string, number>;  // { arbeitnow: 45, greenhouse: 120 }
  totalFetched: number;
  newJobs: number;
  duplicatesSkipped: number;
  expired: number;
  errors: string[];
}
```

### 3.2 Required Composite Indexes

```
jobs: isActive ASC, country ASC, postedDate DESC
jobs: isActive ASC, verifiedSponsor ASC, postedDate DESC
jobs: isActive ASC, searchTokens ARRAY, postedDate DESC
jobs: isActive ASC, techStackLower ARRAY, postedDate DESC
jobs: isActive ASC, country ASC, verifiedSponsor ASC, postedDate DESC
```

---

## 4. API Design

### 4.1 Public Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/jobs/search` | No | Search/filter jobs with pagination |
| GET | `/api/jobs/[id]` | No | Job detail + similar jobs |
| GET | `/api/jobs/stats` | No | Global stats (cached 15min) |
| GET | `/api/jobs/trending` | No | Top 6 verified jobs (cached 1h) |
| POST | `/api/newsletter` | No | Subscribe to newsletter |

### 4.2 Authenticated Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/jobs/save` | Yes | Toggle save job |
| GET | `/api/jobs/saved` | Yes | List saved jobs |
| POST | `/api/jobs/apply` | Yes | Toggle applied status |
| GET | `/api/jobs/applied` | Yes | List applied jobs |
| POST | `/api/jobs/report` | Yes | Report job as no-visa |
| POST | `/api/jobs/alerts` | Yes | Create/update alert prefs (TODO) |
| GET | `/api/jobs/alerts` | Yes | Get alert settings (TODO) |
| DELETE | `/api/jobs/alerts` | Yes | Unsubscribe alerts (TODO) |

### 4.3 Cron Endpoints (CRON_SECRET required)

| Method | Path | Schedule | Duration | Description |
|--------|------|----------|----------|-------------|
| POST | `/api/cron/ingest-jobs` | Every 12h | 300s | Fetch, dedupe, verify, write jobs |
| POST | `/api/cron/ingest-sponsors` | Weekly (Sun) | 300s | Refresh UK gov sponsor list |
| POST | `/api/cron/update-exchange` | Daily | 30s | Fetch latest exchange rates |
| POST | `/api/cron/cleanup-expired` | Daily | 60s | Deactivate jobs > 21 days |
| POST | `/api/cron/send-alerts` | Daily | 300s | Send job alert emails (TODO) |

### 4.4 Search Query Strategy

```
Firestore query (fast, indexed):
  - isActive == true
  - country == X (if set)
  - verifiedSponsor == true (if set)
  - array-contains ONE of: techStackLower[0] OR searchTokens[0]
  - orderBy postedDate DESC
  - limit 200 (overfetch for post-filtering)

Post-filter (in JS):
  - experienceLevel match
  - remote == true
  - salaryMinINR >= threshold
  - postedDate >= cutoff
  - additional techStack items (2nd+)
  - keyword match in title/company

Return:
  - First `limit` results (default 20)
  - Cursor for next page
  - hasMore flag
```

---

## 5. Caching Architecture

### 5.1 Redis Cache Keys

| Key Pattern | TTL | Purpose |
|-------------|-----|---------|
| `jobs:search:{md5}` | 15 min | Search results (descriptions stripped) |
| `jobs:trending:{country}` | 1 hour | Trending jobs per country |
| `jobs:stats:global` | 15 min | Global job/sponsor counts |
| `exchange:rates:latest` | 24 hours | Exchange rates from API |
| `sponsor:lookup:{name}:{country}` | 24h (hit) / 1h (miss) | Sponsor verification results |

### 5.2 Cache Invalidation

- **On ingestion**: Delete `jobs:stats:global`, `jobs:trending:*`
- **On search**: Check Redis first, write-through on miss
- **On report**: Delete specific job from all caches (best-effort)
- **Fallback**: In-memory rate limiting when Redis is unavailable

---

## 6. Job Ingestion Pipeline

```
GitHub Actions (every 12h)
    |
    v
POST /api/cron/ingest-jobs (CRON_SECRET)
    |
    v
1. fetchAllSources() — parallel fetch from 6 APIs
    |  - Arbeitnow: 5 pages
    |  - Himalayas: 10 pages x 20 jobs
    |  - Greenhouse: 33 companies in parallel
    |  - LandingJobs: ~50 jobs
    |  - VisaSponsor.jobs: all jobs
    |  - GitHub Awesome: single JSON
    |
    v
2. Deduplicate — key: normalized(company)|title|country
    |  - Merge sources[] array
    |  - Keep longer description
    |
    v
3. Sponsor Verification (batch 25)
    |  - Exact match on companyNormalized
    |  - Fuzzy match (Levenshtein <= 2)
    |  - Redis cache per company
    |
    v
4. Salary Conversion
    |  - Fetch exchange rates (cached 24h)
    |  - Convert to INR: salaryMinINR, salaryMaxINR
    |
    v
5. Truncate descriptions to 2000 chars
    |
    v
6. Check existing jobs (batch 100)
    |  - Skip jobs already in Firestore
    |
    v
7. Write NEW jobs only (batch 250, 3 concurrent)
    |
    v
8. Delete expired jobs (> 21 days)
    |
    v
9. Update global stats + invalidate Redis
    |
    v
10. Discord webhook — top 10 new jobs
```

---

## 7. Authentication Flow

```
User clicks "Sign in with Google"
    |
    v
NextAuth → Google OAuth consent screen
    |
    v
Callback → NextAuth creates session (JWT)
    |
    v
Server: getServerSession() → user email
    |
    v
Firestore: upsert users/{email} doc
    |
    v
Client: useSession() → show profile, enable save/apply
```

**Protected routes**: Dashboard, save, apply, report — all check session server-side.

---

## 8. Deployment Architecture

### 8.1 Vercel
- **Framework**: Next.js 15
- **Build**: `next build` (SSR + SSG)
- **Region**: Auto (iad1 for US east)
- **Functions**: Serverless (default 10s timeout, cron routes 300s)
- **Domain**: visa-hunt.com (A record → 76.76.21.21)

### 8.2 GitHub Actions (Cron)
```yaml
# .github/workflows/cron-jobs.yml
schedule:
  - cron: "0 0,12 * * *"    # ingest-jobs (every 12h)
  - cron: "0 2 * * 0"       # ingest-sponsors (Sunday 2am)
  - cron: "0 3 * * *"       # cleanup-expired (daily 3am)
  - cron: "0 1 * * *"       # update-exchange (daily 1am)
```

### 8.3 Firebase
- **Project**: CareerPilot (shared with HuntWise)
- **Database**: Named database `visahunt`
- **Rules**: Deny-all (all access via Admin SDK)
- **No client SDK** — all Firestore ops go through API routes

### 8.4 Environment Variables
```
FIREBASE_SERVICE_ACCOUNT_KEY    # Base64-encoded JSON
UPSTASH_REDIS_REST_URL          # Redis endpoint
UPSTASH_REDIS_REST_TOKEN        # Redis auth
CRON_SECRET                     # Protects cron endpoints
NEXTAUTH_SECRET                 # JWT signing
GOOGLE_CLIENT_ID                # OAuth
GOOGLE_CLIENT_SECRET            # OAuth
DISCORD_JOBS_WEBHOOK_URL        # New job notifications
EXCHANGE_RATE_API_KEY           # Optional (fallback rates exist)
RESEND_API_KEY                  # For email alerts (TODO)
```

---

## 9. Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Search API (p95) | < 800ms | ~1.2s (needs Redis hit) |
| Job Detail API | < 500ms | ~600ms |
| Landing Page LCP | < 2.5s | Not measured |
| Ingestion Duration | < 180s | ~120s |
| Firestore Reads/Day | < 50K | ~20K |
| Redis Commands/Day | < 10K | ~3K |

---

## 10. Security Model

| Layer | Implementation |
|-------|---------------|
| Database access | Admin SDK only, deny-all client rules |
| Cron protection | `Authorization: Bearer ${CRON_SECRET}` |
| Auth | NextAuth JWT, server-side session validation |
| Rate limiting | Upstash Redis (IP-based for public, user-based for auth) |
| Input validation | Sanitize search queries, limit pagination |
| XSS | React auto-escaping, no `dangerouslySetInnerHTML` |
| CORS | Vercel defaults (same-origin) |

---

## 11. Monitoring & Observability

### Current
- Ingestion logs in Firestore (`ingestion_logs` collection)
- Discord webhook for new jobs
- Vercel function logs

### Planned
- Error alerting (Discord webhook on ingestion failure)
- Uptime monitoring (external ping)
- Analytics (Clarity or Posthog)
- Ingestion dashboard (admin panel)

---

## 12. Future Technical Considerations

1. **Full-text search**: Migrate to Algolia or Typesense when Firestore array-contains becomes limiting
2. **Edge caching**: Vercel Edge Config for static data (country lists, exchange rates)
3. **WebSocket**: Real-time job alerts for dashboard users
4. **CDN**: OG image generation via Vercel `@vercel/og`
5. **Database separation**: Move to dedicated Firestore project if CareerPilot costs spike
