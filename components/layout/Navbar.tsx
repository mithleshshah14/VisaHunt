"use client";

import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { href: "/jobs", label: "Jobs" },
  { href: "/visa-guides", label: "Visa Guides" },
  { href: "/sponsors", label: "Sponsors" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass border-b border-navy-600/50">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20">
            <span className="text-lg font-bold text-sky-400">V</span>
          </div>
          <span className="font-sora text-xl font-bold text-white">
            Visa<span className="text-sky-400">Hunt</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-slate-300 transition hover:text-sky-400"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/jobs"
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-400"
          >
            Browse Jobs
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 transition hover:bg-navy-700 md:hidden"
          aria-label="Toggle menu"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="border-t border-navy-600/50 px-4 pb-4 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-3 text-sm text-slate-300 transition hover:text-sky-400"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/jobs"
            onClick={() => setMobileOpen(false)}
            className="mt-2 block rounded-lg bg-sky-500 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-sky-400"
          >
            Browse Jobs
          </Link>
        </div>
      )}
    </header>
  );
}
