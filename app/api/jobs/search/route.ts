import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getCached, setCache } from "@/lib/redis";
import crypto from "crypto";
import type { NormalizedJob, SearchFilters, SearchResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const CACHE_TTL = 900; // 15 min

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const filters: SearchFilters = {
      q: searchParams.get("q") || undefined,
      country: searchParams.get("country") || undefined,
      techStack: searchParams.get("techStack")?.split(",").filter(Boolean) || undefined,
      experienceLevel: searchParams.get("experienceLevel") as any || undefined,
      remote: searchParams.get("remote") as any || undefined,
      verifiedOnly: searchParams.get("verifiedOnly") === "true",
      salaryMin: searchParams.get("salaryMin") ? Number(searchParams.get("salaryMin")) : undefined,
      postedWithin: searchParams.get("postedWithin") ? Number(searchParams.get("postedWithin")) : undefined,
      cursor: searchParams.get("cursor") || undefined,
      limit: Math.min(Number(searchParams.get("limit")) || DEFAULT_LIMIT, MAX_LIMIT),
    };

    // Check Redis cache
    const cacheKey = `jobs:search:${hashFilters(filters)}`;
    const cached = await getCached<SearchResponse>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Build Firestore query — keep it simple to minimize composite indexes needed
    // Only use: isActive + ONE of (country, techStack, searchTokens) + orderBy
    // Everything else is post-filtered
    let query: FirebaseFirestore.Query = adminDb
      .collection("jobs")
      .where("isActive", "==", true);

    // Equality filters are cheap in Firestore — use them at query level
    let usedArrayContains = false;
    if (filters.country) {
      query = query.where("country", "==", filters.country.toUpperCase());
    }

    if (filters.verifiedOnly) {
      query = query.where("verifiedSponsor", "==", true);
    }

    if (filters.techStack && filters.techStack.length > 0) {
      query = query.where("techStackLower", "array-contains", filters.techStack[0].toLowerCase());
      usedArrayContains = true;
    } else if (filters.q) {
      const searchToken = filters.q.toLowerCase().trim().split(/\s+/)[0];
      if (searchToken && searchToken.length > 2) {
        query = query.where("searchTokens", "array-contains", searchToken);
        usedArrayContains = true;
      }
    }

    // Order and pagination
    query = query.orderBy("postedDate", "desc");

    if (filters.cursor) {
      const cursorDoc = await adminDb.collection("jobs").doc(filters.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    // Fetch more when post-filtering is needed
    const hasPostFilters = filters.experienceLevel ||
      filters.remote || filters.salaryMin || filters.postedWithin ||
      (filters.techStack && filters.techStack.length > 1) ||
      (filters.q && usedArrayContains && filters.techStack?.length);
    const fetchLimit = hasPostFilters ? Math.min(filters.limit! * 10, 500) : filters.limit! + 1;
    query = query.limit(fetchLimit);

    const snap = await query.get();
    const allJobs = snap.docs.map((doc) => doc.data() as NormalizedJob);

    // Post-filter everything Firestore doesn't handle
    let filtered = allJobs;

    // Only filter by age when user explicitly selects a time range
    if (filters.postedWithin) {
      const ageCutoff = new Date();
      ageCutoff.setDate(ageCutoff.getDate() - filters.postedWithin);
      filtered = filtered.filter((j) => new Date(j.postedDate) >= ageCutoff);
    }

    if (filters.experienceLevel) {
      filtered = filtered.filter((j) => j.experienceLevel === filters.experienceLevel);
    }

    if (filters.remote) {
      filtered = filtered.filter((j) => j.remote === filters.remote);
    }

    if (filters.salaryMin && filters.salaryMin > 0) {
      filtered = filtered.filter(
        (j) => (j.salaryMinINR || 0) >= filters.salaryMin!
      );
    }

    // Post-filter additional tech stack items (first one handled by Firestore)
    if (filters.techStack && filters.techStack.length > 1) {
      const extraTechs = filters.techStack.slice(1).map((t) => t.toLowerCase());
      filtered = filtered.filter((j) =>
        extraTechs.every((t) => (j.techStackLower || []).includes(t))
      );
    }

    // Post-filter text search when techStack took the array-contains slot
    if (filters.q && filters.techStack && filters.techStack.length > 0) {
      const q = filters.q.toLowerCase().trim();
      filtered = filtered.filter((j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q)
      );
    }

    const hasMore = filtered.length > filters.limit!;
    const paged = filtered.slice(0, filters.limit!);
    const lastDoc = paged.length > 0 ? paged[paged.length - 1] : null;

    // Strip full description to reduce cache size (list view only needs snippet)
    const lightweight = paged.map(({ description, ...rest }) => ({
      ...rest,
      description: rest.descriptionSnippet,
    }));

    const response: SearchResponse = {
      jobs: lightweight as NormalizedJob[],
      totalCount: paged.length,
      cursor: hasMore && lastDoc ? lastDoc.id : undefined,
      hasMore,
    };

    // Cache
    await setCache(cacheKey, response, CACHE_TTL);

    return NextResponse.json(response);
  } catch (err) {
    console.error("[Search] Error:", err);
    return NextResponse.json(
      { error: "Search failed", details: String(err) },
      { status: 500 }
    );
  }
}

function hashFilters(filters: SearchFilters): string {
  return crypto
    .createHash("md5")
    .update(JSON.stringify(filters))
    .digest("hex");
}
