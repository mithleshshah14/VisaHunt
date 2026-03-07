# VisaHunt - Product Requirements Document (PRD)

## 1. Product Overview

**Product**: VisaHunt (visa-hunt.com)
**Tagline**: Every Visa-Sponsored Tech Job. One Search.
**Target Users**: Indian tech professionals seeking visa-sponsored jobs abroad
**Status**: Live MVP — Job search, sponsor verification, salary comparison, visa guides

---

## 2. Problem Statement

Indian developers exploring international opportunities face:
1. **Scattered job data** — Visa-sponsored roles are buried across dozens of job boards
2. **No sponsor verification** — No way to know if a company actually sponsors visas
3. **Salary confusion** — Foreign salaries are meaningless without INR conversion + cost-of-living context
4. **Visa complexity** — Each country has different visa types, costs, and timelines
5. **No community** — Job seekers relocating internationally lack peer support

VisaHunt solves all five by aggregating visa-sponsored jobs, verifying sponsors against government registries, converting salaries to INR, providing comprehensive visa guides, and hosting a Discord community.

---

## 3. Current State (MVP — Shipped Mar 7, 2026)

### 3.1 What's Live
| Feature | Status | Notes |
|---------|--------|-------|
| Job aggregation (6 sources) | Live | Arbeitnow, Himalayas, Greenhouse (33 cos), LandingJobs, VisaSponsor.jobs, GitHub Awesome |
| Sponsor verification | Live | 90K+ companies from UK/US/CA/NL government registries |
| Search & filters | Live | Keyword, country, tech stack, experience, remote, posted-within |
| Salary in INR | Live | Auto-converted via exchange rates API |
| Visa guides (11 countries) | Live | Visa types, costs, salary thresholds, PR pathways |
| Salary comparison tool | Live | 8 roles x 11 countries, COL-adjusted |
| Save / Mark Applied | Live | Auth required, max 100 saved |
| Report no-visa jobs | Live | Community moderation, immediate deactivation |
| Dashboard | Live | Saved, Applied, Alerts (UI only), Profile |
| Google OAuth | Live | NextAuth |
| Discord community | Live | Invite link for logged-in users |
| Cron ingestion | Live | GitHub Actions, every 12h |

### 3.2 What's Missing / Incomplete
| Feature | Status | Priority |
|---------|--------|----------|
| Job alerts (email) | UI only, no API | P0 |
| Blog content | Stub page | P1 |
| FAQ content | Stub page | P1 |
| Contact form | Stub page | P2 |
| Privacy / Terms content | Stub pages | P1 |
| Mobile optimization | Partial | P1 |
| SEO (sitemap, OG images) | Not started | P0 |
| Remote-anywhere filter | Not started | P1 |
| More job sources | Not started | P1 |
| Admin panel | Not started | P2 |
| Company pages | Not started | P2 |
| Resume upload + auto-match | Not started | P3 |
| Newsletter sending | Collects only | P2 |
| User preferences sync | UI only | P2 |
| Sponsors pagination | Shows 100 only | P2 |

---

## 4. Next Phase — Feature Requirements

### 4.1 P0: Job Alerts (Email Notifications)

**Goal**: Users opt-in to receive email alerts when new jobs match their preferences.

**User Stories**:
- As a user, I want to set my preferred countries, roles, and tech stack so I get relevant alerts
- As a user, I want to choose alert frequency (daily or weekly)
- As a user, I want to unsubscribe with one click

**Requirements**:
- `POST /api/jobs/alerts` — Create/update alert preferences
- `GET /api/jobs/alerts` — Get current alert settings
- `DELETE /api/jobs/alerts` — Unsubscribe
- Cron job: Query Firestore for users with alerts enabled, match new jobs since `lastSentAt`, send via Resend
- Firestore collection: `alerts` (or embed in `users` doc)
- Max 20 jobs per email, sorted by match relevance
- Unsubscribe link in every email (signed token)
- Rate limit: Max 1 email per day per user

**Success Metrics**: 20% of registered users enable alerts within 30 days

---

### 4.2 P0: SEO Foundation

**Goal**: Make VisaHunt discoverable on Google for visa-sponsored job searches.

**Requirements**:
- **Sitemap**: Dynamic `sitemap.xml` with all static pages + top job listing URLs
- **robots.txt**: Allow all crawlers, reference sitemap
- **OG Images**: Auto-generated for landing, jobs, visa-guides, salary-comparison
- **Meta tags**: Title, description, canonical for every page
- **Structured data**: JobPosting JSON-LD on job detail pages
- **Programmatic SEO pages**: `/jobs/[country]/[role]` (e.g., `/jobs/uk/frontend-developer`)
- **IndexNow**: Ping Bing/Yandex on new job ingestion

**Success Metrics**: 500 organic visits/month within 90 days

---

### 4.3 P1: Remote-Anywhere Jobs

**Goal**: Surface jobs that allow working from anywhere globally (not "remote within UK").

**User Stories**:
- As a user, I want to find fully remote jobs with no country restriction
- As a user, I want to filter for "work from anywhere" separately from "remote in [country]"

**Requirements**:
- New field: `remoteAnywhere: boolean` on NormalizedJob
- Detection during ingestion: scan description for "work from anywhere", "global remote", "location-independent", "remote worldwide", "no location restriction"
- New filter option in search: "Remote Anywhere" (separate from current remote toggle)
- Dedicated section on landing page: "Work From Anywhere" trending jobs
- Country field shows "Worldwide" for these jobs

