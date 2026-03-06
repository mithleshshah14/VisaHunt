"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { SUPPORTED_COUNTRIES } from "@/lib/types";

// ============================================================
// Constants
// ============================================================

const INDIA = { code: "IN", name: "India", flag: "\u{1F1EE}\u{1F1F3}" };

const ALL_COUNTRIES = [
  INDIA,
  ...SUPPORTED_COUNTRIES.map((c) => ({
    code: c.code,
    name: c.name,
    flag: c.flag,
  })),
];

const ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "DevOps Engineer",
  "Data Scientist",
  "Product Manager",
  "Mobile Developer",
  "QA Engineer",
] as const;

type Role = (typeof ROLES)[number];

// Exchange rates to INR (approximate)
const EXCHANGE_RATES: Record<string, number> = {
  INR: 1,
  GBP: 107,
  EUR: 92,
  USD: 84,
  CAD: 62,
  AUD: 55,
  SGD: 63,
  SEK: 8,
  DKK: 12.3,
};

const CURRENCY_BY_COUNTRY: Record<string, { code: string; symbol: string }> = {
  IN: { code: "INR", symbol: "\u20B9" },
  GB: { code: "GBP", symbol: "\u00A3" },
  DE: { code: "EUR", symbol: "\u20AC" },
  NL: { code: "EUR", symbol: "\u20AC" },
  IE: { code: "EUR", symbol: "\u20AC" },
  FR: { code: "EUR", symbol: "\u20AC" },
  CA: { code: "CAD", symbol: "C$" },
  US: { code: "USD", symbol: "$" },
  SE: { code: "SEK", symbol: "kr" },
  DK: { code: "DKK", symbol: "kr" },
  AU: { code: "AUD", symbol: "A$" },
  SG: { code: "SGD", symbol: "S$" },
};

// Cost of living index (Bangalore = 100)
const COL_INDEX: Record<string, number> = {
  IN: 100,
  GB: 185,
  DE: 155,
  NL: 160,
  CA: 165,
  US: 195,
  IE: 170,
  SE: 165,
  DK: 190,
  AU: 175,
  SG: 180,
  FR: 160,
};

