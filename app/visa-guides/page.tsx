import Link from "next/link";
import { SUPPORTED_COUNTRIES } from "@/lib/types";

export const metadata = {
  title: "Visa Guides for Indian Developers",
  description:
    "Comprehensive visa guides for Indian tech professionals. Learn about work visas, salary thresholds, processing times, and PR pathways for UK, Germany, Netherlands, Canada, and more.",
};

const guides = [
  {
    code: "GB",
    name: "United Kingdom",
    flag: "🇬🇧",
    visa: "Skilled Worker Visa",
    threshold: "£38,700/yr (≈ ₹41L)",
    processing: "3-8 weeks",
    highlight: "90,000+ licensed sponsors",
  },
  {
    code: "DE",
    name: "Germany",
    flag: "🇩🇪",
    visa: "EU Blue Card",
    threshold: "€43,800/yr (≈ ₹40L)",
    processing: "1-3 months",
    highlight: "No sponsor register needed",
  },
  {
    code: "NL",
    name: "Netherlands",
    flag: "🇳🇱",
    visa: "Highly Skilled Migrant",
    threshold: "€46,107/yr (≈ ₹42L)",
    processing: "2-4 weeks",
    highlight: "30% tax ruling benefit",
  },
  {
    code: "CA",
    name: "Canada",
    flag: "🇨🇦",
    visa: "LMIA Work Permit",
    threshold: "No fixed threshold",
    processing: "2-6 months",
    highlight: "PR pathway via Express Entry",
  },
  {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    visa: "H-1B Visa",
    threshold: "$60,000/yr (≈ ₹50L) typical",
    processing: "3-6 months (lottery)",
    highlight: "Annual cap: 85,000 visas",
  },
  {
    code: "IE",
    name: "Ireland",
    flag: "🇮🇪",
    visa: "Critical Skills Permit",
    threshold: "€38,000/yr (≈ ₹35L)",
    processing: "4-8 weeks",
    highlight: "Fast track to residency",
  },
];

export default function VisaGuidesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-12 text-center">
        <h1 className="font-sora text-3xl font-bold text-white sm:text-4xl">
          Visa Guides for Indian Developers
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-400">
          Everything you need to know about work visas, salary thresholds, processing
          times, and permanent residency pathways — all with costs in INR.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide) => (
          <Link
            key={guide.code}
            href={`/visa-guides/${guide.code.toLowerCase()}`}
            className="group rounded-xl border border-navy-600/50 bg-navy-800 p-6 transition hover:border-sky-500/30 hover:bg-navy-700"
          >
            <div className="text-4xl">{guide.flag}</div>
            <h2 className="mt-3 font-sora text-xl font-semibold text-white group-hover:text-sky-400">
              {guide.name}
            </h2>
            <p className="mt-1 text-sm font-medium text-sky-400">{guide.visa}</p>

            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-slate-500">Salary Threshold</dt>
                <dd className="font-spaceGrotesk text-slate-200">
                  {guide.threshold}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Processing Time</dt>
                <dd className="text-slate-200">{guide.processing}</dd>
              </div>
            </dl>

            <div className="mt-4 rounded-lg bg-sky-500/10 px-3 py-2 text-xs text-sky-300">
              {guide.highlight}
            </div>
          </Link>
        ))}
      </div>

      {/* Browse jobs CTA */}
      <div className="mt-12 text-center">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-3 font-medium text-white transition hover:bg-sky-400"
        >
          Browse All Visa-Sponsored Jobs
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
