# VisaHunt - UI/UX Design Document

## 1. Design System

### 1.1 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `navy-900` | `#0a0f1e` | Page background |
| `navy-800` | `#111827` | Card backgrounds, inputs |
| `navy-700` | `#1e293b` | Hover states, borders |
| `navy-600` | `#334155` | Subtle borders |
| `sky-500` | `#0ea5e9` | Primary accent (buttons, links) |
| `sky-400` | `#38bdf8` | Primary hover |
| `sky-300` | `#7dd3fc` | Primary light text |
| `cyan-400` | `#22d3ee` | Gradient accent |
| `amber-400` | `#fbbf24` | Verified badge, warnings |
| `emerald-400` | `#34d399` | Salary, success states |
| `red-400` | `#f87171` | Errors, destructive actions |
| `slate-400` | `#94a3b8` | Secondary text |
| `slate-500` | `#64748b` | Placeholder text |
| `white` | `#ffffff` | Primary text |

### 1.2 Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| H1 (hero) | Sora | Bold (700) | 4xl / 6xl (sm+) |
| H2 (section) | Sora | Bold (700) | 2xl |
| H3 (card title) | Sora | Semibold (600) | lg |
| Body | Inter | Regular (400) | base (16px) |
| Numbers/Mono | Space Grotesk | Semibold (600) | sm-base |
| Labels | Inter | Medium (500) | sm |
| Caption | Inter | Regular (400) | xs-sm |

### 1.3 Spacing & Layout

- **Max width**: 6xl (1152px) for content, 4xl (896px) for text-heavy
- **Section padding**: `py-16 px-4 sm:px-6`
- **Card padding**: `p-4` (compact) to `p-6` (spacious)
- **Grid**: 1 col mobile, 2 col tablet, 3 col desktop (jobs)
- **Gap**: `gap-4` (tight) to `gap-8` (sections)

### 1.4 Components

#### Buttons
```
Primary:    bg-sky-500 hover:bg-sky-400 text-white rounded-lg px-6 py-3
Secondary:  border border-navy-600 bg-navy-800 hover:bg-navy-700 text-white rounded-lg
Ghost:      text-sky-400 hover:text-sky-300 (text-only)
Danger:     bg-red-500/10 text-red-400 border-red-500/20 rounded-lg
```

#### Cards
```
Default:    border border-navy-600/50 bg-navy-800 rounded-xl
Hover:      hover:border-sky-500/30 hover:bg-navy-700
Highlight:  border-amber-500/20 bg-amber-500/5 (verified sponsor callout)
```

#### Badges
```
Verified:   text-amber-400 bg-amber-500/10 border-amber-500/20 rounded-full
Country:    text-sky-300 bg-sky-500/10 rounded-full
Tech:       text-slate-300 bg-navy-700 border-navy-600 rounded-full
Remote:     text-emerald-400 bg-emerald-500/10 rounded-full
```

#### Inputs
```
Default:    bg-navy-800 border-navy-600 text-white placeholder-slate-500
Focus:      border-sky-500 ring-1 ring-sky-500
```

---

## 2. Page Layouts

### 2.1 Landing Page (`/`)

```
+--------------------------------------------------+
| Navbar: Logo | Jobs | Visa Guides | Salary | Auth |
+--------------------------------------------------+
|                                                    |
|  [Live badge: X visa-sponsored jobs live]          |
|                                                    |
|  Every Visa-Sponsored                              |
|  Tech Job. One Search.                             |
|                                                    |
|  Built for Indian developers...                    |
|                                                    |
|  [====== Search bar ======] [Search]               |
|                                                    |
+--------------------------------------------------+
|                                                    |
|  Browse by Country                                 |
|  [UK] [DE] [NL] [CA] [US] [IE]                   |
|  View all countries ->                             |
|                                                    |
+--------------------------------------------------+
|                                                    |
|  How It Works                                      |
|  [Browse] --> [Verify] --> [Apply Direct]          |
|                                                    |
+--------------------------------------------------+
|                                                    |
|  Government-Verified Sponsors                      |
|  90,000+ licensed sponsors from UK, US, CA, NL    |
|                                                    |
+--------------------------------------------------+
|                                                    |
|  Trending Jobs                                     |
|  [JobCard] [JobCard] [JobCard]                     |
|  [JobCard] [JobCard] [JobCard]                     |
|                                                    |
+--------------------------------------------------+
|                                                    |
|  Get Weekly Job Alerts                             |
|  [email input] [Subscribe]                         |
|                                                    |
+--------------------------------------------------+
|                                                    |
|  How Does Your Salary Compare?                     |
|  [Explore Salaries ->]                             |
|                                                    |
+--------------------------------------------------+
| Footer                                             |
+--------------------------------------------------+
```

### 2.2 Jobs Page (`/jobs`)

