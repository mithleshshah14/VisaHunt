# VisaHunt - TODO Tracker

## Project Info
- **Local**: `C:\MyWeb\VisaHunt`
- **GitHub**: https://github.com/mithleshshah14/VisaHunt.git
- **Domain**: https://visa-hunt.com
- **Vercel**: Auto-deploys from `main`
- **Firebase**: CareerPilot project, named database `visahunt`
- **Discord**: https://discord.gg/RSUe4rpu

---

## What's Done (Shipped Mar 7, 2026)

### Core
- [x] Job aggregation from 6 sources (Arbeitnow, Himalayas, Greenhouse 33 cos, LandingJobs, VisaSponsor.jobs, GitHub Awesome)
- [x] Job deduplication (company|title|country key)
- [x] Sponsor verification against government registries (90K+ sponsors, exact + fuzzy match)
- [x] Salary conversion to INR (exchange rate API + fallback rates)
- [x] Job expiry (21-day TTL, soft delete)
- [x] Search with filters (keyword, country, tech stack, experience, remote, verified, posted-within)
- [x] All 6 filters persist in URL params
- [x] Cursor-based pagination
- [x] Redis caching (search 15min, trending 1h, stats 15min, exchange 24h, sponsors 24h)

### Cron (GitHub Actions)
- [x] `ingest-jobs` — every 12h (0am/12pm UTC)
- [x] `ingest-sponsors` — Sundays 2am UTC
- [x] `cleanup-expired` — daily 3am UTC
- [x] `update-exchange` — daily 1am UTC
- [x] Discord webhook on new jobs (top 10, grouped by country)

### User Features
- [x] Google OAuth (NextAuth)
- [x] Save jobs (max 100, `SavedJobsProvider`)
- [x] Mark Applied (`AppliedJobsProvider`)
- [x] Report No Visa (deactivates job immediately)
- [x] Dashboard (Saved, Applied, Alerts UI, Profile tabs)
- [x] Discord community invite (dashboard banner + navbar)

### Pages
- [x] Landing page (hero, country cards, trending, newsletter CTA, salary teaser)
- [x] Jobs search page (filters sidebar, job cards, infinite scroll)
- [x] Job detail page (full description, salary, tech stack, sponsor details, similar jobs)
- [x] Visa guides index (11 countries)
- [x] Visa guide detail pages (`/visa-guides/[country]`)
- [x] Salary comparison tool (8 roles x 11 countries, COL-adjusted)
- [x] Sponsors page (top 100 verified, filtered by country)
- [x] Dashboard

### Infra
- [x] Firebase Admin SDK (deny-all client rules)
- [x] Upstash Redis (rate limiting + caching)
- [x] Vercel deployment
- [x] GitHub Actions cron

### Env Vars (Vercel)
- [x] FIREBASE_SERVICE_ACCOUNT_KEY
- [x] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
- [x] CRON_SECRET
- [x] NEXTAUTH_SECRET
- [x] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
- [x] DISCORD_JOBS_WEBHOOK_URL
- [ ] EXCHANGE_RATE_API_KEY (using fallback rates for now)
- [ ] RESEND_API_KEY (needed for email alerts)

---

## What's Left to Build

### P0 — Must Have (Phase 1)

#### Job Alerts (Email)
- [ ] `POST /api/jobs/alerts` — save alert preferences to user doc
- [ ] `GET /api/jobs/alerts` — return current preferences
- [ ] `DELETE /api/jobs/alerts` — disable/unsubscribe
- [ ] Connect dashboard Alerts tab form to API (currently UI-only, no submit handler)
- [ ] `POST /api/cron/send-alerts` — cron route: match new jobs since `lastSentAt`, send via Resend
- [ ] Email template (Resend) — job cards + unsubscribe link
- [ ] Signed unsubscribe tokens (HMAC with NEXTAUTH_SECRET)
- [ ] Add `send-alerts` to GitHub Actions cron schedule (daily 6am UTC)
- [ ] Set `RESEND_API_KEY` in Vercel env vars

#### SEO Foundation
- [ ] `app/sitemap.ts` — dynamic sitemap (all static pages + country job pages)
- [ ] `app/robots.ts` — robots.txt with sitemap reference
- [ ] OG image generation (`@vercel/og` or static fallback)
- [ ] JobPosting JSON-LD on `/jobs/[id]` detail pages
- [ ] Meta tags audit — title, description, canonical on every page
- [ ] Programmatic country pages: `/jobs/[country]` (e.g., `/jobs/uk`)

---

### P1 — Important (Phase 2)

#### Content Pages
- [ ] `/faq` — 15-20 questions in accordion format (Jobs, Visa, Account, Technical)
- [ ] `/privacy` — privacy policy (data collected, third parties, retention, user rights)
- [ ] `/terms` — terms of service (disclaimers, acceptable use)
- [ ] `/contact` — contact form (name, email, subject, message) → Resend API

#### Remote-Anywhere Jobs
- [ ] Add `remoteAnywhere: boolean` to `NormalizedJob` type
- [ ] Detection in normalizer: scan description for "work from anywhere", "global remote", "location-independent", "remote worldwide"
- [ ] Search filter: "Remote Anywhere" option (separate from country-specific remote)
- [ ] Landing page section: "Work From Anywhere" trending jobs
- [ ] Country field shows "Worldwide" for remote-anywhere jobs

