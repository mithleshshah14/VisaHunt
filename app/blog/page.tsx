import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Visa guides, relocation tips, and career advice for developers moving abroad.",
  alternates: {
    canonical: "https://visa-hunt.com/blog",
  },
};

const posts = [
  {
    title: "The Complete Guide to UK Skilled Worker Visa",
    date: "Coming Soon",
    snippet:
      "Everything you need to know about the UK Skilled Worker visa — eligibility, salary thresholds, the points-based system, and how to find a licensed sponsor.",
  },
  {
    title: "EU Blue Card vs National Visas: Which Is Right for You?",
    date: "Coming Soon",
    snippet:
      "A detailed comparison of the EU Blue Card and country-specific work visas in Germany, Netherlands, and France. Pros, cons, and processing times compared.",
  },
  {
    title: "How to Negotiate Relocation Packages as a Developer",
    date: "Coming Soon",
    snippet:
      "From flight reimbursement to temporary housing, learn what to ask for when negotiating your relocation package with an international employer.",
  },
  {
    title: "Top Companies Sponsoring Visas in 2026",
    date: "Coming Soon",
    snippet:
      "A curated list of tech companies actively sponsoring work visas across the US, UK, Germany, Canada, and Australia — with data on approval rates.",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-navy-900 py-16 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-sora text-3xl font-bold text-white mb-2">Blog</h1>
        <p className="text-slate-400 mb-10">
          Visa guides, relocation tips, and career advice for developers moving
          abroad.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {posts.map((post, i) => (
            <a
              key={i}
              href="#"
              className="group rounded-lg border border-navy-600/50 bg-navy-800 p-6 hover:border-sky-500/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block rounded-full bg-sky-500/10 border border-sky-500/30 px-2.5 py-0.5 text-xs font-medium text-sky-400">
                  Coming Soon
                </span>
              </div>
              <h2 className="font-sora text-lg font-semibold text-white mb-2 group-hover:text-sky-400 transition-colors">
                {post.title}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                {post.snippet}
              </p>
            </a>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm">
            More articles coming soon. We&apos;re working on in-depth guides to
            help you navigate visa sponsorship and relocation.
          </p>
        </div>
      </div>
    </div>
  );
}
