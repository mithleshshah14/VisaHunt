import { adminDb } from "@/lib/firebaseAdmin";
import { getCached, setCache } from "@/lib/redis";
import { normalizeCompanyName, levenshtein } from "@/lib/normalizer";
import type { Sponsor, SponsorTier, SponsorDetails } from "@/lib/types";

interface SponsorMatch {
  verified: boolean;
  tier: SponsorTier;
  details?: SponsorDetails;
}

/**
 * Verify if a company is a government-verified visa sponsor.
 * Check order: Redis cache → Firestore exact → Firestore fuzzy
 */
export async function verifySponsor(
  companyName: string,
  country: string
): Promise<SponsorMatch> {
  const normalized = normalizeCompanyName(companyName);
  const cacheKey = `sponsor:lookup:${normalized}:${country}`;

  // Check Redis cache first
  const cached = await getCached<SponsorMatch>(cacheKey);
  if (cached) return cached;

  // Exact match in Firestore
  const exactMatch = await findExactSponsor(normalized, country);
  if (exactMatch) {
    const result: SponsorMatch = {
      verified: true,
      tier: "government",
      details: {
        registrySource: exactMatch.registrySource,
        licenseType: exactMatch.licenseType,
        validUntil: exactMatch.validUntil,
        visasSponsored: exactMatch.visasSponsored,
      },
    };
    await setCache(cacheKey, result, 86400); // 24h
    return result;
  }

  // Fuzzy match (Levenshtein ≤ 2)
  const fuzzyMatch = await findFuzzySponsor(normalized, country);
  if (fuzzyMatch) {
    const result: SponsorMatch = {
      verified: true,
      tier: "government",
      details: {
        registrySource: fuzzyMatch.registrySource,
        licenseType: fuzzyMatch.licenseType,
        validUntil: fuzzyMatch.validUntil,
        visasSponsored: fuzzyMatch.visasSponsored,
      },
    };
    await setCache(cacheKey, result, 86400);
    return result;
  }

  // No match
  const noMatch: SponsorMatch = { verified: false, tier: "self-reported" };
  await setCache(cacheKey, noMatch, 3600); // 1h for misses
  return noMatch;
}

async function findExactSponsor(
  normalized: string,
  country: string
): Promise<Sponsor | null> {
  try {
    const snap = await adminDb
      .collection("sponsors")
      .where("companyNormalized", "==", normalized)
      .where("country", "==", country)
      .limit(1)
      .get();

    if (snap.empty) return null;
    return snap.docs[0].data() as Sponsor;
  } catch {
    return null;
  }
}

async function findFuzzySponsor(
  normalized: string,
  country: string
): Promise<Sponsor | null> {
  try {
    // Get sponsors for the same country and check Levenshtein distance
    // Only check a limited set to avoid scanning too many docs
    const snap = await adminDb
      .collection("sponsors")
      .where("country", "==", country)
      .limit(500)
      .get();

    for (const doc of snap.docs) {
      const sponsor = doc.data() as Sponsor;
      const dist = levenshtein(normalized, sponsor.companyNormalized);
      if (dist <= 2 && dist > 0) {
        return sponsor;
      }
      // Also check aliases
      for (const alias of sponsor.aliases || []) {
        if (levenshtein(normalized, alias.toLowerCase()) <= 1) {
          return sponsor;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Batch verify multiple companies.
 */
export async function batchVerifySponsors(
  companies: Array<{ company: string; country: string }>
): Promise<Map<string, SponsorMatch>> {
  const results = new Map<string, SponsorMatch>();

  // Process in parallel but limit concurrency
  const BATCH_SIZE = 25;
  for (let i = 0; i < companies.length; i += BATCH_SIZE) {
    const batch = companies.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async ({ company, country }) => {
      const key = `${normalizeCompanyName(company)}|${country}`;
      const result = await verifySponsor(company, country);
      results.set(key, result);
    });
    await Promise.all(promises);
  }

  return results;
}
