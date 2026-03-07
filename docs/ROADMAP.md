# VisaHunt - Development Roadmap

## Phase 1: Foundation (Week 1-2) — P0 + P1 Quick Wins

### 1.1 Job Alerts API
- [ ] `POST /api/jobs/alerts` — Save alert preferences to user doc
- [ ] `GET /api/jobs/alerts` — Return current preferences
- [ ] `DELETE /api/jobs/alerts` — Disable alerts
- [ ] Connect dashboard Alerts tab to API (currently UI-only)
- [ ] `POST /api/cron/send-alerts` — Cron route to match and send
- [ ] Email template (Resend) — clean job cards with unsubscribe link
- [ ] Add to GitHub Actions cron schedule (daily 6am UTC)
- [ ] Signed unsubscribe tokens (HMAC with NEXTAUTH_SECRET)

### 1.2 SEO Foundation
- [ ] `app/sitemap.ts` — Dynamic sitemap (static pages + top countries)
- [ ] `app/robots.ts` — Standard robots.txt with sitemap reference
- [ ] `app/opengraph-image.tsx` — Default OG image via `@vercel/og`
- [ ] JobPosting JSON-LD on `/jobs/[id]` pages
- [ ] Meta tags audit: title, description, canonical on every page
- [ ] Programmatic pages: `/jobs/[country]` (e.g., `/jobs/uk`, `/jobs/germany`)

### 1.3 Content Pages
- [ ] `/faq` — 15-20 questions in accordion format
- [ ] `/privacy` — Privacy policy (data collection, third parties, retention)
- [ ] `/terms` — Terms of service (disclaimers, acceptable use)
- [ ] `/contact` — Contact form (name, email, subject, message) + Resend

### 1.4 Mobile Quick Fixes
- [ ] Job filters: collapsible panel or bottom sheet on mobile
- [ ] Job cards: optimize spacing for mobile
- [ ] Sticky "Apply Now" button on job detail page (mobile)
- [ ] Touch targets audit (min 44x44px)

---

## Phase 2: Growth (Week 3-4) — P1 Features

### 2.1 Remote-Anywhere Jobs
- [ ] Add `remoteAnywhere: boolean` to NormalizedJob type
- [ ] Detection logic in normalizer: scan description for global remote signals
- [ ] Search filter: "Remote Anywhere" option (separate from country-specific remote)
- [ ] Landing page section: "Work From Anywhere" trending
- [ ] Jobs page: filter chip for remote-anywhere

### 2.2 New Job Sources
- [ ] `lib/sources/hackernews.ts` — Parse monthly "Who is Hiring" thread
  - Fetch via HN API: `https://hacker-news.firebaseio.com/v0/item/{id}.json`
  - Parse comment text for job details
  - Filter for visa/sponsorship mentions
- [ ] `lib/sources/remoteok.ts` — RemoteOK API
  - Filter for visa-sponsored tags
- [ ] Add both to `fetchAllSources()` in ingest-jobs cron
- [ ] Monitor ingestion quality (false positives in visa detection)

### 2.3 Blog Launch
- [ ] 5 blog posts (MDX or hardcoded):
  1. "Complete Guide to UK Skilled Worker Visa for Indian Developers"
  2. "H1B vs L1 vs O1: Which US Visa is Right for You?"
  3. "Salary Negotiation Tips for International Tech Roles"
  4. "Top 50 Companies That Sponsor Visas in 2026"
  5. "Cost of Living Comparison: Indian Cities vs Global Tech Hubs"
- [ ] Blog index page with cards
- [ ] Blog post layout with prose styling
- [ ] Internal links to relevant VisaHunt features

### 2.4 Newsletter Sending
- [ ] Email template for weekly digest (Resend)
- [ ] `POST /api/cron/send-newsletter` — Weekly cron
- [ ] Query top jobs from past week, group by country
- [ ] Unsubscribe link (update `newsletter` doc)
- [ ] Add to GitHub Actions (Sundays 8am UTC)

---

## Phase 3: Polish (Week 5-6) — P2 Features

### 3.1 Admin Panel
- [ ] `/admin` route with email allowlist check
- [ ] Ingestion tab: last 10 runs with source counts, errors, duration
- [ ] Reports tab: queue of reported jobs, restore/delete actions
- [ ] Users tab: total users, alert subscribers, active users
- [ ] Stats tab: jobs by country, by source, verified vs unverified

