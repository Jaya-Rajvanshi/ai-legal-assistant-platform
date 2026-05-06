import React from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import Logo from "../components/Logo.jsx";

const Home = () => {
  return (
    <Layout>
      <div className="flex w-full flex-col gap-6 lg:flex-row">
        {/* Main content */}
        <div className="flex flex-1 flex-col gap-6">
          <section className="w-full">
            <Logo variant="full" to="/" className="w-full" />
          </section>
          <section className="text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-primary">
              Welcome to Nayay Setu Dashboard!
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              How can we assist you today?
            </p>
          </section>

          {/* Module cards */}
          <section className="dashboard-module-grid grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <Link to="/legal-help" className="module-card">
              <div className="module-card-inner">
                <div className="space-y-3">
                  <span className="badge-soft">Legal Help</span>
                  <h2 className="text-lg font-semibold">Get Legal Assistance</h2>
                  <p className="text-xs text-sky-100/90">
                    Chat with the AI assistant, understand your rights, and
                    generate structured complaints and FIR drafts.
                  </p>
                </div>
                <button className="btn-primary mt-2 bg-white/90 text-primary hover:bg-white">
                  Get Legal Assistance
                </button>
              </div>
            </Link>

            <Link to="/report-harassment" className="module-card">
              <div className="module-card-inner">
                <div className="space-y-3">
                  <span className="badge-soft">Crimes Against Women</span>
                  <h2 className="text-lg font-semibold">Report Abuse</h2>
                  <p className="text-xs text-sky-100/90">
                    Securely report harassment, domestic violence, or abuse with
                    options for anonymity and evidence upload.
                  </p>
                </div>
                <button className="btn-primary mt-2 bg-white/90 text-primary hover:bg-white">
                  Report Abuse
                </button>
              </div>
            </Link>

            <Link to="/missing-person" className="module-card">
              <div className="module-card-inner">
                <div className="space-y-3">
                  <span className="badge-soft">Missing Persons</span>
                  <h2 className="text-lg font-semibold">Find Lost People</h2>
                  <p className="text-xs text-sky-100/90">
                    Create AI-enhanced missing person alerts with posters,
                    public links, and admin review workflow.
                  </p>
                </div>
                <button className="btn-primary mt-2 bg-white/90 text-primary hover:bg-white">
                  Find Lost People
                </button>
              </div>
            </Link>

            <Link to="/emergency-helpline" className="module-card">
              <div className="module-card-inner">
                <div className="space-y-3">
                  <span className="badge-soft">Emergency Call</span>
                  <h2 className="text-lg font-semibold">Emergency Call</h2>
                  <p className="text-xs text-sky-100/90">
                    Access verified national helpline numbers for police,
                    ambulance, women, children, and cyber emergencies.
                  </p>
                </div>
                <button className="btn-primary mt-2 bg-white/90 text-primary hover:bg-white">
                  Emergency Call
                </button>
              </div>
            </Link>

            <Link to="/police-stations" className="module-card">
              <div className="module-card-inner">
                <div className="space-y-3">
                  <span className="badge-soft">Safety Access</span>
                  <h2 className="text-lg font-semibold">Police Station Finder</h2>
                  <p className="text-xs text-sky-100/90">
                    Find nearby police stations with address, contact details,
                    and map directions for quick access during emergencies.
                  </p>
                </div>
                <button className="btn-primary mt-2 bg-white/90 text-primary hover:bg-white">
                  Find Police Stations
                </button>
              </div>
            </Link>

            <Link to="/safety-timer" className="module-card">
              <div className="module-card-inner">
                <div className="space-y-3">
                  <span className="badge-soft">Personal Safety</span>
                  <h2 className="text-lg font-semibold">Safety Timer</h2>
                  <p className="text-xs text-sky-100/90">
                    Set a countdown for your journey or walk. If you don&apos;t
                    confirm you&apos;re safe in time, SMS and WhatsApp open with a
                    pre-filled alert and your last known location.
                  </p>
                </div>
                <button className="btn-primary mt-2 bg-white/90 text-primary hover:bg-white">
                  Start Safety Timer
                </button>
              </div>
            </Link>
          </section>

          {/* Bottom section */}
          <section className="grid gap-4 md:grid-cols-2">
            <div className="card bg-white/80 backdrop-blur">
              <h3 className="text-base font-semibold text-primary">
                Quick Tips
              </h3>
              <ul className="mt-2 space-y-1 text-xs text-slate-600 list-disc list-inside">
                <li>Always keep copies of important documents and FIR receipts.</li>
                <li>Use the AI assistant to draft clear, structured complaints.</li>
                <li>
                In immediate danger, call emergency numbers before filing online.
                </li>
              </ul>
            </div>
            <div className="card bg-slate-900 text-slate-50">
              <h3 className="text-base font-semibold">Key Helpline Numbers</h3>
              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                <div className="rounded-lg bg-white/5 p-2">
                  <p className="text-[11px] uppercase text-slate-300">
                    All-India Emergency
                  </p>
                  <p className="mt-1 text-lg font-semibold">112</p>
                </div>
                <div className="rounded-lg bg-white/5 p-2">
                  <p className="text-[11px] uppercase text-slate-300">
                    Women Helpline
                  </p>
                  <p className="mt-1 text-lg font-semibold">1091 / 181</p>
                </div>
                <div className="rounded-lg bg-white/5 p-2">
                  <p className="text-[11px] uppercase text-slate-300">
                    Child Helpline
                  </p>
                  <p className="mt-1 text-lg font-semibold">1098</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right sidebar */}
        <aside className="mt-4 w-full lg:mt-6 lg:w-80">
          <div className="card bg-white/85 backdrop-blur">
            <h3 className="text-sm font-semibold text-primary">
              Quick Access
            </h3>
            <div className="mt-3 space-y-2 text-xs">
              <Link
                to="/legal-help"
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 hover:bg-slate-100"
              >
                <span>File a Complaint</span>
                <span className="text-[11px] font-semibold text-primary">
                  Open
                </span>
              </Link>
              <Link
                to="/emergency-helpline"
                className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-red-800 hover:bg-red-100"
              >
                <span>Emergency Call</span>
                <span className="text-[11px] font-semibold text-red-700">
                  View Numbers
                </span>
              </Link>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <h4 className="text-xs font-semibold text-slate-700">
                Latest Updates
              </h4>
              <ul className="mt-2 space-y-1 text-[11px] text-slate-600">
                <li>• AI legal assistant updated for better IPC references.</li>
                <li>• New missing person poster format now available.</li>
                <li>• Women Safety &amp; Crime Reporting form now FIR-style.</li>
              </ul>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <h4 className="text-xs font-semibold text-slate-700">
                Recent Reports
              </h4>
              <p className="mt-2 text-[11px] text-slate-500">
                View your submitted complaints and missing person reports from
                the relevant modules. Admins can access all reports from the
                Admin Dashboard.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </Layout>
  );
};

export default Home;

