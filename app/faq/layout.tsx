import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Common questions about VisaHunt — how it works, supported countries, job alerts, and more.",
  alternates: {
    canonical: "https://visa-hunt.com/faq",
  },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return children;
}
