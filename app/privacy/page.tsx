import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "VisaHunt privacy policy — how we collect, use, and protect your data.",
  alternates: {
    canonical: "https://visa-hunt.com/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-navy-900 py-16 px-4 sm:px-6">
      <article className="mx-auto max-w-3xl prose prose-invert prose-headings:font-sora prose-h1:text-3xl prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-slate-300 prose-li:text-slate-300 prose-a:text-sky-400 hover:prose-a:text-sky-300">
        <h1>Privacy Policy</h1>
        <p className="text-slate-400 text-sm !mt-2">
          Effective date: March 1, 2026
        </p>

        <p>
          VisaHunt (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates
          the website{" "}
          <a href="https://visa-hunt.com" target="_blank" rel="noreferrer">
            visa-hunt.com
          </a>
          . This Privacy Policy explains how we collect, use, disclose, and
          safeguard your information when you use our service.
        </p>

        <h2>1. Information We Collect</h2>
        <p>We may collect the following types of information:</p>
        <ul>
          <li>
            <strong>Account information:</strong> When you sign in via Google
            Authentication, we receive your name, email address, and profile
            picture from your Google account.
          </li>
          <li>
            <strong>Usage data:</strong> Pages visited, searches performed, jobs
            saved, and feature interactions.
          </li>
          <li>
            <strong>Device data:</strong> Browser type, operating system, IP
            address, and device identifiers for analytics and security purposes.
          </li>
          <li>
            <strong>Job preferences:</strong> Saved searches, job alerts
            configuration, and preferred countries or visa types.
          </li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve the VisaHunt service.</li>
          <li>Personalize your experience, including job recommendations and saved searches.</li>
          <li>Send job alert notifications you have opted into.</li>
          <li>Monitor usage patterns to improve performance and reliability.</li>
          <li>Detect and prevent fraud, abuse, or security incidents.</li>
          <li>Communicate service updates or respond to support requests.</li>
        </ul>

        <h2>3. Data Storage</h2>
        <p>
          Your data is stored using Google Firebase and Google Cloud Platform
          infrastructure. Data is encrypted in transit (TLS) and at rest.
          Firebase servers are located in regions governed by Google&apos;s data
          processing terms. We do not sell your personal data to third parties.
        </p>

        <h2>4. Cookies</h2>
        <p>
          We use cookies and similar technologies to maintain your session,
          remember preferences, and collect analytics data. You can control
          cookie settings through your browser. Disabling cookies may affect
          certain features of the service.
        </p>

        <h2>5. Third-Party Services</h2>
        <p>We integrate with the following third-party services:</p>
        <ul>
          <li>
            <strong>Google Authentication:</strong> For secure sign-in. Google
            receives standard OAuth data as described in their privacy policy.
          </li>
          <li>
            <strong>Google Analytics / Microsoft Clarity:</strong> For
            understanding usage patterns. These services may set their own
            cookies.
          </li>
          <li>
            <strong>Firebase (Google Cloud):</strong> For data storage and
            backend services.
          </li>
        </ul>
        <p>
          We encourage you to review the privacy policies of these third-party
          providers.
        </p>

        <h2>6. Data Retention</h2>
        <p>
          We retain your account data for as long as your account is active. If
          you delete your account, we will remove your personal data within 30
          days, except where retention is required by law. Anonymized usage data
          may be retained indefinitely for analytics purposes.
        </p>

        <h2>7. Your Rights</h2>
        <p>
          Depending on your jurisdiction, you may have the following rights
          regarding your personal data:
        </p>
        <ul>
          <li>
            <strong>Access:</strong> Request a copy of the personal data we hold
            about you.
          </li>
          <li>
            <strong>Correction:</strong> Request correction of inaccurate or
            incomplete data.
          </li>
          <li>
            <strong>Deletion:</strong> Request deletion of your personal data.
          </li>
          <li>
            <strong>Portability:</strong> Request your data in a
            machine-readable format.
          </li>
          <li>
            <strong>Objection:</strong> Object to processing of your data for
            specific purposes.
          </li>
        </ul>
        <p>
          If you are located in the European Economic Area (EEA) or the United
          Kingdom, you have rights under the GDPR. To exercise any of these
          rights, please contact us at the email below.
        </p>

        <h2>8. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy or wish to exercise
          your data rights, please contact us at:
        </p>
        <p>
          <a href="mailto:privacy@visa-hunt.com">privacy@visa-hunt.com</a>
        </p>
      </article>
    </div>
  );
}
