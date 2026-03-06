"use client";

import Link from "next/link";
import type { NormalizedJob } from "@/lib/types";
import { formatSalary, formatINR, timeAgo } from "@/lib/utils";
import { COUNTRY_MAP } from "@/lib/types";
import { SaveJobButton } from "@/components/jobs/SaveJobButton";
import { ReportJobButton } from "@/components/jobs/ReportJobButton";

interface JobCardProps {
  job: NormalizedJob;
}

export function JobCard({ job }: JobCardProps) {
  const country = COUNTRY_MAP[job.country];

  return (
    <div className="group relative rounded-xl border border-navy-600/50 bg-navy-800 p-5 transition hover:border-sky-500/30 hover:bg-navy-700">
      <div className="absolute right-3 top-3 z-10">
        <SaveJobButton jobId={job.id} size="sm" />
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Verified badge + title */}
          <div className="flex items-center gap-2">
            {job.verifiedSponsor && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified
              </span>
            )}
            <Link
              href={`/jobs/${job.id}`}
              className="truncate font-sora text-lg font-semibold text-white transition group-hover:text-sky-400"
            >
              {job.title}
            </Link>
          </div>

          {/* Company */}
          <p className="mt-1 text-sm text-slate-300">{job.company}</p>

          {/* Meta row */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              {country?.flag || "🌍"} {job.location}
            </span>
            <span>{timeAgo(job.postedDate)}</span>
            {job.remote && (
              <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-cyan-400">
                {job.remote === "remote" ? "Remote" : "Hybrid"}
              </span>
            )}
          </div>

          {/* Salary */}
          {job.salaryMin && job.salaryCurrency && (
            <div className="mt-2">
              <span className="font-spaceGrotesk text-sm font-medium text-emerald-400">
                {formatSalary(job.salaryMin, job.salaryCurrency)}
                {job.salaryMax
                  ? ` - ${formatSalary(job.salaryMax, job.salaryCurrency)}`
                  : "+"}
              </span>
              {job.salaryMinINR && (
                <span className="ml-2 text-xs text-slate-500">
                  ≈ {formatINR(job.salaryMinINR)}
                  {job.salaryMaxINR ? ` - ${formatINR(job.salaryMaxINR)}` : "+"}/yr
                </span>
              )}
            </div>
          )}

          {/* Tech stack chips */}
          {job.techStack?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.techStack.slice(0, 6).map((tech) => (
                <span
                  key={tech}
                  className="rounded-md bg-sky-500/10 px-2 py-0.5 text-xs text-sky-300"
                >
                  {tech}
                </span>
              ))}
              {job.techStack!.length > 6 && (
                <span className="text-xs text-slate-500">
                  +{job.techStack.length - 6}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-3">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-400"
        >
          Apply
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
        <Link
          href={`/jobs/${job.id}`}
          className="text-sm text-slate-400 transition hover:text-sky-400"
        >
          View Details
        </Link>
        <span className="ml-auto">
          <ReportJobButton jobId={job.id} size="sm" />
        </span>
      </div>
    </div>
  );
}
