import Link from "next/link";

const footerLinks = {
  Product: [
    { href: "/jobs", label: "Browse Jobs" },
    { href: "/visa-guides", label: "Visa Guides" },
    { href: "/sponsors", label: "Verified Sponsors" },
    { href: "/salary-comparison", label: "Salary Comparison" },
  ],
  Resources: [
    { href: "/blog", label: "Blog" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-navy-600/50 bg-navy-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="font-sora text-xl font-bold text-white">
              Visa<span className="text-sky-400">Hunt</span>
            </Link>
            <p className="mt-3 text-sm text-slate-400">
              Every visa-sponsored tech job. One search. Built for Indian
              developers looking to work abroad.
            </p>
          </div>

          {/* Link groups */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">
                {group}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition hover:text-sky-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-navy-600/50 pt-6 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} VisaHunt. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
