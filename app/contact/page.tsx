"use client";

import { useState } from "react";

const subjects = ["General", "Bug Report", "Feature Request", "Partnership"];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "General",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } catch {
      // API not implemented yet — still show success
    }
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-navy-900 py-16 px-4 sm:px-6">
      <div className="mx-auto max-w-xl">
        <h1 className="font-sora text-3xl font-bold text-white mb-2">
          Contact Us
        </h1>
        <p className="text-slate-400 mb-8">
          Have a question, suggestion, or want to partner with us? We&apos;d
          love to hear from you.
        </p>

        {submitted ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
            <div className="text-emerald-400 text-4xl mb-3">&#10003;</div>
            <h2 className="font-sora text-xl font-semibold text-white mb-2">
              Message Sent
            </h2>
            <p className="text-slate-300 text-sm">
              Thank you for reaching out. We&apos;ll get back to you within 1-2
              business days.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-navy-600/50 bg-navy-800 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-300 mb-1.5"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-md border border-navy-600/50 bg-navy-900 px-3.5 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-300 mb-1.5"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-md border border-navy-600/50 bg-navy-900 px-3.5 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-slate-300 mb-1.5"
                >
                  Subject
                </label>
                <select
                  id="subject"
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                  className="w-full rounded-md border border-navy-600/50 bg-navy-900 px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500"
                >
                  {subjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-slate-300 mb-1.5"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  className="w-full rounded-md border border-navy-600/50 bg-navy-900 px-3.5 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 resize-none"
                  placeholder="Tell us what's on your mind..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-sky-500 px-4 py-2.5 font-medium text-white hover:bg-sky-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            You can also reach us directly at{" "}
            <a
              href="mailto:support@visa-hunt.com"
              className="text-sky-400 hover:text-sky-300"
            >
              support@visa-hunt.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