```
Desktop:
+--------------------------------------------------+
| Navbar                                             |
+--------------------------------------------------+
|                                                    |
|  [Search bar ========================] [Search]    |
|                                                    |
|  +----------+  +-------------------------------+  |
|  | FILTERS  |  | X jobs found                  |  |
|  |          |  |                               |  |
|  | Country  |  | [JobCard - full width]        |  |
|  | [v]      |  | [JobCard - full width]        |  |
|  |          |  | [JobCard - full width]        |  |
|  | Tech     |  | [JobCard - full width]        |  |
|  | [chips]  |  |                               |  |
|  |          |  | [Load more]                   |  |
|  | Exp      |  |                               |  |
|  | [v]      |  +-------------------------------+  |
|  |          |                                      |
|  | Remote   |                                      |
|  | [toggle] |                                      |
|  |          |                                      |
|  | Verified |                                      |
|  | [toggle] |                                      |
|  |          |                                      |
|  | Posted   |                                      |
|  | [v]      |                                      |
|  +----------+                                      |
+--------------------------------------------------+

Mobile:
+--------------------------------------------------+
| Navbar (hamburger)                                 |
+--------------------------------------------------+
| [Search bar] [Search]                              |
| [Filters button] [Active filter chips]             |
+--------------------------------------------------+
| [JobCard - stacked]                                |
| [JobCard - stacked]                                |
| [JobCard - stacked]                                |
| [Load more]                                        |
+--------------------------------------------------+

Filter Bottom Sheet (mobile):
+--------------------------------------------------+
| Filters                              [X] [Clear]  |
|                                                    |
| Country: [Dropdown]                                |
| Tech Stack: [chip] [chip] [+]                     |
| Experience: [Dropdown]                             |
| Remote Only: [Toggle]                              |
| Verified Only: [Toggle]                            |
| Posted Within: [Dropdown]                          |
|                                                    |
| [Apply Filters - full width]                       |
+--------------------------------------------------+
```

### 2.3 Job Detail (`/jobs/[id]`)

```
+--------------------------------------------------+
| Navbar                                             |
+--------------------------------------------------+
|                                                    |
|  <- Back to jobs                                   |
|                                                    |
|  [Company Logo placeholder]                        |
|  Senior Frontend Developer                         |
|  Company Name  [Verified Badge]                    |
|  London, United Kingdom  |  Full-time  |  Remote  |
|                                                    |
|  +----------------------------------------------+ |
|  | Salary                                        | |
|  | GBP 65,000 - 85,000 / year                   | |
|  | ~ INR 68.2L - 89.3L / year                   | |
|  +----------------------------------------------+ |
|                                                    |
|  [Apply Now ->]  [Save]  [Mark Applied]  [Report]  |
|                                                    |
|  Tech Stack                                        |
|  [React] [TypeScript] [Next.js] [Node.js]         |
|                                                    |
|  ------------------------------------------------  |
|                                                    |
|  Job Description                                   |
|  (full rendered description)                       |
|                                                    |
|  ------------------------------------------------  |
|                                                    |
|  Sponsor Details                                   |
|  Registry: UK Government                           |
|  License: Tier 2 Sponsor                           |
|  Valid Until: 2027                                 |
|                                                    |
|  ------------------------------------------------  |
|                                                    |
|  Similar Jobs                                      |
|  [JobCard] [JobCard] [JobCard] [JobCard]           |
|                                                    |
+--------------------------------------------------+
```

### 2.4 Dashboard (`/dashboard`)

```
+--------------------------------------------------+
| Navbar                                             |
+--------------------------------------------------+
|                                                    |
|  Welcome, [Name]!                                  |
|                                                    |
|  +---+ +---+ +---+ +---+                          |
|  |Saved|Applied|Alerts|Profile|                    |
|  +---+ +---+ +---+ +---+                          |
|                                                    |
|  [Discord Community Banner - join link]            |
|                                                    |
|  Tab: Saved Jobs                                   |
|  [JobCard] [JobCard]                               |
|  [JobCard] [JobCard]                               |
|                                                    |
|  Tab: Applied Jobs                                 |
|  [JobCard with applied date]                       |
|                                                    |
|  Tab: Job Alerts                                   |
|  Countries: [multi-select]                         |
|  Roles: [text input]                               |
|  Tech Stack: [multi-select]                        |
|  Frequency: [daily/weekly toggle]                  |
|  [Save Alert Preferences]                          |
|                                                    |
|  Tab: Profile                                      |
|  Name, email, saved count                          |
|  [Sign Out]                                        |
|                                                    |
+--------------------------------------------------+
```

### 2.5 Visa Guides (`/visa-guides/[country]`)