// Salary data: [minLocal (in thousands), maxLocal (in thousands)]
// India salaries are in lakhs (1L = 100K INR)
const SALARY_DATA: Record<string, Record<Role, [number, number]>> = {
  IN: {
    "Frontend Developer": [8, 15],
    "Backend Developer": [8, 18],
    "Full Stack Developer": [10, 20],
    "DevOps Engineer": [10, 22],
    "Data Scientist": [10, 25],
    "Product Manager": [12, 28],
    "Mobile Developer": [8, 18],
    "QA Engineer": [5, 12],
  },
  GB: {
    "Frontend Developer": [35, 55],
    "Backend Developer": [40, 65],
    "Full Stack Developer": [40, 65],
    "DevOps Engineer": [45, 70],
    "Data Scientist": [42, 68],
    "Product Manager": [45, 72],
    "Mobile Developer": [38, 60],
    "QA Engineer": [30, 48],
  },
  DE: {
    "Frontend Developer": [45, 65],
    "Backend Developer": [48, 72],
    "Full Stack Developer": [48, 70],
    "DevOps Engineer": [50, 75],
    "Data Scientist": [50, 78],
    "Product Manager": [52, 80],
    "Mobile Developer": [45, 68],
    "QA Engineer": [38, 55],
  },
  NL: {
    "Frontend Developer": [40, 60],
    "Backend Developer": [42, 68],
    "Full Stack Developer": [42, 65],
    "DevOps Engineer": [48, 72],
    "Data Scientist": [45, 70],
    "Product Manager": [48, 75],
    "Mobile Developer": [40, 62],
    "QA Engineer": [35, 52],
  },
  CA: {
    "Frontend Developer": [60, 90],
    "Backend Developer": [65, 100],
    "Full Stack Developer": [60, 95],
    "DevOps Engineer": [70, 110],
    "Data Scientist": [68, 105],
    "Product Manager": [72, 115],
    "Mobile Developer": [60, 92],
    "QA Engineer": [50, 78],
  },
  US: {
    "Frontend Developer": [80, 130],
    "Backend Developer": [90, 150],
    "Full Stack Developer": [85, 140],
    "DevOps Engineer": [95, 155],
    "Data Scientist": [95, 160],
    "Product Manager": [100, 165],
    "Mobile Developer": [85, 140],
    "QA Engineer": [65, 105],
  },
  IE: {
    "Frontend Developer": [38, 58],
    "Backend Developer": [40, 65],
    "Full Stack Developer": [40, 62],
    "DevOps Engineer": [45, 70],
    "Data Scientist": [42, 68],
    "Product Manager": [48, 75],
    "Mobile Developer": [38, 60],
    "QA Engineer": [32, 50],
  },
  SE: {
    "Frontend Developer": [380, 520],
    "Backend Developer": [400, 560],
    "Full Stack Developer": [390, 540],
    "DevOps Engineer": [420, 580],
    "Data Scientist": [410, 570],
    "Product Manager": [440, 600],
    "Mobile Developer": [380, 530],
    "QA Engineer": [320, 450],
  },
  DK: {
    "Frontend Developer": [380, 520],
    "Backend Developer": [400, 560],
    "Full Stack Developer": [390, 540],
    "DevOps Engineer": [420, 580],
    "Data Scientist": [410, 570],
    "Product Manager": [440, 600],
    "Mobile Developer": [380, 530],
    "QA Engineer": [320, 450],
  },
  AU: {
    "Frontend Developer": [70, 110],
    "Backend Developer": [75, 120],
    "Full Stack Developer": [72, 115],
    "DevOps Engineer": [80, 130],
    "Data Scientist": [80, 125],
    "Product Manager": [85, 135],
    "Mobile Developer": [70, 115],
    "QA Engineer": [60, 90],
  },
  SG: {
    "Frontend Developer": [55, 85],
    "Backend Developer": [60, 95],
    "Full Stack Developer": [58, 90],
    "DevOps Engineer": [65, 100],
    "Data Scientist": [62, 98],
    "Product Manager": [68, 105],
    "Mobile Developer": [55, 88],
    "QA Engineer": [45, 72],
  },
  FR: {
    "Frontend Developer": [38, 55],
    "Backend Developer": [40, 62],
    "Full Stack Developer": [40, 60],
    "DevOps Engineer": [42, 65],
    "Data Scientist": [42, 65],
    "Product Manager": [45, 70],
    "Mobile Developer": [38, 58],
    "QA Engineer": [32, 48],
  },
};

// ============================================================
// Helpers
// ============================================================

function formatLocalSalary(
  country: string,
  min: number,
  max: number
): string {
  const curr = CURRENCY_BY_COUNTRY[country];
  if (!curr) return "";

  if (country === "IN") {
    return `${curr.symbol}${min}L - ${curr.symbol}${max}L`;
  }

  // SE and DK are in thousands of SEK/DKK
  if (country === "SE" || country === "DK") {
    return `${min}K - ${max}K ${curr.code}`;
  }

  return `${curr.symbol}${min}K - ${curr.symbol}${max}K`;
}

function toINR(country: string, amountK: number): number {
  const curr = CURRENCY_BY_COUNTRY[country];
  if (!curr) return 0;
  const rate = EXCHANGE_RATES[curr.code] ?? 1;

  if (country === "IN") {
    // amountK is in lakhs already
    return amountK * 100000;
  }

  return amountK * 1000 * rate;
}

function formatINR(amount: number): string {
  // Format in lakhs
  const lakhs = amount / 100000;
  if (lakhs >= 100) {
    return `${(lakhs / 100).toFixed(1)}Cr`;
  }
  return `${lakhs.toFixed(1)}L`;
}

function getMultiplier(
  fromCountry: string,
  toCountry: string,
  role: Role
): number {
  const fromData = SALARY_DATA[fromCountry]?.[role];
  const toData = SALARY_DATA[toCountry]?.[role];
  if (!fromData || !toData) return 0;

  const fromMidINR = (toINR(fromCountry, fromData[0]) + toINR(fromCountry, fromData[1])) / 2;
  const toMidINR = (toINR(toCountry, toData[0]) + toINR(toCountry, toData[1])) / 2;

  if (fromMidINR === 0) return 0;
  return toMidINR / fromMidINR;
}

// ============================================================
// Components
// ============================================================

