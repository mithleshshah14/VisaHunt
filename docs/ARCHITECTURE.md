# VisaHunt - Architecture Document

## 1. High-Level Architecture

VisaHunt follows a **serverless-first** architecture deployed on Vercel with Firebase Firestore as the primary database and Upstash Redis for caching.

```
Users (Browser)
    |
    v
Vercel CDN / Edge Network
    |
    +--- Static Assets (CSS, JS, images)
    |
    +--- Server-Side Rendered Pages (Next.js App Router)
    |
    +--- API Routes (Serverless Functions)
            |
            +--- Firebase Firestore (Admin SDK)
            |       |
            |       +--- jobs collection
            |       +--- sponsors collection
            |       +--- users collection
            |       +--- newsletter collection
            |       +--- jobReports collection
            |       +--- stats collection
            |       +--- ingestion_logs collection
            |
            +--- Upstash Redis
            |       |
            |       +--- Search result cache (15 min)
            |       +--- Exchange rate cache (24h)
            |       +--- Sponsor lookup cache (24h)
            |       +--- Rate limiting counters
            |
            +--- External APIs
                    |
                    +--- Job Sources (6 APIs)
                    +--- Exchange Rate API
                    +--- Discord Webhooks
                    +--- Resend (Email, planned)

GitHub Actions (Cron)
    |
    +--- ingest-jobs (every 12h)
    +--- ingest-sponsors (weekly)
    +--- cleanup-expired (daily)
    +--- update-exchange (daily)
```

---

## 2. Directory Structure

```
C:\MyWeb\VisaHunt\
|-- app/
|   |-- layout.tsx              # Root layout (fonts, providers, nav, footer)
|   |-- page.tsx                # Landing page
|   |-- globals.css             # Tailwind + custom styles
|   |-- api/
|   |   |-- auth/[...nextauth]/route.ts   # Google OAuth
|   |   |-- cron/
|   |   |   |-- ingest-jobs/route.ts      # Job aggregation pipeline
|   |   |   |-- ingest-sponsors/route.ts  # Sponsor registry refresh
|   |   |   |-- cleanup-expired/route.ts  # Deactivate old jobs
|   |   |   |-- update-exchange/route.ts  # Exchange rate refresh
|   |   |-- jobs/
|   |   |   |-- search/route.ts           # Search with filters + pagination
|   |   |   |-- [id]/route.ts             # Job detail
|   |   |   |-- stats/route.ts            # Global counts
|   |   |   |-- trending/route.ts         # Top verified jobs
|   |   |   |-- save/route.ts             # Toggle save (auth)
|   |   |   |-- saved/route.ts            # List saved (auth)
|   |   |   |-- apply/route.ts            # Toggle applied (auth)
|   |   |   |-- applied/route.ts          # List applied (auth)
|   |   |   |-- report/route.ts           # Report no-visa (auth)
|   |   |-- newsletter/route.ts           # Email subscription
|   |-- blog/page.tsx                     # Blog index (stub)
|   |-- contact/
|   |   |-- layout.tsx
|   |   |-- page.tsx                      # Contact form (stub)
|   |-- dashboard/page.tsx                # User dashboard
|   |-- faq/
|   |   |-- layout.tsx
|   |   |-- page.tsx                      # FAQ (stub)
|   |-- jobs/
|   |   |-- layout.tsx
|   |   |-- page.tsx                      # Job search/browse
|   |   |-- [id]/page.tsx                 # Job detail
|   |-- privacy/page.tsx                  # Privacy policy (stub)
|   |-- salary-comparison/
|   |   |-- layout.tsx
|   |   |-- page.tsx                      # Salary tool
|   |-- sponsors/page.tsx                 # Verified sponsors list
|   |-- terms/page.tsx                    # Terms of service (stub)
|   |-- visa-guides/
|       |-- page.tsx                      # All guides index
|       |-- [country]/page.tsx            # Country-specific guide
|
|-- components/
|   |-- jobs/
|   |   |-- JobCard.tsx                   # Job listing card
|   |   |-- JobFilters.tsx                # Sidebar filter panel
|   |-- layout/
|   |   |-- Navbar.tsx                    # Global navigation
|   |   |-- Footer.tsx                    # Global footer
|   |-- providers/
|   |   |-- AuthProvider.tsx              # NextAuth session wrapper
|   |   |-- SavedJobsProvider.tsx         # Saved jobs context
|   |   |-- AppliedJobsProvider.tsx       # Applied jobs context
|   |-- sponsors/                         # Sponsor components
|   |-- ui/                              # Shared UI primitives
|
|-- lib/
|   |-- auth.ts                           # NextAuth config (Google provider)
|   |-- exchange.ts                       # Exchange rate fetching + conversion
|   |-- firebaseAdmin.ts                  # Firebase Admin SDK init (named DB)
|   |-- normalizer.ts                     # Job normalization + tech extraction
|   |-- redis.ts                          # Upstash Redis client + helpers
|   |-- sponsors.ts                       # Sponsor verification logic
|   |-- types.ts                          # All TypeScript interfaces + constants
|   |-- utils.ts                          # Shared utilities
|   |-- sources/
|       |-- arbeitnow.ts                  # Arbeitnow API source
|       |-- github-awesome.ts             # GitHub awesome-list source
|       |-- greenhouse.ts                 # Greenhouse ATS source (33 cos)
|       |-- himalayas.ts                  # Himalayas API source
|       |-- landingjobs.ts                # LandingJobs API source
|       |-- visasponsor.ts                # VisaSponsor.jobs API source
|
|-- public/
|   |-- favicon.svg
|   |-- logo.svg
|
|-- .github/
|   |-- workflows/
|       |-- cron-jobs.yml                 # GitHub Actions cron schedules
|
|-- docs/                                 # Project documentation
|-- next.config.mjs
|-- tailwind.config.ts
|-- vercel.json
|-- package.json
|-- tsconfig.json
```

