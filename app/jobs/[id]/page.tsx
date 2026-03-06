"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { JobCard } from "@/components/jobs/JobCard";
import { SaveJobButton } from "@/components/jobs/SaveJobButton";
import type { NormalizedJob } from "@/lib/types";
import { formatSalary, formatINR, timeAgo } from "@/lib/utils";
import { COUNTRY_MAP } from "@/lib/types";
import { ReportJobButton } from "@/components/jobs/ReportJobButton";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<NormalizedJob | null>(null);
  const [similarJobs, setSimilarJobs] = useState<NormalizedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/jobs/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setJob(data.job);
        setSimilarJobs(data.similarJobs || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg text-slate-400">Job not found or has expired.</p>
        <Link href="/jobs" className="text-sky-400 hover:text-sky-300">
          ← Browse all jobs
        </Link>
      </div>
    );
  }

  const country = COUNTRY_MAP[job.country];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-slate-400">
        <Link href="/jobs" className="transition hover:text-sky-400">
          Jobs
        </Link>
        <span className="mx-2">/</span>
        {country && (
          <>
            <Link
              href={`/jobs?country=${job.country}`}
              className="transition hover:text-sky-400"
            >
              {country.flag} {country.name}
            </Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-slate-300">{job.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main content */}
        <div>
          {/* Header */}
          <div className="rounded-xl border border-navy-600/50 bg-navy-800 p-6">
            <div className="flex flex-wrap items-start gap-3">
              {job.verifiedSponsor && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-400">
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified Sponsor
                </span>
              )}
              <span className="rounded-full bg-sky-500/10 px-3 py-1 text-sm text-sky-300">
                {job.sponsorTier === "government"
                  ? "Government Registry"
                  : job.sponsorTier === "source-listed"
                    ? "Visa Source Listed"
                    : "Self-Reported"}
              </span>
            </div>

            <h1 className="mt-4 font-sora text-2xl font-bold text-white sm:text-3xl">
              {job.title}
            </h1>
            <p className="mt-2 text-lg text-slate-300">{job.company}</p>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-400">
              <span>{country?.flag} {job.location}</span>
              <span>{timeAgo(job.postedDate)}</span>
              {job.remote && (
                <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-cyan-400">
                  {job.remote === "remote" ? "Remote" : "Hybrid"}
                </span>
              )}
              {job.jobType && (
                <span className="capitalize">{job.jobType.replace("-", " ")}</span>
              )}
            </div>

            {/* Salary */}
            {job.salaryMin && job.salaryCurrency && (
              <div className="mt-4 rounded-lg bg-navy-900/50 p-4">
                <div className="font-spaceGrotesk text-xl font-semibold text-emerald-400">
                  {formatSalary(job.salaryMin, job.salaryCurrency)}
                  {job.salaryMax
                    ? ` — ${formatSalary(job.salaryMax, job.salaryCurrency)}`
                    : "+"}
                  <span className="ml-1 text-sm text-slate-500">/year</span>
                </div>
                {job.salaryMinINR && (
                  <div className="mt-1 text-sm text-slate-400">
                    ≈ {formatINR(job.salaryMinINR)}
                    {job.salaryMaxINR ? ` — ${formatINR(job.salaryMaxINR)}` : "+"} per year
                  </div>
                )}
              </div>
            )}

            {/* Tech stack */}
            {job.techStack?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {job.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-lg bg-sky-500/10 px-3 py-1 text-sm text-sky-300"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}

            {/* Apply button */}
            <div className="mt-6 flex items-center gap-3">
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-3 font-semibold text-white transition hover:bg-sky-400"
              >
                Apply on Company Site
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <SaveJobButton jobId={job.id} />
              <ReportJobButton jobId={job.id} size="md" />
            </div>
          </div>

          {/* Job description */}
          <div className="mt-6 rounded-xl border border-navy-600/50 bg-navy-800 p-6">
            <h2 className="mb-4 font-sora text-xl font-semibold text-white">
              Job Description
            </h2>
            <div
              className="prose prose-invert max-w-none prose-headings:font-sora prose-p:text-slate-300 prose-li:text-slate-300"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {/* Sponsor info */}
          {job.verifiedSponsor && job.sponsorDetails && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
              <h3 className="mb-3 font-sora text-sm font-semibold text-amber-400">
                Sponsor Verification
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-400">Registry</dt>
                  <dd className="text-slate-200">{job.sponsorDetails.registrySource}</dd>
                </div>
                {job.sponsorDetails.licenseType && (
                  <div className="flex justify-between">
                    <dt className="text-slate-400">License</dt>
                    <dd className="text-slate-200">{job.sponsorDetails.licenseType}</dd>
                  </div>
                )}
                {job.sponsorDetails.validUntil && (
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Valid until</dt>
                    <dd className="text-slate-200">{job.sponsorDetails.validUntil}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Visa info for country */}
          {country && (
            <div className="rounded-xl border border-navy-600/50 bg-navy-800 p-5">
              <h3 className="mb-3 font-sora text-sm font-semibold text-white">
                {country.flag} Visa Info — {country.name}
              </h3>
              <div className="space-y-1 text-sm text-slate-400">
                {country.visaTypes.map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                    {v}
                  </div>
                ))}
              </div>
              <Link
                href={`/visa-guides/${job.country.toLowerCase()}`}
                className="mt-3 block text-sm text-sky-400 hover:text-sky-300"
              >
                Read full visa guide →
              </Link>
            </div>
          )}

          {/* Similar jobs */}
          {similarJobs.length > 0 && (
            <div className="rounded-xl border border-navy-600/50 bg-navy-800 p-5">
              <h3 className="mb-3 font-sora text-sm font-semibold text-white">
                Similar Jobs
              </h3>
              <div className="space-y-3">
                {similarJobs.slice(0, 3).map((j) => (
                  <Link
                    key={j.id}
                    href={`/jobs/${j.id}`}
                    className="block rounded-lg bg-navy-900/50 p-3 transition hover:bg-navy-700"
                  >
                    <p className="text-sm font-medium text-white">{j.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {j.company} · {j.location}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Bottom sticky apply bar (mobile) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-navy-600 bg-navy-900/95 p-4 backdrop-blur lg:hidden">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-lg bg-sky-500 py-3 text-center font-semibold text-white transition hover:bg-sky-400"
        >
          Apply on Company Site
        </a>
      </div>
    </div>
  );
}
