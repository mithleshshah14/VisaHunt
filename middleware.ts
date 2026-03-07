import { NextResponse, NextRequest } from "next/server";

// Known bot/scraper user agent patterns to block
const BOT_UA_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i,
  /python-requests/i, /python-urllib/i, /httpx/i, /aiohttp/i,
  /go-http-client/i, /java\//i, /okhttp/i, /axios/i, /node-fetch/i,
  /undici/i, /libwww/i, /lwp-/i, /http_request/i, /perl/i,
  /mechanize/i, /scrapy/i, /phantom/i, /headless/i,
  /semrush/i, /ahrefs/i, /mj12bot/i, /dotbot/i, /rogerbot/i,
  /blexbot/i, /linkfluence/i, /megaindex/i, /serpstat/i,
  /zoominfobot/i, /dataforseo/i, /censys/i, /nmap/i,
  /masscan/i, /zgrab/i, /nuclei/i, /httpie/i,
  /postman/i, /insomnia/i, /paw\//i,
];

// Allow legitimate bots (Google, Bing, social media)
const ALLOWED_BOTS = [
  /googlebot/i, /bingbot/i, /yandexbot/i, /duckduckbot/i,
  /slurp/i, /baiduspider/i, /facebookexternalhit/i,
  /twitterbot/i, /linkedinbot/i, /whatsapp/i, /telegrambot/i,
  /discordbot/i, /slackbot/i, /applebot/i,
];

// Pages bots are allowed to access (for SEO)
const PUBLIC_BOT_PATHS = [
  "/", "/jobs", "/visa-guides", "/salary-comparison",
  "/sponsors", "/faq", "/privacy", "/terms", "/contact",
  "/blog",
];

// In-memory rate limiter (per Vercel instance, resets on cold start)
const ipHits = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW = 60_000; // 1 minute
const RATE_LIMIT = 60; // 60 requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);

  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT;
}

// Clean up stale entries every 5 minutes to prevent memory leak
let lastCleanup = Date.now();
function cleanupRateMap() {
  const now = Date.now();
  if (now - lastCleanup < 300_000) return;
  lastCleanup = now;
  for (const [ip, entry] of ipHits) {
    if (now > entry.resetAt) ipHits.delete(ip);
  }
}

function isBot(ua: string): boolean {
  if (!ua) return true; // No user agent = suspicious
  if (ALLOWED_BOTS.some((p) => p.test(ua))) return false;
  return BOT_UA_PATTERNS.some((p) => p.test(ua));
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip for static files and Next.js internals (cheapest check first)
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // --- Bot detection (before any expensive work) ---
  const ua = req.headers.get("user-agent") || "";
  if (isBot(ua)) {
    const isPublicPage = PUBLIC_BOT_PATHS.some((p) =>
      pathname === p || pathname.startsWith(`${p}/`)
    );
    if (!isPublicPage && !pathname.startsWith("/api/og/") && !pathname.startsWith("/api/cron/")) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // --- Rate limiting by IP ---
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") || "unknown";
  cleanupRateMap();
  if (isRateLimited(ip)) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": "60" },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
