"use client";

import { useSession, signIn } from "next-auth/react";
import { useAppliedJobs } from "@/components/providers/AppliedJobsProvider";

interface ApplyJobButtonProps {
  jobId: string;
  size?: "sm" | "md";
}

export function ApplyJobButton({ jobId, size = "md" }: ApplyJobButtonProps) {
  const { data: session } = useSession();
  const { appliedJobIds, toggleApplied } = useAppliedJobs();

  const isApplied = appliedJobIds.includes(jobId);
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      signIn("google");
      return;
    }

    toggleApplied(jobId);
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 ${textSize} font-medium transition ${
        isApplied
          ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
          : "bg-navy-700 text-slate-400 hover:bg-navy-600 hover:text-slate-300"
      }`}
      title={isApplied ? "Undo: Mark as not applied" : "Mark as applied"}
    >
      <svg
        className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"}
        fill={isApplied ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={isApplied ? 0 : 2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {isApplied ? "Applied" : "Mark Applied"}
    </button>
  );
}
