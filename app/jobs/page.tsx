"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFilters } from "@/components/jobs/JobFilters";
import type { NormalizedJob, SearchFilters, SearchResponse, GlobalStats, JobMode } from "@/lib/types";
import { COUNTRY_MAP } from "@/lib/types";

export default function JobListingsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
      </div>
    }>
      <JobListingsContent />
    </Suspense>
  );
}

function JobListingsContent() {
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

  const [mode, setMode] = useState<JobMode>(
    (searchParams.get("mode") as JobMode) || "visa"
  );

  const [filters, setFilters] = useState<SearchFilters>(() => {
    const techStack = searchParams.get("techStack");
    return {
      q: searchParams.get("q") || undefined,
      country: searchParams.get("country") || undefined,
      verifiedOnly: searchParams.get("verifiedOnly") === "true",
      techStack: techStack ? techStack.split(",") : undefined,
      experienceLevel: (searchParams.get("experienceLevel") as SearchFilters["experienceLevel"]) || undefined,
      remote: (searchParams.get("remote") as SearchFilters["remote"]) || undefined,
      postedWithin: searchParams.get("postedWithin") ? Number(searchParams.get("postedWithin")) : undefined,
      mode: (searchParams.get("mode") as JobMode) || "visa",
    };
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
        if (filters.mode) params.set("mode", filters.mode);
        if (append && cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/jobs/search?${params.toString()}`);
        if (!res.ok) throw new Error("Search failed");
        const data: SearchResponse = await res.json();
        const jobs = data.jobs || [];

        setJobs((prev) => (append ? [...prev, ...jobs] : jobs));
        setHasMore(data.hasMore ?? false);
        setCursor(data.cursor);
        setTotalCount(data.totalCount ?? 0);
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

  // Handle mode toggle
  const handleModeChange = (newMode: JobMode) => {
    setMode(newMode);
    // Reset filters when switching modes, keep search query
    const newFilters: SearchFilters = {
      q: filters.q,
      mode: newMode,
    };
    setFilters(newFilters);
    const params = new URLSearchParams();
    if (newFilters.q) params.set("q", newFilters.q);
    params.set("mode", newMode);
    router.replace(`/jobs?${params.toString()}`, { scroll: false });
  };

  // Update URL params
  const handleFilterChange = (newFilters: SearchFilters) => {
    const withMode = { ...newFilters, mode };
    setFilters(withMode);
    const params = new URLSearchParams();
    if (withMode.q) params.set("q", withMode.q);
    if (withMode.country) params.set("country", withMode.country);
    if (withMode.verifiedOnly) params.set("verifiedOnly", "true");
    if (withMode.techStack?.length) params.set("techStack", withMode.techStack.join(","));
    if (withMode.experienceLevel) params.set("experienceLevel", withMode.experienceLevel);
    if (withMode.remote) params.set("remote", withMode.remote);
    if (withMode.postedWithin) params.set("postedWithin", String(withMode.postedWithin));
    if (mode) params.set("mode", mode);
    router.replace(`/jobs?${params.toString()}`, { scroll: false });
  };

  const activeCountry = filters.country ? COUNTRY_MAP[filters.country] : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Mode toggle */}
      <div className="mb-6">
        <div className="inline-flex rounded-xl border border-navy-600 bg-navy-800 p-1">
          <button
            onClick={() => handleModeChange("visa")}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition ${
              mode === "visa"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            Visa Sponsored
          </button>
          <button
            onClick={() => handleModeChange("remote-anywhere")}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition ${
              mode === "remote-anywhere"
                ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Remote Anywhere
          </button>
        </div>
      </div>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-sora text-3xl font-bold text-white">
          {mode === "remote-anywhere"
            ? "Work From Anywhere Jobs"
            : activeCountry
              ? `${activeCountry.flag} Visa-Sponsored Jobs in ${activeCountry.name}`
              : "All Visa-Sponsored Tech Jobs"}
        </h1>
        <p className="mt-2 text-slate-400">
          {mode === "remote-anywhere"
            ? "Fully remote jobs with no location restriction — work from India or anywhere in the world"
            : stats?.totalJobs
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
              {(totalCount || jobs.length) > 0
                ? `${totalCount || jobs.length} ${(totalCount || jobs.length) === 1 ? "job" : "jobs"} found`
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