```
+--------------------------------------------------+
| Navbar                                             |
+--------------------------------------------------+
|                                                    |
|  [Flag] United Kingdom Visa Guide                  |
|  For Indian Tech Professionals                     |
|                                                    |
|  Quick Stats                                       |
|  [Active Jobs] [Verified Sponsors] [Avg Salary]   |
|                                                    |
|  Visa Types                                        |
|  +----------------------------------------------+ |
|  | Skilled Worker Visa                           | |
|  | Salary threshold: GBP 38,700 (~INR 40.6L)   | |
|  | Processing: 3-8 weeks | Duration: 5 years    | |
|  | PR Pathway: Yes (ILR after 5 years)          | |
|  +----------------------------------------------+ |
|  (repeat for each visa type)                       |
|                                                    |
|  Cost Breakdown                                    |
|  | Item          | GBP    | INR     |             |
|  | Visa Fee      | 719    | 75,500  |             |
|  | Health (IHS)  | 3,120  | 3,27,600|             |
|  | ...           |        |         |             |
|                                                    |
|  India-Specific Notes                              |
|  - Large Indian community in London/Manchester     |
|  - Direct flights from Delhi, Mumbai, Bangalore    |
|                                                    |
|  Top Tips                                          |
|  1. Apply to companies on the verified list        |
|  2. ...                                            |
|                                                    |
|  [Browse UK Jobs ->]                               |
|                                                    |
+--------------------------------------------------+
```

---

## 3. Component Inventory

### 3.1 Layout Components
| Component | Path | Description |
|-----------|------|-------------|
| `Navbar` | `components/layout/Navbar.tsx` | Sticky nav, mobile hamburger, auth buttons |
| `Footer` | `components/layout/Footer.tsx` | Links, Discord invite |

### 3.2 Job Components
| Component | Path | Description |
|-----------|------|-------------|
| `JobCard` | `components/jobs/JobCard.tsx` | Job listing card with salary, tech, verified badge |
| `JobFilters` | `components/jobs/JobFilters.tsx` | Sidebar filter panel (desktop) |

### 3.3 UI Components
| Component | Path | Description |
|-----------|------|-------------|
| (various) | `components/ui/` | Shared UI primitives |

### 3.4 Provider Components
| Component | Path | Description |
|-----------|------|-------------|
| `AuthProvider` | `components/providers/AuthProvider.tsx` | NextAuth session wrapper |
| `SavedJobsProvider` | `components/providers/SavedJobsProvider.tsx` | Saved jobs context |
| `AppliedJobsProvider` | `components/providers/AppliedJobsProvider.tsx` | Applied jobs context |

### 3.5 Sponsor Components
| Component | Path | Description |
|-----------|------|-------------|
| (in sponsors/) | `components/sponsors/` | Sponsor listing and cards |

---

## 4. Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|---------------|
| Default | < 640px | Single column, stacked cards, bottom sheet filters |
| `sm` | 640px+ | 2-col grids, inline search |
| `md` | 768px+ | Sidebar filters visible |
| `lg` | 1024px+ | 3-col job grid, wider sidebar |
| `xl` | 1280px+ | Max-width containers |

---

## 5. Interaction Patterns

### 5.1 Search
- Real-time filter updates via URL params (shareable)
- Debounced search input (300ms)
- Loading skeleton cards during fetch
- "No results" state with suggestions

### 5.2 Save/Apply
- Optimistic UI (instant toggle, revert on error)
- Toast notification on success
- Auth redirect if not logged in

### 5.3 Infinite Scroll
- Cursor-based pagination
- Loading spinner at bottom
- "No more jobs" end state

### 5.4 Job Report
- Confirmation dialog before reporting
- Job immediately hidden from results
- "Thanks for reporting" toast

---

## 6. Animations

| Element | Animation | Library |
|---------|-----------|---------|
| Page transitions | Fade in | Framer Motion |
| Card hover | Border glow, slight lift | CSS transition |
| Badge pulse | Ping animation | Tailwind `animate-ping` |
| Filter toggle | Slide/collapse | CSS transition |
| Skeleton loading | Shimmer gradient | CSS animation |
| Hero glow | Blur gradient | CSS (static) |

---

## 7. Accessibility Requirements

| Requirement | Implementation |
|-------------|---------------|
| Color contrast | 4.5:1 minimum (WCAG AA) |
| Focus indicators | `focus:ring-2 focus:ring-sky-500` on all interactive |
| Keyboard nav | Tab order, Enter/Space for buttons |
| Screen readers | Semantic HTML, aria-labels on icons |
| Touch targets | Min 44x44px on mobile |
| Reduced motion | `prefers-reduced-motion` media query |
| Skip navigation | Skip-to-content link (hidden until focus) |

---

## 8. New Pages to Design

### 8.1 Blog Index (`/blog`)
- Grid of blog post cards (title, excerpt, date, read time)
- Category filter (visa guides, salary, career tips)
- Featured post hero

### 8.2 Blog Post (`/blog/[slug]`)
- Prose layout (max-w-3xl, `@tailwindcss/typography`)
- Table of contents sidebar (desktop)
- Share buttons, related posts

### 8.3 FAQ (`/faq`)
- Accordion-style Q&A
- Category grouping (Jobs, Visa, Account, Technical)
- Search/filter

### 8.4 Contact (`/contact`)
- Simple form: name, email, subject, message
- Send via Resend API
- Discord community link as alternative

### 8.5 Admin Panel (`/admin`)
- Protected (email allowlist)
- Tabs: Ingestion, Reports, Users, Stats
- Data tables with sorting/filtering
- Charts for trends (optional, minimal)

### 8.6 Company Page (`/companies/[slug]`)
- Company name, verified status, registry info
- Active job listings from this company
- "Follow company" (future)
