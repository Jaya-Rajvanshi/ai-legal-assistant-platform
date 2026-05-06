import React from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
const LegalHelp = () => {
  return (
    <Layout>
      <div className="flex w-full flex-col gap-6">
        {/* Category cards */}
        <section className="space-y-3">
          <header className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-primary">
                Legal Help Categories
              </h1>
              <p className="mt-1 text-xs text-slate-600">
                Choose a category that best matches your issue, then use the AI
                assistant to prepare your complaint.
              </p>
            </div>
            <Link
              to="/"
              className="text-[11px] font-medium text-slate-500 hover:text-primary"
            >
              ← Back to dashboard
            </Link>
          </header>
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              to="/legal-help/property-financial"
              className="module-card"
            >
              <div className="module-card-inner">
                <div className="space-y-2">
                  <span className="badge-soft text-[10px]">
                    Category A
                  </span>
                  <h2 className="text-sm font-semibold">
                    Property &amp; Financial Crime
                  </h2>
                  <p className="text-[11px] text-sky-100/90">
                    Theft, property disputes, loan fraud, land encroachment,
                    investment scams and related issues.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-sky-50/90">
                  View subcategories →
                </span>
              </div>
            </Link>
            <Link to="/legal-help/cyber-digital" className="module-card">
              <div className="module-card-inner">
                <div className="space-y-2">
                  <span className="badge-soft text-[10px]">
                    Category B
                  </span>
                  <h2 className="text-sm font-semibold">
                    Cyber &amp; Digital Crime
                  </h2>
                  <p className="text-[11px] text-sky-100/90">
                    Online fraud, hacking, cyber bullying, identity theft, and
                    harmful digital content.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-sky-50/90">
                  View subcategories →
                </span>
              </div>
            </Link>
            <Link
              to="/legal-help/road-public-safety"
              className="module-card"
            >
              <div className="module-card-inner">
                <div className="space-y-2">
                  <span className="badge-soft text-[10px]">
                    Category C
                  </span>
                  <h2 className="text-sm font-semibold">
                    Road &amp; Public Safety
                  </h2>
                  <p className="text-[11px] text-sky-100/90">
                    Hit and run, accidents, public nuisance, drunk driving, and
                    related disputes.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-sky-50/90">
                  View subcategories →
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* Legal Action Dashboard */}
        <section className="mt-6 space-y-4">
          <h2 className="text-xl font-semibold text-primary">
            Legal Action Dashboard
          </h2>

          {/* Two-column layout */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* LEFT COLUMN: Know the Law */}
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-primary">
                  Know the Law
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  Before filing a complaint, understand your rights and
                  required documents.
                </p>
              </div>

              <div className="module-card relative overflow-hidden">
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                  <svg
                    className="h-full w-full"
                    viewBox="0 0 200 200"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M50 50 L150 50 L150 150 L50 150 Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle cx="100" cy="100" r="30" stroke="currentColor" />
                    <path
                      d="M80 80 L120 120 M120 80 L80 120"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <div className="module-card-inner relative">
                  <h4 className="text-sm font-semibold mb-2">
                    Property &amp; Financial Crime: What You Need to Know
                  </h4>
                  <ul className="space-y-1.5 text-[11px] text-sky-50/95 list-disc list-inside">
                    <li>
                      <span className="font-medium">Common Offences:</span>{" "}
                      Theft, Fraud, Cheating, Criminal Breach of Trust
                    </li>
                    <li>
                      <span className="font-medium">Relevant IPC Sections:</span>{" "}
                      378 (Theft), 420 (Cheating), 406 (Criminal Breach of
                      Trust), 409 (Criminal Breach of Trust by Public Servant)
                    </li>
                    <li>
                      <span className="font-medium">Possible Punishment:</span>{" "}
                      Imprisonment up to 7 years, fines, or both depending on
                      severity
                    </li>
                    <li>
                      <span className="font-medium">Evidence to Collect:</span>{" "}
                      Documents, bank records, contracts, transaction receipts,
                      communication records
                    </li>
                    <li>
                      <span className="font-medium">Where to Report:</span>{" "}
                      Local Police Station, Economic Offences Wing, Cyber Crime
                      Cell (if digital)
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: What To Do If You're a Victim */}
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-primary">
                  What To Do If You&apos;re a Victim
                </h3>
              </div>

              <div className="space-y-2">
                {[
                  {
                    num: 1,
                    title: "Ensure Immediate Safety",
                    icon: "🛡️",
                  },
                  {
                    num: 2,
                    title: "Gather Evidence",
                    icon: "📋",
                  },
                  {
                    num: 3,
                    title: "Inform Local Police Station",
                    icon: "🚔",
                  },
                  {
                    num: 4,
                    title: "File an FIR",
                    icon: "📝",
                  },
                  {
                    num: 5,
                    title: "Follow Up With Investigation Officer",
                    icon: "📞",
                  },
                ].map((step) => (
                  <div
                    key={step.num}
                    className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white/90 p-3 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                      {step.num}
                    </div>
                    <div className="flex flex-1 items-center gap-2">
                      <span className="text-base">{step.icon}</span>
                      <span className="text-xs font-medium text-slate-800">
                        {step.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Section: Legal Resources */}
          <div className="mt-6">
            <h3 className="mb-3 text-base font-semibold text-primary">
              Legal Resources
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="module-card">
                <div className="module-card-inner">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-semibold">
                        Types of Complaints
                      </h4>
                      <span className="text-lg opacity-50">⚖️</span>
                    </div>
                    <p className="text-[11px] text-sky-100/90">
                      Understand different types of legal complaints and where
                      to file them.
                    </p>
                    <button className="btn-primary mt-2 bg-white/90 text-primary hover:bg-white text-xs">
                      Learn More
                    </button>
                  </div>
                </div>
              </div>

              <div className="module-card">
                <div className="module-card-inner">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-semibold">Legal Glossary</h4>
                      <span className="text-lg opacity-50">📚</span>
                    </div>
                    <p className="text-[11px] text-sky-100/90">
                      Familiarize yourself with common legal terms and
                      definitions.
                    </p>
                    <button className="btn-primary mt-2 bg-white/90 text-primary hover:bg-white text-xs">
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default LegalHelp;

