import { Suspense } from "react";

export const metadata = {
  title: "Visa-Sponsored Tech Jobs",
  description:
    "Browse thousands of visa-sponsored tech jobs worldwide. Filter by country, tech stack, and experience level. Government-verified sponsors with salary comparisons in INR.",
};

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<JobsLoading />}>{children}</Suspense>;
}

function JobsLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
    </div>
  );
}
