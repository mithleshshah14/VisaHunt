"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFilters } from "@/components/jobs/JobFilters";
import type { NormalizedJob, SearchFilters, SearchResponse, GlobalStats } from "@/lib/types";
import { COUNTRY_MAP } from "@/lib/types";

export default function JobListingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [jobs, setJobs] = useState<NormalizedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string>();
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const observerRef = useRef<IntersectionObserver>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<SearchFilters>({
    q: searchParams.get("q") || undefined,
    country: searchParams.get("country") || undefined,
    verifiedOnly: searchParams.get("verifiedOnly") === "true",
  });

  // Fetch stats
  useEffect(() => {
    fetch("/api/jobs/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d?.totalJobs != null && setStats(d))
      .catch(() => {});
  }, []);

  // Fetch jobs
  const fetchJobs = useCallback(
    async (append = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filters.q) params.set("q", filters.q);
        if (filters.country) params.set("country", filters.country);
        if (filters.techStack?.length) params.set("techStack", filters.techStack.join(","));
        if (filters.experienceLevel) params.set("experienceLevel", filters.experienceLevel);
        if (filters.remote) params.set("remote", filters.remote);
        if (filters.verifiedOnly) params.set("verifiedOnly", "true");
        if (append && cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/jobs/search?${params.toString()}`);
        const data: SearchResponse = await res.json();

        setJobs((prev) => (append ? [...prev, ...data.jobs] : data.jobs));
        setHasMore(data.hasMore);
        setCursor(data.cursor);
        setTotalCount(data.totalCount);
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    },
    [filters, cursor]
  );

  // Initial fetch + refetch on filter change
  useEffect(() => {
    setCursor(undefined);
    fetchJobs(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchJobs(true);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, fetchJobs]);

  // Update URL params
  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    if (newFilters.q) params.set("q", newFilters.q);
    if (newFilters.country) params.set("country", newFilters.country);
    if (newFilters.verifiedOnly) params.set("verifiedOnly", "true");
    router.replace(`/jobs?${params.toString()}`, { scroll: false });
  };

  const activeCountry = filters.country ? COUNTRY_MAP[filters.country] : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-sora text-3xl font-bold text-white">
          {activeCountry
            ? `${activeCountry.flag} Visa-Sponsored Jobs in ${activeCountry.name}`
            : "All Visa-Sponsored Tech Jobs"}
        </h1>
        <p className="mt-2 text-slate-400">
          {stats?.totalJobs
            ? `${stats.totalJobs.toLocaleString()} jobs across ${stats.countriesCount} countries`
            : "Browse thousands of visa-sponsored positions worldwide"}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Sidebar filters */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-xl border border-navy-600/50 bg-navy-800 p-5">
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                value={filters.q || ""}
                onChange={(e) => handleFilterChange({ ...filters, q: e.target.value || undefined })}
                placeholder="Search jobs..."
                className="w-full rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500"
              />
            </div>
            <JobFilters filters={filters} onFilterChange={handleFilterChange} />
          </div>

          {/* Stats sidebar */}
          {stats?.jobsByCountry && (
            <div className="mt-4 rounded-xl border border-navy-600/50 bg-navy-800 p-5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Jobs by Country
              </h3>
              <div className="space-y-2">
                {Object.entries(stats.jobsByCountry)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 8)
                  .map(([code, count]) => {
                    const country = COUNTRY_MAP[code];
                    return (
                      <button
                        key={code}
                        onClick={() => handleFilterChange({ ...filters, country: code })}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-sm transition hover:bg-navy-700"
                      >
                        <span className="text-slate-300">
                          {country?.flag || "🌍"} {country?.name || code}
                        </span>
                        <span className="font-spaceGrotesk text-sky-400">
                          {count.toLocaleString()}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </aside>

        {/* Job results */}
        <div>
          {/* Sort + count */}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-slate-400">
              {totalCount > 0
                ? `${totalCount} ${totalCount === 1 ? "job" : "jobs"} found`
                : loading
                  ? "Searching..."
                  : "No jobs found"}
            </span>
          </div>

          {/* Job cards */}
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          {/* Loading states */}
          {loading && (
            <div className="mt-8 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
            </div>
          )}

          {/* Empty state */}
          {!loading && jobs.length === 0 && (
            <div className="mt-12 text-center">
              <p className="text-lg text-slate-400">No jobs match your filters.</p>
              <button
                onClick={() => handleFilterChange({})}
                className="mt-4 text-sky-400 transition hover:text-sky-300"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Infinite scroll trigger */}
          <div ref={loadMoreRef} className="h-10" />
        </div>
      </div>
    </div>
  );
}
