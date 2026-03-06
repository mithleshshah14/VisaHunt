"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";

interface ReportJobButtonProps {
  jobId: string;
  size?: "sm" | "md";
}

export function ReportJobButton({ jobId, size = "sm" }: ReportJobButtonProps) {
  const { data: session } = useSession();
  const [reported, setReported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const reports = JSON.parse(localStorage.getItem("vh_reported_jobs") || "[]");
    if (reports.includes(jobId)) setReported(true);
  }, [jobId]);

  async function handleReport() {
    if (!session) {
      signIn("google");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/jobs/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, reason: "no-visa-sponsorship" }),
      });
      if (res.ok) {
        setReported(true);
        const reports = JSON.parse(localStorage.getItem("vh_reported_jobs") || "[]");
        reports.push(jobId);
        localStorage.setItem("vh_reported_jobs", JSON.stringify(reports));
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  }

  if (reported) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-slate-500 ${size === "sm" ? "text-xs" : "text-sm"}`}
        title="You reported this job"
      >
        <svg className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 6a3 3 0 013-3h1.172a2 2 0 011.414.586l.828.828A2 2 0 0010.828 5H14a3 3 0 013 3v6a3 3 0 01-3 3H6a3 3 0 01-3-3V6z" />
        </svg>
        Reported
      </span>
    );
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className={`text-slate-400 ${size === "sm" ? "text-xs" : "text-sm"}`}>
          No visa sponsorship?
        </span>
        <button
          onClick={handleReport}
          disabled={loading}
          className={`rounded bg-red-500/20 px-2 py-0.5 text-red-400 transition hover:bg-red-500/30 ${size === "sm" ? "text-xs" : "text-sm"}`}
        >
          {loading ? "..." : "Yes, remove"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className={`text-slate-500 transition hover:text-slate-300 ${size === "sm" ? "text-xs" : "text-sm"}`}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        if (!session) {
          signIn("google");
          return;
        }
        setShowConfirm(true);
      }}
      className={`inline-flex items-center gap-1 text-slate-500 transition hover:text-red-400 ${size === "sm" ? "text-xs" : "text-sm"}`}
      title="Report: No visa sponsorship"
    >
      <svg className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
      </svg>
      Report no visa
    </button>
  );
}