### 3.2 Company Pages
- [ ] `/companies/[slug]` — SSG from sponsor data
- [ ] Company card: name, verified status, registry, active job count
- [ ] List active jobs from this company
- [ ] Link from JobCard and job detail "company name"
- [ ] `app/companies/page.tsx` — Browse all companies (paginated)

### 3.3 Sponsors Page Improvements
- [ ] Pagination (currently limited to 100)
- [ ] Search within sponsors
- [ ] Filter by country
- [ ] Link to company page (when built)

### 3.4 User Preferences Sync
- [ ] `POST /api/user/preferences` — Save preferences to Firestore
- [ ] Load preferences on dashboard mount
- [ ] Use preferences to personalize trending jobs on landing

---

## Phase 4: Differentiation (Week 7-10) — P3 Features

### 4.1 Resume Upload + Auto-Match
- [ ] Resume upload UI (PDF/DOCX)
- [ ] Parse resume: extract skills, experience level, education
- [ ] Match against job techStack + experienceLevel
- [ ] Show match score (%) per job
- [ ] Cross-sell to HuntWise AI for detailed ATS analysis
- [ ] Consider: parse-only (no storage) vs Firebase Storage

### 4.2 Advanced SEO
- [ ] Programmatic pages: `/jobs/[country]/[role]` (e.g., `/jobs/uk/frontend-developer`)
- [ ] City-level pages: `/jobs/[country]/[city]`
- [ ] "Top companies hiring [role] with visa sponsorship" pages
- [ ] IndexNow integration (ping on new job ingestion)
- [ ] Blog SEO: internal linking strategy

### 4.3 Analytics & Tracking
- [ ] Microsoft Clarity or Posthog integration
- [ ] Track: searches, job views, applies, saves, filter usage
- [ ] Funnel: landing -> search -> job detail -> apply
- [ ] Heatmaps on key pages

### 4.4 HuntWise AI Integration
- [ ] "Analyze this job" button on job detail → HuntWise AI Job Analyzer
- [ ] "Check your resume" CTA → HuntWise AI ATS Score
- [ ] Shared auth (same Google OAuth, same Firebase project)
- [ ] Cross-linking in both navbars

---

## Phase 5: Scale (Week 11+) — Future

### 5.1 More Sources
- [ ] Adzuna API (UK/EU)
- [ ] Reed API (UK)
- [ ] WeWorkRemotely
- [ ] LinkedIn Jobs (if API available)
- [ ] Indeed (if API available)

### 5.2 Real-Time Features
- [ ] WebSocket for live job alerts in dashboard
- [ ] "New jobs since you last visited" badge

### 5.3 Community Features
- [ ] Company reviews (salary, visa process, culture)
- [ ] Visa timeline tracker (applied -> approved -> started)
- [ ] Interview experience sharing

### 5.4 Monetization
- [ ] Featured job listings (companies pay for prominence)
- [ ] Premium alerts (instant notifications, more filters)
- [ ] Resume review service (link to HuntWise AI Pro)

---

## Task Priority Matrix

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| P0 | Job Alerts API | Medium | High (retention) |
| P0 | SEO Foundation | Medium | High (acquisition) |
| P1 | Content Pages | Low | Medium (trust/SEO) |
| P1 | Mobile Fixes | Low | Medium (usability) |
| P1 | Remote-Anywhere | Low | Medium (differentiation) |
| P1 | New Sources (HN, RemoteOK) | Medium | High (volume) |
| P1 | Blog | Medium | High (SEO) |
| P2 | Admin Panel | Medium | Medium (operations) |
| P2 | Company Pages | Medium | Medium (SEO) |
| P2 | Newsletter Sending | Low | Medium (retention) |
| P2 | User Preferences | Low | Low (personalization) |
| P3 | Resume Match | High | High (differentiation) |
| P3 | Advanced SEO | Medium | High (acquisition) |
| P3 | Analytics | Low | Medium (insights) |
| P3 | HuntWise Integration | Medium | Medium (cross-sell) |

---

## Definition of Done

Each feature is "done" when:
1. Code reviewed and merged to `main`
2. Deployed to production (Vercel auto-deploy)
3. Tested on mobile + desktop
4. No console errors or broken layouts
5. Loading states and error states handled
6. SEO meta tags added (if page is public)
