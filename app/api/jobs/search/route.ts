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

    // Build Firestore query
    let query: FirebaseFirestore.Query = adminDb
      .collection("jobs")
      .where("isActive", "==", true);

    if (filters.country) {
      query = query.where("country", "==", filters.country.toUpperCase());
    }

    if (filters.verifiedOnly) {
      query = query.where("verifiedSponsor", "==", true);
    }

    if (filters.experienceLevel) {
      query = query.where("experienceLevel", "==", filters.experienceLevel);
    }

    if (filters.remote) {
      query = query.where("remote", "==", filters.remote);
    }

    if (filters.techStack && filters.techStack.length > 0) {
      // Firestore only supports one array-contains per query
      query = query.where("techStackLower", "array-contains", filters.techStack[0].toLowerCase());
    }

    if (filters.q) {
      // Use searchTokens for basic text search
      const searchToken = filters.q.toLowerCase().trim().split(/\s+/)[0];
      if (searchToken && searchToken.length > 2) {
        query = query.where("searchTokens", "array-contains", searchToken);
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

    query = query.limit(filters.limit! + 1); // Fetch one extra to check hasMore

    const snap = await query.get();
    const docs = snap.docs;
    const hasMore = docs.length > filters.limit!;
    const jobs = docs.slice(0, filters.limit!).map((doc) => doc.data() as NormalizedJob);

    // Post-filter for things Firestore can't handle
    let filtered = jobs;

    if (filters.postedWithin) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - filters.postedWithin);
      filtered = filtered.filter((j) => new Date(j.postedDate) >= cutoff);
    }

    if (filters.salaryMin && filters.salaryMin > 0) {
      filtered = filtered.filter(
        (j) => (j.salaryMinINR || 0) >= filters.salaryMin!
      );
    }

    // Multi-tech filter (post-filter for additional techs beyond the first)
    if (filters.techStack && filters.techStack.length > 1) {
      const extraTechs = filters.techStack.slice(1).map((t) => t.toLowerCase());
      filtered = filtered.filter((j) =>
        extraTechs.every((t) => j.techStackLower.includes(t))
      );
    }

    const response: SearchResponse = {
      jobs: filtered,
      totalCount: filtered.length,
      cursor: hasMore ? docs[docs.length - 2]?.id : undefined,
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
