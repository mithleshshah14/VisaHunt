# VisaHunt - API Reference

## Base URL
- **Production**: `https://www.visa-hunt.com`
- **Local**: `http://localhost:3000`

---

## Authentication

Most read endpoints are public. Write endpoints require NextAuth session (Google OAuth).

Cron endpoints require `Authorization: Bearer ${CRON_SECRET}` header.

---

## Public Endpoints

### Search Jobs
```
GET /api/jobs/search
```

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | - | Search query (title, company, keywords) |
| `country` | string | - | ISO 2-letter code (GB, US, DE, etc.) |
| `techStack` | string | - | Comma-separated (react,typescript) |
| `experienceLevel` | string | - | junior, mid, senior, lead |
| `remote` | boolean | false | Filter for remote jobs only |
| `verifiedOnly` | boolean | false | Only verified sponsors |
| `postedWithin` | string | - | 7d, 14d, 21d, 30d |
| `cursor` | string | - | Pagination cursor (job ID) |
| `limit` | number | 20 | Results per page (max 50) |

**Response** (200):
```json
{
  "jobs": [
    {
      "id": "a1b2c3d4e5f6g7h8",
      "title": "Senior Frontend Developer",
      "company": "Stripe",
      "location": "London, UK",
      "country": "GB",
      "descriptionSnippet": "We're looking for...",
      "url": "https://stripe.com/jobs/...",
      "sources": ["greenhouse"],
      "salaryMin": 65000,
      "salaryMax": 85000,
      "salaryCurrency": "GBP",
      "salaryMinINR": 6820000,
      "salaryMaxINR": 8930000,
      "techStack": ["React", "TypeScript", "Node.js"],
      "verifiedSponsor": true,
      "experienceLevel": "senior",
      "remote": false,
      "postedDate": "2026-03-05T00:00:00Z"
    }
  ],
  "total": 142,
  "hasMore": true,
  "cursor": "next_job_id_here"
}
```

---

### Get Job Detail
```
GET /api/jobs/[id]
```

**Response** (200):
```json
{
  "job": {
    "id": "a1b2c3d4e5f6g7h8",
    "title": "Senior Frontend Developer",
    "company": "Stripe",
    "description": "Full job description...",
    "sponsorDetails": {
      "registrySource": "uk_gov",
      "licenseType": "Tier 2",
      "validUntil": "2027-12-31"
    },
    // ... all NormalizedJob fields
  },
  "similarJobs": [
    // 4 jobs from same country
  ]
}
```

**Response** (404):
```json
{ "error": "Job not found" }
```

---

### Get Global Stats
```
GET /api/jobs/stats
```

**Response** (200, cached 15 min):
```json
{
  "totalJobs": 1247,
  "totalSponsors": 92341,
  "jobsByCountry": {
    "GB": 423,
    "DE": 312,
    "US": 189,
    "NL": 156,
    "CA": 98,
    "IE": 69
  },
  "lastUpdated": "2026-03-07T12:00:00Z"
}
```

---

### Get Trending Jobs
```
GET /api/jobs/trending?country=GB
```

**Query Parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `country` | string | - | Filter by country (optional) |

**Response** (200, cached 1 hour):
```json
{
  "jobs": [
    // 6 top verified jobs, sorted by postedDate DESC
  ]
}
```

---

### Subscribe to Newsletter
```
POST /api/newsletter
```

**Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200):
```json
{ "success": true }
```

---

## Authenticated Endpoints

All require active NextAuth session (cookie-based).

### Toggle Save Job
```
POST /api/jobs/save
```

**Body**:
```json
{
  "jobId": "a1b2c3d4e5f6g7h8"
}
```

**Response** (200):
```json
{
  "saved": true,
  "savedJobs": ["a1b2c3d4e5f6g7h8", "..."]
}
```

**Errors**:
- 401: Not authenticated
- 400: Maximum 100 saved jobs reached

---

### Get Saved Jobs
```
GET /api/jobs/saved
```

**Response** (200):
```json
{
  "jobs": [
    // Full NormalizedJob objects for each saved job
  ]
}
```

---

### Toggle Applied Status
```
POST /api/jobs/apply
```

**Body**:
```json
{
  "jobId": "a1b2c3d4e5f6g7h8"
}
```

**Response** (200):
```json
{
  "applied": true,
  "appliedJobs": ["a1b2c3d4e5f6g7h8"]
}
```

---

### Get Applied Jobs
```
GET /api/jobs/applied
```

**Response** (200):
```json
{
  "jobs": [
    // Full NormalizedJob objects for each applied job
  ]
}
```

---

### Report Job (No Visa Sponsorship)
```
POST /api/jobs/report
```

**Body**:
```json
{
  "jobId": "a1b2c3d4e5f6g7h8",
  "reason": "Job posting says no visa sponsorship"
}
```

**Response** (200):
```json
{ "success": true }
```

**Side effects**:
- Job `isActive` set to `false` immediately
- Report stored in `jobReports` collection
- Job removed from search results on next query

---

## Cron Endpoints

All require `Authorization: Bearer ${CRON_SECRET}` header.

### Ingest Jobs
```
POST /api/cron/ingest-jobs
```

**Max Duration**: 300 seconds

**Response** (200):
```json
{
  "success": true,
  "stats": {
    "fetched": 487,
    "new": 42,
    "duplicates": 445,
    "expired": 15,
    "errors": [],
    "duration": 124500,
    "sources": {
      "arbeitnow": 95,
      "himalayas": 180,
      "greenhouse": 145,
      "landingjobs": 32,
      "visasponsor": 20,
      "github_awesome": 15
    }
  }
}
```

---

### Ingest Sponsors
```
POST /api/cron/ingest-sponsors
```

**Max Duration**: 300 seconds

Refreshes UK government sponsor registry from CSV.

---

### Update Exchange Rates
```
POST /api/cron/update-exchange
```

Fetches latest rates, caches in Redis (24h TTL).

---

### Cleanup Expired Jobs
```
POST /api/cron/cleanup-expired
```

Sets `isActive: false` on jobs where `expiresAt < now`.

---

## Planned Endpoints (TODO)

### Job Alerts
```
POST   /api/jobs/alerts    — Create/update alert preferences
GET    /api/jobs/alerts    — Get current alert settings
DELETE /api/jobs/alerts    — Unsubscribe from alerts
POST   /api/cron/send-alerts — Cron: send matching jobs via email
```

### Contact Form
```
POST /api/contact — Send contact form email via Resend
```

### User Preferences
```
POST /api/user/preferences — Save user preferences
GET  /api/user/preferences — Get user preferences
```

---

## Error Responses

All errors follow this format:
```json
{
  "error": "Human-readable error message"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request (invalid params, limit reached) |
| 401 | Not authenticated |
| 403 | Forbidden (wrong CRON_SECRET) |
| 404 | Resource not found |
| 429 | Rate limited |
| 500 | Internal server error |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/jobs/search` | 30 requests | 1 minute |
| `/api/jobs/[id]` | 60 requests | 1 minute |
| `/api/jobs/save` | 20 requests | 1 minute |
| `/api/jobs/report` | 5 requests | 1 minute |
| `/api/newsletter` | 3 requests | 1 minute |

Rate limiting via Upstash Redis (IP-based for public, user-based for auth).
