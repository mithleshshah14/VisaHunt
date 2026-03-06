import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Salary Comparison — Local Currency vs INR",
  description:
    "Compare tech salaries across countries with INR equivalents. See how developer pay in the UK, US, Germany, Canada, and more stacks up against Indian salaries — adjusted for cost of living.",
  alternates: {
    canonical: "https://visa-hunt.com/salary-comparison",
  },
};

export default function SalaryComparisonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
