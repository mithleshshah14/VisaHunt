"use client";

import { useState } from "react";
import { SUPPORTED_COUNTRIES } from "@/lib/types";
import type { SearchFilters, ExperienceLevel, RemoteType } from "@/lib/types";

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead / Staff" },
];

const REMOTE_OPTIONS: { value: RemoteType; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

const POPULAR_TECH = [
  "React", "TypeScript", "Python", "Node.js", "Java", "Go",
  "AWS", "Docker", "Kubernetes", "PostgreSQL", "GraphQL", "Rust",
];

interface JobFiltersProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
}

export function JobFilters({ filters, onFilterChange }: JobFiltersProps) {
  const [expanded, setExpanded] = useState(
    !!(filters.experienceLevel || filters.remote)
  );

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFilterChange({ ...filters, [key]: value || undefined, cursor: undefined });
  };

  const toggleTech = (tech: string) => {
    const current = filters.techStack || [];
    const lower = tech.toLowerCase();
    const newStack = current.includes(lower)
      ? current.filter((t) => t !== lower)
      : [...current, lower];
    updateFilter("techStack", newStack.length > 0 ? newStack : undefined);
  };

  return (
    <div className="space-y-4">
      {/* Country chips */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Country
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateFilter("country", undefined)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              !filters.country
                ? "bg-sky-500 text-white"
                : "bg-navy-700 text-slate-300 hover:bg-navy-600"
            }`}
          >
            All
          </button>
          {SUPPORTED_COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => updateFilter("country", c.code)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filters.country === c.code
                  ? "bg-sky-500 text-white"
                  : "bg-navy-700 text-slate-300 hover:bg-navy-600"
              }`}
            >
              {c.flag} {c.code}
            </button>
          ))}
        </div>
      </div>

      {/* Tech stack chips */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Tech Stack
        </h3>
        <div className="flex flex-wrap gap-2">
          {POPULAR_TECH.map((tech) => (
            <button
              key={tech}
              onClick={() => toggleTech(tech)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filters.techStack?.includes(tech.toLowerCase())
                  ? "bg-cyan-500 text-white"
                  : "bg-navy-700 text-slate-300 hover:bg-navy-600"
              }`}
            >
              {tech}
            </button>
          ))}
        </div>
      </div>

      {/* Verified only toggle */}
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={filters.verifiedOnly || false}
          onChange={(e) => updateFilter("verifiedOnly", e.target.checked || undefined)}
          className="h-4 w-4 rounded border-navy-600 bg-navy-700 text-sky-500 focus:ring-sky-500"
        />
        <span className="text-sm text-slate-300">Verified sponsors only</span>
      </label>

      {/* Toggle more filters */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-sky-400 transition hover:text-sky-300"
      >
        {expanded ? "Less filters" : "More filters"}
      </button>

      {expanded && (
        <div className="space-y-4">
          {/* Experience level */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Experience
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateFilter("experienceLevel", undefined)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  !filters.experienceLevel
                    ? "bg-sky-500 text-white"
                    : "bg-navy-700 text-slate-300 hover:bg-navy-600"
                }`}
              >
                Any
              </button>
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => updateFilter("experienceLevel", level.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    filters.experienceLevel === level.value
                      ? "bg-sky-500 text-white"
                      : "bg-navy-700 text-slate-300 hover:bg-navy-600"
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Remote/Hybrid/Onsite */}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Work Type
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateFilter("remote", undefined)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  !filters.remote
                    ? "bg-sky-500 text-white"
                    : "bg-navy-700 text-slate-300 hover:bg-navy-600"
                }`}
              >
                Any
              </button>
              {REMOTE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateFilter("remote", opt.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    filters.remote === opt.value
                      ? "bg-sky-500 text-white"
                      : "bg-navy-700 text-slate-300 hover:bg-navy-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
