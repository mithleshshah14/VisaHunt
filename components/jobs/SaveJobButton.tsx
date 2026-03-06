"use client";

import { useSession, signIn } from "next-auth/react";
import { useSavedJobs } from "@/components/providers/SavedJobsProvider";

interface SaveJobButtonProps {
  jobId: string;
  size?: "sm" | "md";
}

export function SaveJobButton({ jobId, size = "md" }: SaveJobButtonProps) {
  const { data: session } = useSession();
  const { savedJobIds, toggleSave } = useSavedJobs();

  const isSaved = savedJobIds.includes(jobId);
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const btnSize =
    size === "sm" ? "p-1.5" : "p-2";

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      signIn("google");
      return;
    }

    toggleSave(jobId);
  };

  return (
    <button
      onClick={handleClick}
      className={`${btnSize} rounded-lg transition hover:bg-navy-600 ${
        isSaved ? "text-sky-400" : "text-slate-500 hover:text-slate-300"
      }`}
      title={isSaved ? "Remove from saved" : "Save job"}
      aria-label={isSaved ? "Remove from saved" : "Save job"}
    >
      <svg
        className={iconSize}
        fill={isSaved ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={isSaved ? 0 : 2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
    </button>
  );
}