#### New Job Sources
- [ ] `lib/sources/hackernews.ts` — parse monthly "Who is Hiring" thread via HN API
- [ ] `lib/sources/remoteok.ts` — RemoteOK API with visa tag filter
- [ ] Add both to `fetchAllSources()` in ingest-jobs cron
- [ ] Monitor ingestion quality (false positives)

#### Blog
- [ ] Blog post layout with `@tailwindcss/typography` prose styling
- [ ] Blog index page with post cards (title, excerpt, date, read time)
- [ ] Post 1: "Complete Guide to UK Skilled Worker Visa for Indian Developers"
- [ ] Post 2: "H1B vs L1 vs O1: Which US Visa is Right for You?"
- [ ] Post 3: "Salary Negotiation Tips for International Tech Roles"
- [ ] Post 4: "Top 50 Companies That Sponsor Visas in 2026"
- [ ] Post 5: "Cost of Living: Indian Cities vs Global Tech Hubs"
- [ ] Internal links from posts to relevant VisaHunt features

#### Mobile Optimization
- [ ] Job filters: collapsible panel or bottom sheet (not sidebar) on mobile
- [ ] Job cards: optimize spacing, readable on small screens
- [ ] Job detail: sticky "Apply Now" button at bottom on mobile
- [ ] Touch targets audit: minimum 44x44px everywhere
- [ ] Salary comparison: horizontal scroll table on mobile
- [ ] Dashboard: ensure tabs work well on narrow screens

#### Newsletter Sending
- [ ] Email template for weekly digest (Resend)
- [ ] `POST /api/cron/send-newsletter` — weekly cron route
- [ ] Query top jobs from past week, group by country
- [ ] Unsubscribe link (update `newsletter` doc `active: false`)
- [ ] Add to GitHub Actions (Sundays 8am UTC)

---

### P2 — Nice to Have (Phase 3)

#### Admin Panel
- [ ] `/admin` route with email allowlist check
- [ ] Ingestion tab: last 10 runs with source counts, errors, duration
- [ ] Reports tab: queue of reported jobs, restore/delete actions
- [ ] Users tab: total users, alert subscribers, active users
- [ ] Stats tab: jobs by country, by source, verified vs unverified

#### Company Pages
- [ ] `/companies` — browse all companies (paginated, searchable)
- [ ] `/companies/[slug]` — company detail: name, verified status, registry info, active jobs
- [ ] Link from JobCard company name → company page
- [ ] Link from job detail company name → company page

#### Sponsors Page Improvements
- [ ] Pagination (currently capped at 100)
- [ ] Search within sponsors
- [ ] Filter by country dropdown
- [ ] Link sponsors to company pages (when built)

#### User Preferences Sync
- [ ] `POST /api/user/preferences` — save preferences to Firestore user doc
- [ ] `GET /api/user/preferences` — load on dashboard mount
- [ ] Use preferences to personalize trending/recommended jobs

---

### P3 — Future (Phase 4+)

#### Resume Upload + Auto-Match
- [ ] Resume upload UI (PDF/DOCX)
- [ ] Parse resume: extract skills, experience, education
- [ ] Match against job techStack + experienceLevel
- [ ] Show match score (%) per job
- [ ] Cross-sell to HuntWise AI for detailed ATS analysis

#### Advanced SEO
- [ ] Programmatic role pages: `/jobs/[country]/[role]` (e.g., `/jobs/uk/frontend-developer`)
- [ ] City-level pages: `/jobs/[country]/[city]`
- [ ] "Top companies hiring [role]" programmatic pages
- [ ] IndexNow integration (ping Bing/Yandex on ingestion)

#### Analytics
- [ ] Microsoft Clarity or Posthog integration
- [ ] Track: searches, job views, applies, saves, filter usage
- [ ] Funnel analysis: landing → search → detail → apply

#### HuntWise AI Integration
- [ ] "Analyze this job" button on job detail → HuntWise Job Analyzer
- [ ] "Check your resume" CTA → HuntWise ATS Score
- [ ] Cross-linking in navbars of both apps

#### More Job Sources
- [ ] Adzuna API (UK/EU)
- [ ] Reed API (UK)
- [ ] WeWorkRemotely
- [ ] LinkedIn Jobs (if API available)
- [ ] Indeed (if API available)

#### Community Features
- [ ] Company reviews (salary, visa process, culture)
- [ ] Visa timeline tracker (applied → approved → started)
- [ ] Interview experience sharing

#### Monetization
- [ ] Featured job listings (companies pay for prominence)
- [ ] Premium alerts (instant notifications, more filters)
- [ ] Resume review service (link to HuntWise AI Pro)

---

## Firestore Indexes Still Needed
- [ ] `(isActive ASC, country ASC, postedDate DESC)`
- [ ] `(isActive ASC, verifiedSponsor ASC, postedDate DESC)`
- [ ] `(isActive ASC, searchTokens ARRAY, postedDate DESC)`
- [ ] `(isActive ASC, techStackLower ARRAY, postedDate DESC)`
- [ ] `(isActive ASC, country ASC, verifiedSponsor ASC, postedDate DESC)`

---

## Known Issues / Tech Debt
- [ ] Discord webhook in ingestion is fire-and-forget (may miss Vercel timeout) — should await
- [ ] Sponsors page only shows 100 — needs pagination
- [ ] No error alerting on failed ingestion runs
- [ ] Exchange rates use hardcoded fallback — set `EXCHANGE_RATE_API_KEY` for real data
- [ ] Blog, FAQ, Contact, Privacy, Terms are stub pages with no content
- [ ] Dashboard job alerts tab has form UI but no working submit handler
- [ ] No analytics/event tracking on any page