**Success Metrics**: 50+ remote-anywhere jobs ingested per cycle

---

### 4.4 P1: More Job Sources

**Goal**: Increase job volume and freshness.

**New Sources (Priority Order)**:
1. **Hacker News "Who is Hiring"** — Monthly thread, parse via HN API, filter for visa mentions
2. **Adzuna** — Large UK/EU job board with API
3. **Reed** — UK-specific job board
4. **RemoteOK** — Remote jobs with visa tags
5. **WeWorkRemotely** — Remote jobs, some visa-sponsored

**Requirements per source**:
- New file in `lib/sources/` following existing pattern
- Returns `NormalizedJob[]`
- Handles pagination, rate limiting, error recovery
- Added to `fetchAllSources()` in ingest-jobs cron

**Success Metrics**: 2x job volume (from ~500 to ~1000 per ingestion)

---

### 4.5 P1: Content Pages (Blog, FAQ, Privacy, Terms)

**Goal**: Build trust, improve SEO, provide legal compliance.

**Blog**:
- 5 launch posts: "How to get a UK Skilled Worker Visa", "H1B vs L1 vs O1", "Salary negotiation for international roles", "Top visa-sponsoring companies 2026", "Cost of living comparison for Indian developers"
- MDX or hardcoded content (no CMS needed initially)
- Each post links to relevant VisaHunt features

**FAQ**:
- 15-20 questions covering: How jobs are sourced, sponsor verification, salary accuracy, data freshness, account features, privacy

**Privacy Policy & Terms**:
- Standard SaaS privacy policy covering: data collected (email, OAuth profile), cookies, third-party services (Firebase, Vercel, Google OAuth), data retention, user rights
- Terms of service: acceptable use, disclaimers (job accuracy, visa outcomes)

---

### 4.6 P1: Mobile Optimization

**Goal**: Responsive, touch-friendly experience on all screens.

**Requirements**:
- Job cards: stack layout on mobile, swipe actions (save/apply)
- Filters: bottom sheet or collapsible panel (not sidebar)
- Job detail: full-width, sticky apply button
- Dashboard: tab navigation (not sidebar)
- Salary comparison: horizontal scroll table on mobile
- Touch targets: minimum 44x44px

---

### 4.7 P2: Admin Panel

**Goal**: Internal tool to monitor ingestion, manage reported jobs, view user stats.

**Requirements**:
- Protected route (`/admin`) — allowlist specific emails
- Tabs: Ingestion Logs, Reported Jobs, User Stats, Job Stats
- Ingestion logs: show last 10 runs with source counts, errors, duration
- Reported jobs: review queue, restore or permanently delete
- User stats: total users, active users, saved jobs count, alert subscribers
- Job stats: by country, by source, by verified status

---

### 4.8 P2: Company Pages

**Goal**: SEO + trust — show all jobs from a specific company with sponsor verification details.

**Requirements**:
- Route: `/companies/[slug]`
- Show: company name, verified status, registry source, active job count
- List: all active jobs from this company
- Link from job cards and job detail pages
- Programmatic generation from Firestore sponsor data

---

### 4.9 P3: Resume Upload + Auto-Match

**Goal**: Let users upload their resume and get matched to relevant visa-sponsored jobs.

**Requirements**:
- Resume parsing (PDF/DOCX) — extract skills, experience, education
- Match algorithm: compare extracted skills against job techStack
- Show match score (%) for each job
- Cross-sell to HuntWise AI for detailed ATS analysis
- Storage: Firebase Storage or parse-only (no persistence)

---

## 5. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | Job search < 2s, page load < 3s (LCP) |
| Availability | 99.5% uptime (Vercel SLA) |
| Security | All Firestore via Admin SDK, deny-all client rules, CRON_SECRET on cron routes |
| Scalability | Redis caching, batch writes, cursor pagination |
| Cost | Stay within Vercel Hobby + Firebase Spark + Upstash free tiers initially |
| Privacy | GDPR-aware: data export, deletion on request |
| Accessibility | WCAG 2.1 AA for contrast, focus management, screen readers |

---

## 6. Success Metrics (90-Day Targets)

| Metric | Target |
|--------|--------|
| Monthly active users | 1,000 |
| Registered users | 300 |
| Jobs in database | 2,000+ |
| Organic search traffic | 500 visits/month |
| Alert subscribers | 60 |
| Discord members | 100 |
| Job applications tracked | 200/month |
| Avg session duration | > 3 min |

---

## 7. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Job sources change APIs | No new jobs | Monitor ingestion logs, alert on 0-job runs |
| Firestore costs spike | Budget overrun | Aggressive caching, batch reads, query optimization |
| Low user retention | Wasted effort | Email alerts keep users returning |
| Stale job data | Trust erosion | 21-day TTL, community reporting, 12h refresh |
| Legal (scraping TOS) | Takedown | Use official APIs where available, respect robots.txt |

---

## 8. Timeline

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| Phase 1 (Now) | 1-2 weeks | Job alerts API, SEO foundation, content pages, mobile fixes |
| Phase 2 | 2-3 weeks | Remote-anywhere, 2 new sources, admin panel |
| Phase 3 | 3-4 weeks | Company pages, more sources, newsletter sending |
| Phase 4 | 4-6 weeks | Resume upload, auto-match, HuntWise AI integration |