---

## 3. Data Flow Patterns

### 3.1 Job Ingestion Flow

```
GitHub Actions Timer
    |
    v
POST /api/cron/ingest-jobs
    |
    v
fetchAllSources() -----> [6 source adapters in parallel]
    |                          |
    |                     Each returns NormalizedJob[]
    |                          |
    v                          v
Combine all jobs ---------> Deduplicate by company|title|country
    |
    v
Sponsor Verification (batch 25)
    |  - Check Redis cache first
    |  - Firestore exact match on companyNormalized
    |  - Fuzzy match (Levenshtein <= 2)
    |  - Cache result in Redis
    |
    v
Salary Conversion
    |  - Fetch exchange rates (Redis cache 24h)
    |  - Convert to INR
    |
    v
Filter existing jobs (batch 100 Firestore reads)
    |
    v
Write NEW jobs only (batch 250, 3 concurrent)
    |
    v
Cleanup expired (isActive = false where expiresAt < now)
    |
    v
Update stats + invalidate Redis caches
    |
    v
Discord webhook (top 10 new jobs)
```

### 3.2 Search Flow

```
User types query / selects filters
    |
    v
URL params updated (shareable state)
    |
    v
GET /api/jobs/search?q=react&country=GB&...
    |
    v
Check Redis cache (MD5 of all params)
    |--- Cache HIT --> return cached results
    |
    |--- Cache MISS:
    v
Build Firestore query
    |  - Always: isActive == true
    |  - Optional: country, verifiedSponsor
    |  - One array-contains: techStackLower[0] OR searchTokens[0]
    |  - orderBy: postedDate DESC
    |  - limit: 10x requested (for post-filtering headroom)
    |
    v
Post-filter in JavaScript
    |  - experienceLevel, remote, salaryMinINR, postedWithin
    |  - Additional techStack items
    |  - Text search in title/company
    |
    v
Cache result in Redis (15 min, descriptions stripped)
    |
    v
Return { jobs, total, hasMore, cursor }
```

### 3.3 Authentication Flow

```
User clicks "Sign in with Google"
    |
    v
NextAuth redirect to Google OAuth
    |
    v
Google returns auth code
    |
    v
NextAuth exchanges for tokens, creates JWT session
    |
    v
Callback: upsert user doc in Firestore (users/{email})
    |
    v
Client: useSession() provides user info
    |
    v
Protected API routes: getServerSession() validates JWT
```

---

## 4. Key Design Decisions

### 4.1 Why Named Firestore Database?
- Shares Firebase project with HuntWise AI (CareerPilot)
- Named database `visahunt` provides complete isolation
- Single service account key for both apps
- Cost-efficient: both under Spark free tier

### 4.2 Why GitHub Actions for Cron (not Vercel Cron)?
- Vercel Hobby plan limits cron to 1 per day
- GitHub Actions: unlimited cron jobs, free for public repos
- Can run multiple schedules independently
- Better logging and retry mechanisms

