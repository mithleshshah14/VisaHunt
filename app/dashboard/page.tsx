"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { JobCard } from "@/components/jobs/JobCard";
import { SUPPORTED_COUNTRIES } from "@/lib/types";
import type { NormalizedJob } from "@/lib/types";

type Tab = "saved" | "applied" | "alerts" | "profile";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  const [activeTab, setActiveTab] = useState<Tab>("saved");
  const [savedJobs, setSavedJobs] = useState<NormalizedJob[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<NormalizedJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingApplied, setLoadingApplied] = useState(false);

  // Alert form state
  const [alertCountries, setAlertCountries] = useState<string[]>([]);
  const [alertRoles, setAlertRoles] = useState("");
  const [alertTechStack, setAlertTechStack] = useState("");
  const [alertFrequency, setAlertFrequency] = useState<"daily" | "weekly">("daily");
  const [alertSaved, setAlertSaved] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && activeTab === "saved") {
      setLoadingJobs(true);
      fetch("/api/jobs/saved")
        .then((r) => r.json())
        .then((data) => setSavedJobs(data.jobs || []))
        .catch(() => {})
        .finally(() => setLoadingJobs(false));
    }
    if (status === "authenticated" && activeTab === "applied") {
      setLoadingApplied(true);
      fetch("/api/jobs/applied")
        .then((r) => r.json())
        .then((data) => setAppliedJobs(data.jobs || []))
        .catch(() => {})
        .finally(() => setLoadingApplied(false));
    }
  }, [status, activeTab]);

  // Unauthenticated state
  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  if (status !== "authenticated" || !session?.user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
        <div className="rounded-xl border border-navy-600/50 bg-navy-800 p-8 text-center sm:p-12">
          <svg
            className="mx-auto h-16 w-16 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
          <h1 className="mt-4 font-sora text-2xl font-bold text-white">
            Sign in to your dashboard
          </h1>
          <p className="mt-2 text-slate-400">
            Save jobs, set up alerts, and track your visa-sponsored job search.
          </p>
          <button
            onClick={() => signIn("google")}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-3 font-semibold text-white transition hover:bg-sky-400"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "saved", label: "Saved Jobs" },
    { key: "applied", label: "Applied Jobs" },
    { key: "alerts", label: "Job Alerts" },
    { key: "profile", label: "Profile" },
  ];

  const handleAlertSubmit = async () => {
    // Placeholder — API will be built later
    setAlertSaved(true);
    setTimeout(() => setAlertSaved(false), 3000);
  };

  const toggleCountry = (code: string) => {
    setAlertCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-sora text-2xl font-bold text-white sm:text-3xl">
        Dashboard
      </h1>

      {/* Discord banner */}
      <a
        href="https://discord.gg/RSUe4rpu"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4 transition hover:border-indigo-500/40 hover:bg-indigo-500/15"
      >
        <svg className="h-8 w-8 shrink-0 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
        </svg>
        <div className="min-w-0">
          <p className="font-sora text-sm font-semibold text-indigo-300">
            Join our Discord community
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            Get notified about new visa-sponsored jobs and connect with other job seekers.
          </p>
        </div>
        <svg className="ml-auto h-5 w-5 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>

      {/* Tabs */}
      <div className="mt-6 flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key
                ? "bg-sky-500 text-white"
                : "bg-navy-800 text-slate-400 hover:bg-navy-700 hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {/* ===== Saved Jobs ===== */}
        {activeTab === "saved" && (
          <div>
            <p className="mb-4 text-sm text-slate-400">
              <span className="font-spaceGrotesk font-semibold text-slate-300">
                {savedJobs.length}
              </span>{" "}
              saved job{savedJobs.length !== 1 ? "s" : ""}
            </p>

            {loadingJobs ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
              </div>
            ) : savedJobs.length === 0 ? (
              <div className="rounded-xl border border-navy-600/50 bg-navy-800 p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-slate-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                <p className="mt-4 text-lg font-medium text-slate-300">
                  No saved jobs yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Browse jobs and bookmark the ones you like.
                </p>
                <a
                  href="/jobs"
                  className="mt-4 inline-block rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-400"
                >
                  Browse Jobs
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {savedJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== Applied Jobs ===== */}
        {activeTab === "applied" && (
          <div>
            <p className="mb-4 text-sm text-slate-400">
              <span className="font-spaceGrotesk font-semibold text-slate-300">
                {appliedJobs.length}
              </span>{" "}
              applied job{appliedJobs.length !== 1 ? "s" : ""}
            </p>

            {loadingApplied ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
              </div>
            ) : appliedJobs.length === 0 ? (
              <div className="rounded-xl border border-navy-600/50 bg-navy-800 p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-slate-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="mt-4 text-lg font-medium text-slate-300">
                  No applied jobs yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Mark jobs as applied to track your applications.
                </p>
                <a
                  href="/jobs"
                  className="mt-4 inline-block rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-400"
                >
                  Browse Jobs
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {appliedJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== Job Alerts ===== */}
        {activeTab === "alerts" && (
          <div className="rounded-xl border border-navy-600/50 bg-navy-800 p-6">
            <h2 className="font-sora text-lg font-semibold text-white">
              Set Up Job Alerts
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Get notified when new visa-sponsored jobs match your criteria.
            </p>

            <div className="mt-6 space-y-5">
              {/* Countries */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Countries
                </label>
                <div className="flex flex-wrap gap-2">
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => toggleCountry(c.code)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        alertCountries.includes(c.code)
                          ? "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/40"
                          : "bg-navy-700 text-slate-400 hover:bg-navy-600"
                      }`}
                    >
                      {c.flag} {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roles */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Roles
                </label>
                <input
                  type="text"
                  value={alertRoles}
                  onChange={(e) => setAlertRoles(e.target.value)}
                  placeholder="e.g. Frontend Engineer, Data Scientist"
                  className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Tech stack */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Tech Stack
                </label>
                <input
                  type="text"
                  value={alertTechStack}
                  onChange={(e) => setAlertTechStack(e.target.value)}
                  placeholder="e.g. React, Python, AWS"
                  className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Frequency
                </label>
                <div className="flex gap-4">
                  {(["daily", "weekly"] as const).map((freq) => (
                    <label
                      key={freq}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <input
                        type="radio"
                        name="frequency"
                        value={freq}
                        checked={alertFrequency === freq}
                        onChange={() => setAlertFrequency(freq)}
                        className="h-4 w-4 border-navy-600 bg-navy-900 text-sky-500 focus:ring-sky-500"
                      />
                      <span className="text-sm capitalize text-slate-300">
                        {freq}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAlertSubmit}
                  className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400"
                >
                  Save Alert
                </button>
                {alertSaved && (
                  <span className="text-sm text-emerald-400">
                    Alert saved successfully!
                  </span>
                )}
              </div>
            </div>

            {/* Placeholder for existing alerts */}
            <div className="mt-8 border-t border-navy-600/50 pt-6">
              <h3 className="text-sm font-medium text-slate-300">
                Your Alerts
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                No alerts configured yet. Set one up above to get started.
              </p>
            </div>
          </div>
        )}

        {/* ===== Profile ===== */}
        {activeTab === "profile" && (
          <div className="rounded-xl border border-navy-600/50 bg-navy-800 p-6">
            <div className="flex items-center gap-4">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt=""
                  className="h-16 w-16 rounded-full border-2 border-navy-600"
                />
              )}
              <div>
                <h2 className="font-sora text-lg font-semibold text-white">
                  {session.user.name || "User"}
                </h2>
                <p className="text-sm text-slate-400">{session.user.email}</p>
              </div>
            </div>

            <dl className="mt-6 space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-navy-900/50 px-4 py-3">
                <dt className="text-sm text-slate-400">Email</dt>
                <dd className="text-sm text-slate-200">
                  {session.user.email}
                </dd>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-navy-900/50 px-4 py-3">
                <dt className="text-sm text-slate-400">Saved Jobs</dt>
                <dd className="font-spaceGrotesk text-sm font-semibold text-slate-200">
                  {savedJobs.length}
                </dd>
              </div>
            </dl>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