function CountrySelector({
  label,
  value,
  onChange,
  excludeCode,
}: {
  label: string;
  value: string;
  onChange: (code: string) => void;
  excludeCode?: string;
}) {
  const options = ALL_COUNTRIES.filter((c) => c.code !== excludeCode);

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-navy-600 bg-navy-800 px-4 py-2.5 text-sm text-white transition focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
      >
        {options.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function SalaryBar({
  value,
  maxValue,
  color,
}: {
  value: number;
  maxValue: number;
  color: "sky" | "emerald";
}) {
  const pct = Math.min((value / maxValue) * 100, 100);
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-navy-700">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${
          color === "emerald"
            ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
            : "bg-gradient-to-r from-sky-500 to-sky-400"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export default function SalaryComparisonPage() {
  const [fromCountry, setFromCountry] = useState("IN");
  const [toCountry, setToCountry] = useState("US");
  const [selectedRole, setSelectedRole] = useState<Role | "all">("all");

  const fromInfo = ALL_COUNTRIES.find((c) => c.code === fromCountry);
  const toInfo = ALL_COUNTRIES.find((c) => c.code === toCountry);

  const colFrom = COL_INDEX[fromCountry] ?? 100;
  const colTo = COL_INDEX[toCountry] ?? 100;

  const rolesToShow = selectedRole === "all" ? [...ROLES] : [selectedRole];

  // Find max INR value for bar chart scaling
  const maxINR = useMemo(() => {
    let max = 0;
    for (const role of rolesToShow) {
      const fromData = SALARY_DATA[fromCountry]?.[role];
      const toData = SALARY_DATA[toCountry]?.[role];
      if (fromData) max = Math.max(max, toINR(fromCountry, fromData[1]));
      if (toData) max = Math.max(max, toINR(toCountry, toData[1]));
    }
    return max;
  }, [fromCountry, toCountry, rolesToShow]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="font-sora text-3xl font-bold text-white sm:text-4xl">
          Salary Comparison
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-400">
          Compare tech salaries across countries with INR equivalents and
          cost-of-living adjustments. See what you could actually earn abroad.
        </p>
      </div>

      {/* Selectors */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <CountrySelector
          label="Compare From"
          value={fromCountry}
          onChange={setFromCountry}
          excludeCode={toCountry}
        />
        <CountrySelector
          label="Compare To"
          value={toCountry}
          onChange={setToCountry}
          excludeCode={fromCountry}
        />
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Role
          </label>
          <select
            value={selectedRole}
            onChange={(e) =>
              setSelectedRole(e.target.value as Role | "all")
            }
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-4 py-2.5 text-sm text-white transition focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">All Roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cost of living banner */}
      <div className="mb-8 rounded-xl border border-navy-600/50 bg-navy-800 p-5">
        <h2 className="font-sora text-sm font-semibold uppercase tracking-wider text-slate-400">
          Cost of Living Index
          <span className="ml-2 text-xs font-normal text-slate-500">
            (Bangalore = 100)
          </span>
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            { info: fromInfo, col: colFrom, code: fromCountry },
            { info: toInfo, col: colTo, code: toCountry },
          ].map(({ info, col, code }) => (
            <div
              key={code}
              className="flex items-center gap-4 rounded-lg bg-navy-900/50 px-4 py-3"
            >
              <span className="text-2xl">{info?.flag}</span>
              <div className="flex-1">
                <div className="text-sm text-slate-300">{info?.name}</div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-navy-700">
                  <div
                    className="h-full rounded-full bg-sky-500/70 transition-all duration-700"
                    style={{ width: `${Math.min((col / 200) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <span className="font-spaceGrotesk text-lg font-bold text-sky-400">
                {col}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Salary comparison cards */}
      <div className="space-y-4">
        {rolesToShow.map((role) => {
          const fromData = SALARY_DATA[fromCountry]?.[role];
          const toData = SALARY_DATA[toCountry]?.[role];
          if (!fromData || !toData) return null;

          const fromMinINR = toINR(fromCountry, fromData[0]);
          const fromMaxINR = toINR(fromCountry, fromData[1]);
          const toMinINR = toINR(toCountry, toData[0]);
          const toMaxINR = toINR(toCountry, toData[1]);

          const multiplier = getMultiplier(fromCountry, toCountry, role);
          const isHigher = multiplier > 1;

          // Effective purchasing power (salary adjusted by COL)
          const fromMidINR = (fromMinINR + fromMaxINR) / 2;
          const toMidINR = (toMinINR + toMaxINR) / 2;
          const effectiveTo = (toMidINR / colTo) * 100;
          const effectiveFrom = (fromMidINR / colFrom) * 100;
          const ppMultiplier = effectiveFrom > 0 ? effectiveTo / effectiveFrom : 0;

          return (
            <div
              key={role}
              className="rounded-xl border border-navy-600/50 bg-navy-800 p-5 sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                {/* Role + salary bars */}
                <div className="flex-1">
                  <h3 className="font-sora text-lg font-semibold text-white">
                    {role}
                  </h3>

                  {/* From country bar */}
                  <div className="mt-4 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        {fromInfo?.flag} {fromInfo?.name}
                      </span>
                      <span className="font-spaceGrotesk text-slate-300">
                        {formatLocalSalary(fromCountry, fromData[0], fromData[1])}
                      </span>
                    </div>
                    <SalaryBar
                      value={fromMaxINR}
                      maxValue={maxINR}
                      color="sky"
                    />
                    <div className="text-right font-spaceGrotesk text-xs text-slate-500">
                      {formatINR(fromMinINR)} - {formatINR(fromMaxINR)} INR
                    </div>
                  </div>

                  {/* To country bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        {toInfo?.flag} {toInfo?.name}
                      </span>
                      <span className="font-spaceGrotesk text-slate-300">
                        {formatLocalSalary(toCountry, toData[0], toData[1])}
                      </span>
                    </div>
                    <SalaryBar
                      value={toMaxINR}
                      maxValue={maxINR}
                      color="emerald"
                    />
                    <div className="text-right font-spaceGrotesk text-xs text-slate-500">
                      {formatINR(toMinINR)} - {formatINR(toMaxINR)} INR
                    </div>
                  </div>
                </div>

                {/* Multiplier badge */}
                <div className="flex flex-row items-center gap-3 sm:flex-col sm:items-end sm:gap-2 sm:pl-6 sm:text-right">
                  <div
                    className={`rounded-xl px-4 py-2 ${
                      isHigher
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    <div className="font-spaceGrotesk text-2xl font-bold sm:text-3xl">
                      {multiplier.toFixed(1)}x
                    </div>
                    <div className="text-xs opacity-70">
                      {isHigher ? "higher" : "lower"}
                    </div>
                  </div>

                  {/* Purchasing power */}
                  <div className="text-left sm:text-right">
                    <div className="text-xs text-slate-500">
                      Purchasing Power
                    </div>
                    <div
                      className={`font-spaceGrotesk text-sm font-semibold ${
                        ppMultiplier >= 1
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {ppMultiplier.toFixed(1)}x effective
                    </div>
                    <div className="text-xs text-slate-600">
                      adjusted for cost of living
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary insight */}
      {selectedRole !== "all" && (
        <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="text-sm text-emerald-300">
            <span className="font-semibold">Key insight:</span>{" "}
            {(() => {
              const mult = getMultiplier(fromCountry, toCountry, selectedRole);
              const colRatio = colTo / colFrom;
              const ppMult = mult / colRatio;
              if (mult > 1) {
                return `A ${selectedRole} in ${toInfo?.name} earns ${mult.toFixed(1)}x more than in ${fromInfo?.name}. After adjusting for cost of living (${colTo} vs ${colFrom}), your effective purchasing power is ${ppMult.toFixed(1)}x.`;
              }
              return `A ${selectedRole} in ${toInfo?.name} earns ${mult.toFixed(1)}x of what they'd earn in ${fromInfo?.name}. The cost of living index is ${colTo} vs ${colFrom}.`;
            })()}
          </p>
        </div>
      )}

      {/* CTA */}
      <div className="mt-12 rounded-xl border border-sky-500/20 bg-gradient-to-r from-sky-500/5 to-emerald-500/5 p-8 text-center">
        <h2 className="font-sora text-xl font-bold text-white sm:text-2xl">
          Ready to make the move?
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400">
          Browse visa-sponsored {selectedRole !== "all" ? selectedRole : "tech"}{" "}
          jobs in {toInfo?.name ?? "your target country"}.
        </p>
        <Link
          href={`/jobs?q=${encodeURIComponent(
            selectedRole !== "all" ? selectedRole : ""
          )}&country=${toCountry}`}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-3 font-medium text-white transition hover:bg-sky-400"
        >
          Browse {selectedRole !== "all" ? selectedRole : ""} Jobs in{" "}
          {toInfo?.name}
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
