import Link from "next/link";
import { adminDb } from "@/lib/firebaseAdmin";
import { COUNTRY_MAP } from "@/lib/types";
import { SponsorFilters } from "@/components/sponsors/SponsorFilters";
import type { Sponsor } from "@/lib/types";

export const metadata = {
  title: "Verified Visa Sponsors",
  description:
    "Browse 90,000+ government-verified visa sponsors across UK, US, Canada, Netherlands, and more. Find companies that actively sponsor work visas for tech professionals.",
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ country?: string; q?: string }>;
}

export default async function SponsorsPage({ searchParams }: Props) {
  const params = await searchParams;
  const country = params.country || "";
  const q = params.q || "";

  let query: FirebaseFirestore.Query = adminDb.collection("sponsors");

  if (country) {
    query = query.where("country", "==", country.toUpperCase());
  }

  query = query.orderBy("companyName").limit(100);

  const snap = await query.get();
  let sponsors = snap.docs.map((doc) => doc.data() as Sponsor);

  // Client-side text filter (Firestore doesn't support text search)
  if (q) {
    const lower = q.toLowerCase();
    sponsors = sponsors.filter(
      (s) =>
        s.companyName.toLowerCase().includes(lower) ||
        s.companyNormalized.includes(lower)
    );
  }

  // Get total count estimate
  const totalSnap = await adminDb
    .collection("sponsors")
    .select("__name__")
    .limit(1)
    .get();
  const hasSponsors = totalSnap.size > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="font-sora text-3xl font-bold text-white sm:text-4xl">
          Verified Visa Sponsors
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-400">
          Companies verified through government registries to sponsor work visas.
          Cross-referenced with UK Home Office, USCIS, IRCC, and IND databases.
        </p>
      </div>

      <div className="mb-8">
        <SponsorFilters />
      </div>

      <p className="mb-6 text-sm text-slate-400">
        Showing {sponsors.length} sponsors
        {country && COUNTRY_MAP[country]
          ? ` in ${COUNTRY_MAP[country].flag} ${COUNTRY_MAP[country].name}`
          : ""}
        {q ? ` matching "${q}"` : ""}
      </p>

      {sponsors.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-lg text-slate-400">
            {hasSponsors
              ? "No sponsors match your filters."
              : "Sponsor data is being loaded. Check back soon."}
          </p>
          {hasSponsors && (
            <Link
              href="/sponsors"
              className="mt-4 inline-block text-sky-400 transition hover:text-sky-300"
            >
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sponsors.map((sponsor) => {
            const c = COUNTRY_MAP[sponsor.country];
            return (
              <Link
                key={sponsor.id}
                href={`/jobs?q=${encodeURIComponent(sponsor.companyName)}`}
                className="group rounded-xl border border-navy-600/50 bg-navy-800 p-5 transition hover:border-sky-500/30 hover:bg-navy-700"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-sora text-lg font-semibold text-white group-hover:text-sky-400">
                      {sponsor.companyName}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {c?.flag || "🌍"} {c?.name || sponsor.country}
                    </p>
                  </div>
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                    <svg
                      className="h-3 w-3"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Verified
                  </span>
                </div>

                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Registry</dt>
                    <dd className="text-slate-300">
                      {sponsor.registrySource}
                    </dd>
                  </div>
                  {sponsor.licenseType && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500">License</dt>
                      <dd className="text-slate-300">
                        {sponsor.licenseType}
                      </dd>
                    </div>
                  )}
                  {sponsor.validUntil && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Valid until</dt>
                      <dd className="text-slate-300">
                        {sponsor.validUntil}
                      </dd>
                    </div>
                  )}
                </dl>

                {sponsor.topRoles?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {sponsor.topRoles.slice(0, 3).map((role) => (
                      <span
                        key={role}
                        className="rounded-md bg-sky-500/10 px-2 py-0.5 text-xs text-sky-300"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                )}

                <p className="mt-3 text-xs text-sky-400 opacity-0 transition group-hover:opacity-100">
                  View jobs from this sponsor →
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
