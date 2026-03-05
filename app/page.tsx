"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SUPPORTED_COUNTRIES } from "@/lib/types";
import type { NormalizedJob, GlobalStats } from "@/lib/types";
import { JobCard } from "@/components/jobs/JobCard";

export default function LandingPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [trending, setTrending] = useState<NormalizedJob[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    fetch("/api/jobs/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});

    fetch("/api/jobs/trending")
      .then((r) => r.json())
      .then((d) => setTrending(d.jobs || []))
      .catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/jobs${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ""}`;
  };

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubscribed(true);
    } catch {}
  };

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-sky-500/5 blur-[120px]" />
          <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-cyan-500/5 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-4 py-1.5 text-sm text-sky-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
            </span>
            {stats?.totalJobs
              ? `${stats.totalJobs.toLocaleString()} visa-sponsored jobs live`
              : "Thousands of visa-sponsored jobs"}
          </div>

          <h1 className="font-sora text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Every Visa-Sponsored
            <br />
            <span className="bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
              Tech Job.
            </span>{" "}
            One Search.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            Built for Indian developers. Government-verified sponsors, salaries in INR,
            and visa guides — everything you need to land a job abroad.
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="mx-auto mt-8 flex max-w-xl gap-2"
          >
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by role, tech stack, or company..."
                className="w-full rounded-lg border border-navy-600 bg-navy-800 py-3 pl-10 pr-4 text-white placeholder-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-sky-500 px-6 py-3 font-medium text-white transition hover:bg-sky-400"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Country cards */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center font-sora text-2xl font-bold text-white">
            Browse by Country
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {SUPPORTED_COUNTRIES.slice(0, 6).map((country) => (
              <Link
                key={country.code}
                href={`/jobs?country=${country.code}`}
                className="group rounded-xl border border-navy-600/50 bg-navy-800 p-4 text-center transition hover:border-sky-500/30 hover:bg-navy-700"
              >
                <span className="text-3xl">{country.flag}</span>
                <p className="mt-2 font-medium text-white">{country.name}</p>
                <p className="mt-1 font-spaceGrotesk text-sm text-sky-400">
                  {stats?.jobsByCountry?.[country.code]?.toLocaleString() || "—"} jobs
                </p>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/jobs"
              className="text-sm text-sky-400 transition hover:text-sky-300"
            >
              View all countries →
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center font-sora text-2xl font-bold text-white">
            How It Works
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Browse Jobs",
                desc: "Filter by country, tech stack, and experience level. All jobs confirmed to offer visa sponsorship.",
                icon: "🔍",
              },
              {
                step: "2",
                title: "Verify Sponsor",
                desc: "See which companies are government-verified visa sponsors. No more guessing or applying blind.",
                icon: "✓",
              },
              {
                step: "3",
                title: "Apply Direct",
                desc: "Apply directly on the company's website. Get salary comparisons in INR to make informed decisions.",
                icon: "🚀",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10 text-2xl">
                  {item.icon}
                </div>
                <h3 className="mt-4 font-sora text-lg font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verified sponsors highlight */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center sm:p-12">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
            <svg className="h-8 w-8 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h2 className="font-sora text-2xl font-bold text-white">
            Government-Verified Sponsors
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            We cross-reference{" "}
            <span className="font-spaceGrotesk font-semibold text-amber-400">
              {stats?.totalSponsors
                ? `${stats.totalSponsors.toLocaleString()}+`
                : "90,000+"}
            </span>{" "}
            licensed visa sponsors from UK, US, Canada, and Netherlands government
            registries. Look for the{" "}
            <span className="text-amber-400">verified badge</span> on job
            listings.
          </p>
        </div>
      </section>

      {/* Trending jobs */}
      {trending.length > 0 && (
        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-8 text-center font-sora text-2xl font-bold text-white">
              Trending Jobs
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trending.slice(0, 6).map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter CTA */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-sora text-2xl font-bold text-white">
            Get Weekly Job Alerts
          </h2>
          <p className="mt-3 text-slate-400">
            New visa-sponsored jobs delivered to your inbox. No signup needed.
          </p>
          {subscribed ? (
            <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400">
              You&apos;re subscribed! Check your inbox.
            </div>
          ) : (
            <form onSubmit={handleNewsletter} className="mt-6 flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 rounded-lg border border-navy-600 bg-navy-800 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-sky-500 px-6 py-3 font-medium text-white transition hover:bg-sky-400"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Salary teaser */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-sora text-2xl font-bold text-white">
            How Does Your Salary Compare?
          </h2>
          <p className="mt-3 text-slate-400">
            Every listing shows salaries in both local currency and INR.
            See how ₹25 LPA compares to €65K in Berlin or £55K in London.
          </p>
          <Link
            href="/jobs"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-3 font-medium text-white transition hover:bg-sky-400"
          >
            Explore Salaries
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
