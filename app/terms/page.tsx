import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "VisaHunt terms of service — rules and guidelines for using our platform.",
  alternates: {
    canonical: "https://visa-hunt.com/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-navy-900 py-16 px-4 sm:px-6">
      <article className="mx-auto max-w-3xl prose prose-invert prose-headings:font-sora prose-h1:text-3xl prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-slate-300 prose-li:text-slate-300 prose-a:text-sky-400 hover:prose-a:text-sky-300">
        <h1>Terms of Service</h1>
        <p className="text-slate-400 text-sm !mt-2">
          Effective date: March 1, 2026
        </p>

        <p>
          Welcome to VisaHunt. By accessing or using our website at{" "}
          <a href="https://visa-hunt.com" target="_blank" rel="noreferrer">
            visa-hunt.com
          </a>{" "}
          (&quot;the Service&quot;), you agree to be bound by these Terms of
          Service (&quot;Terms&quot;). If you do not agree, please do not use
          the Service.
        </p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By creating an account or using any part of VisaHunt, you confirm that
          you are at least 18 years old and agree to these Terms. We may update
          these Terms from time to time, and continued use of the Service
          constitutes acceptance of the updated Terms.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          VisaHunt is a free job aggregation platform that collects and displays
          visa-sponsored tech job listings from third-party sources, including
          government sponsor registries and employer career pages. VisaHunt is
          not an employer, recruitment agency, or staffing firm. We do not
          directly post jobs, make hiring decisions, or guarantee employment
          outcomes.
        </p>

        <h2>3. User Accounts</h2>
        <p>
          You may create an account using Google Authentication. You are
          responsible for maintaining the security of your account and for all
          activity that occurs under it. You agree to provide accurate
          information and to notify us immediately of any unauthorized access.
        </p>

        <h2>4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>
            Use the Service for any unlawful purpose or in violation of any
            applicable laws.
          </li>
          <li>
            Scrape, crawl, or use automated tools to extract data from the
            Service without our written permission.
          </li>
          <li>
            Attempt to gain unauthorized access to any part of the Service or
            its infrastructure.
          </li>
          <li>
            Impersonate another person or misrepresent your affiliation with any
            entity.
          </li>
          <li>
            Interfere with or disrupt the Service, servers, or networks
            connected to the Service.
          </li>
          <li>
            Use the Service to distribute spam, malware, or unsolicited
            communications.
          </li>
        </ul>

        <h2>5. Job Listings Disclaimer</h2>
        <p>
          Job listings displayed on VisaHunt are sourced from third-party
          websites, government sponsor registries, and public career pages. We
          make reasonable efforts to ensure accuracy but do not guarantee that
          any listing is current, complete, or accurate. Visa sponsorship
          status, salary ranges, and job details may change without notice.
          Always verify details directly with the employer before applying.
        </p>

        <h2>6. Intellectual Property</h2>
        <p>
          The VisaHunt name, logo, design, and original content are the property
          of VisaHunt. Job listing data belongs to the respective employers and
          sources. You may not reproduce, distribute, or create derivative works
          from our content without permission.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, VisaHunt and its operators
          shall not be liable for any indirect, incidental, special,
          consequential, or punitive damages arising from your use of the
          Service. This includes, but is not limited to, damages related to job
          application outcomes, visa decisions, relocation costs, or reliance on
          information displayed on the Service.
        </p>
        <p>
          The Service is provided &quot;as is&quot; and &quot;as available&quot;
          without warranties of any kind, whether express or implied, including
          warranties of merchantability, fitness for a particular purpose, or
          non-infringement.
        </p>

        <h2>8. Termination</h2>
        <p>
          We reserve the right to suspend or terminate your access to the
          Service at any time, with or without cause, and with or without
          notice. You may delete your account at any time by contacting us.
        </p>

        <h2>9. Changes to Terms</h2>
        <p>
          We may modify these Terms at any time. When we do, we will update the
          effective date at the top of this page. Material changes will be
          communicated via email or a notice on the Service. Your continued use
          after changes take effect constitutes acceptance of the revised Terms.
        </p>

        <h2>10. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the
          laws of India, without regard to conflict of law principles. Any
          disputes arising from these Terms shall be subject to the exclusive
          jurisdiction of courts in India.
        </p>

        <h2>11. Contact Us</h2>
        <p>
          If you have questions about these Terms, please contact us at:
        </p>
        <p>
          <a href="mailto:legal@visa-hunt.com">legal@visa-hunt.com</a>
        </p>
      </article>
    </div>
  );
}
