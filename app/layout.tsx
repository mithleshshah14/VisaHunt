import type { Metadata } from "next";
import { Inter, Sora, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://visa-hunt.com"),
  icons: {
    icon: "/favicon.svg",
    apple: "/logo.svg",
  },
  title: {
    default: "VisaHunt — Every Visa-Sponsored Tech Job. One Search.",
    template: "%s | VisaHunt",
  },
  description:
    "Find visa-sponsored tech jobs worldwide. Government-verified sponsors, salary comparisons in INR, and visa guides — built for Indian developers looking to relocate abroad.",
  keywords: [
    "visa sponsored jobs",
    "tech jobs abroad",
    "work visa sponsorship",
    "H1B jobs",
    "UK skilled worker visa",
    "EU Blue Card jobs",
    "Indian developers abroad",
    "relocation jobs",
    "visa sponsor verification",
  ],
  openGraph: {
    type: "website",
    siteName: "VisaHunt",
    url: "https://visa-hunt.com",
    title: "VisaHunt — Every Visa-Sponsored Tech Job. One Search.",
    description:
      "Find visa-sponsored tech jobs worldwide. Government-verified sponsors, salary comparisons in INR, and visa guides — built for Indian developers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "VisaHunt — Every Visa-Sponsored Tech Job. One Search.",
    description:
      "Find visa-sponsored tech jobs worldwide. Government-verified sponsors, salary comparisons in INR, and visa guides.",
  },
  alternates: {
    canonical: "https://visa-hunt.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${sora.variable} ${spaceGrotesk.variable} font-sans antialiased`}
      >
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
