"use client";

import { useState } from "react";
import type { Metadata } from "next";

const faqs = [
  {
    question: "What is VisaHunt?",
    answer:
      "VisaHunt is a free job search platform that aggregates visa-sponsored tech jobs from verified employers worldwide. We pull data from government sponsor registries and employer career pages so you can find opportunities in one place.",
  },
  {
    question: "Is VisaHunt free to use?",
    answer:
      "Yes, VisaHunt is completely free. You can search jobs, save listings, and set up job alerts at no cost. We may introduce optional premium features in the future, but core search will always remain free.",
  },
  {
    question: "How do you verify visa sponsors?",
    answer:
      "We cross-reference employers against official government sponsor registries, such as the UK Home Office sponsor list and USCIS H-1B employer data. Jobs from verified sponsors are clearly marked with a verification badge.",
  },
  {
    question: "What countries are supported?",
    answer:
      "We currently cover visa-sponsored jobs in the United Kingdom, United States, Germany, Netherlands, Canada, and Australia. We are actively expanding to more countries in Europe and Asia-Pacific.",
  },
  {
    question: "How often are jobs updated?",
    answer:
      "Our job database is updated daily. New listings are ingested from source websites and sponsor registries every 24 hours, and expired or filled positions are removed to keep results current.",
  },
  {
    question: "Can I save jobs and come back later?",
    answer:
      "Yes. Once you sign in with your Google account, you can save any job to your personal collection. Saved jobs are synced across devices and you will be notified if a saved listing is about to expire.",
  },
  {
    question: "How do job alerts work?",
    answer:
      "You can set up alerts based on your preferred role, country, and experience level. When new jobs matching your criteria are posted, we will send you an email notification so you never miss an opportunity.",
  },
  {
    question: "I'm not from India — can I still use VisaHunt?",
    answer:
      "Absolutely. While VisaHunt is designed with Indian developers in mind (including INR salary comparisons and India-specific visa guides), anyone looking for visa-sponsored tech jobs can use the platform.",
  },
  {
    question: "How do I apply for jobs listed on VisaHunt?",
    answer:
      "VisaHunt links you directly to the employer's application page. We do not process applications ourselves. Click 'Apply' on any listing to be taken to the original job posting where you can submit your application.",
  },
  {
    question: "Is my data safe?",
    answer:
      "Yes. We use Google Firebase for secure data storage with encryption in transit and at rest. We only collect the minimum data needed to provide the service, and we never sell your personal information. See our Privacy Policy for full details.",
  },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <div className="min-h-screen bg-navy-900 py-16 px-4 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-sora text-3xl font-bold text-white mb-2">
          Frequently Asked Questions
        </h1>
        <p className="text-slate-400 mb-10">
          Everything you need to know about VisaHunt.
        </p>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-lg border border-navy-600/50 bg-navy-800 overflow-hidden"
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-navy-700/50 transition-colors"
              >
                <span className="font-sora font-medium text-white pr-4">
                  {faq.question}
                </span>
                <ChevronIcon open={openIndex === i} />
              </button>
              {openIndex === i && (
                <div className="px-5 pb-4 pt-0">
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
