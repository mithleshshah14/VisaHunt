"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SUPPORTED_COUNTRIES } from "@/lib/types";

function SponsorFiltersInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCountry = searchParams.get("country") || "";
  const currentQ = searchParams.get("q") || "";

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/sponsors?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        defaultValue={currentQ}
        onChange={(e) => updateParams("q", e.target.value)}
        placeholder="Search sponsors by company name..."
        className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-sky-500"
      />
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => updateParams("country", "")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            !currentCountry
              ? "bg-sky-500 text-white"
              : "bg-navy-700 text-slate-300 hover:bg-navy-600"
          }`}
        >
          All Countries
        </button>
        {SUPPORTED_COUNTRIES.map((c) => (
          <button
            key={c.code}
            onClick={() => updateParams("country", c.code)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              currentCountry === c.code
                ? "bg-sky-500 text-white"
                : "bg-navy-700 text-slate-300 hover:bg-navy-600"
            }`}
          >
            {c.flag} {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SponsorFilters() {
  return (
    <Suspense fallback={<div className="h-20 animate-pulse rounded-lg bg-navy-800" />}>
      <SponsorFiltersInner />
    </Suspense>
  );
}