### 4.3 Why Firestore (not PostgreSQL)?
- Zero infrastructure management
- Free tier generous for MVP (50K reads, 20K writes/day)
- Real-time capabilities for future features
- Same ecosystem as HuntWise (shared knowledge)
- Trade-off: limited query flexibility (no JOINs, single array-contains)

### 4.4 Why Post-Filtering?
- Firestore composite indexes are expensive to maintain
- Each new filter combination needs a new index
- Post-filtering with overfetch (10x limit) is simpler
- Acceptable for current scale (< 5K jobs total)
- Will migrate to Algolia/Typesense if scale demands

### 4.5 Why No Client-Side Firestore?
- All access via Admin SDK through API routes
- Deny-all Firestore security rules
- Prevents client-side data leaks
- Server-side rate limiting and validation
- Consistent with HuntWise architecture

---

## 5. Scalability Considerations

### 5.1 Current Bottlenecks
| Component | Limit | Mitigation |
|-----------|-------|------------|
| Firestore reads | 50K/day (free) | Redis caching (15 min) |
| Firestore writes | 20K/day (free) | Only write NEW jobs |
| Redis commands | 10K/day (free) | Efficient key design |
| Vercel functions | 100GB-hours (free) | Short function durations |
| Ingestion time | 300s max | Parallel fetching, batch writes |

### 5.2 Scaling Path
1. **1K-5K jobs**: Current architecture is fine
2. **5K-20K jobs**: Add Algolia for full-text search, increase Redis TTLs
3. **20K-100K jobs**: Dedicated Firestore project, Blaze plan, consider PostgreSQL
4. **100K+**: Full migration to PostgreSQL + Elasticsearch

### 5.3 Cost Projections
| Scale | Firestore | Redis | Vercel | Total/Month |
|-------|-----------|-------|--------|-------------|
| MVP (< 5K jobs) | Free | Free | Free | $0 |
| Growth (5-20K) | ~$25 | $10 | Free | ~$35 |
| Scale (20-100K) | ~$100 | $25 | $20 | ~$145 |

---

## 6. Error Handling Strategy

### 6.1 Ingestion Errors
- Individual source failures don't block other sources
- Failed sources return empty array, logged as warnings
- Ingestion continues with available jobs
- Error summary in `ingestion_logs` collection
- Discord alert on 0-job ingestion (planned)

### 6.2 API Errors
- Consistent JSON error format: `{ "error": "message" }`
- Appropriate HTTP status codes
- Rate limiting returns 429 with retry-after hint
- Firestore errors caught and returned as 500

### 6.3 Client Errors
- Optimistic UI with rollback on error
- Toast notifications for user-facing errors
- Retry logic for network failures (fetch)
- Graceful degradation when features unavailable

---

## 7. Security Architecture

```
                    Public Internet
                         |
                    +----v-----+
                    | Vercel   |
                    | Edge CDN |
                    +----+-----+
                         |
              +----------+-----------+
              |                      |
        Public Routes          Protected Routes
        (no auth)              (session required)
              |                      |
              v                      v
        Rate Limiting          getServerSession()
        (Redis IP-based)       (JWT validation)
              |                      |
              v                      v
        Firestore              Firestore
        (Admin SDK)            (Admin SDK)
        (read-only)            (read-write)

        Cron Routes
              |
              v
        CRON_SECRET header check
              |
              v
        Firestore (Admin SDK)
        (full access)
```

### Key Security Measures:
1. **No client-side Firestore** — deny-all rules
2. **Admin SDK only** — service account with server-side access
3. **CRON_SECRET** — prevents unauthorized cron triggering
4. **Rate limiting** — Upstash Redis per IP/user
5. **Input sanitization** — search queries stripped/limited
6. **HTTPS only** — Vercel enforces
7. **OAuth** — no password storage (Google handles auth)
8. **Soft deletes** — reported jobs deactivated, not destroyed

---

## 8. Monitoring & Alerting (Current + Planned)

| What | Current | Planned |
|------|---------|---------|
| Ingestion health | Firestore logs | Discord alert on failure |
| New jobs | Discord webhook | Dashboard chart |
| Errors | Vercel function logs | Sentry or similar |
| Uptime | None | External ping monitor |
| Performance | None | Vercel Analytics or Clarity |
| User activity | None | Posthog or Clarity |
