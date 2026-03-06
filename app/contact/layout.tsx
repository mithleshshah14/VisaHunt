import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with the VisaHunt team — questions, feedback, bug reports, or partnership inquiries.",
  alternates: {
    canonical: "https://visa-hunt.com/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
