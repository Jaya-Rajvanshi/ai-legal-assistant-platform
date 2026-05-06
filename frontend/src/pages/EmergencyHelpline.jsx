import React from "react";
import Layout from "../components/Layout.jsx";

const EmergencyHelpline = () => {
  const helplines = [
    {
      name: "National Emergency Number",
      number: "112",
      description: "Single emergency number for all emergency services",
    },
    {
      name: "Police",
      number: "100",
      description: "Police emergency helpline",
    },
    {
      name: "Women Helpline",
      number: "181",
      description: "24/7 helpline for women in distress",
    },
    {
      name: "Ambulance",
      number: "108",
      description: "Medical emergency and ambulance services",
    },
    {
      name: "Fire Brigade",
      number: "101",
      description: "Fire emergency services",
    },
    {
      name: "Cyber Crime",
      number: "1930",
      description: "National cybercrime reporting helpline",
    },
    {
      name: "Child Helpline",
      number: "1098",
      description: "24/7 helpline for children in need",
    },
    {
      name: "Senior Citizen Helpline",
      number: "14567",
      description: "Helpline for senior citizens",
    },
  ];

  return (
    <Layout>
      <div className="flex w-full flex-col gap-6">
        <section className="mt-4">
          <h1 className="text-2xl font-semibold text-primary">
            India Emergency Helpline Numbers
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Quick access to all national emergency helpline numbers. Click the
            Call button to dial directly from your device.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {helplines.map((helpline) => (
            <div
              key={helpline.number}
              className="card border-l-4 border-l-alert hover:shadow-md transition-shadow"
            >
              <h3 className="text-base font-semibold text-slate-900">
                {helpline.name}
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                {helpline.description}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">
                  {helpline.number}
                </span>
                <a
                  href={`tel:${helpline.number}`}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  Call
                </a>
              </div>
            </div>
          ))}
        </section>

        <section className="card bg-slate-50 border-l-4 border-l-primary">
          <h3 className="text-base font-semibold text-primary">
            Important Information
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-600 list-disc list-inside">
            <li>
              All helplines are available 24/7 across India
            </li>
            <li>
              Calls to emergency numbers are free of charge
            </li>
            <li>
              In case of immediate danger, call 112 or 100 first
            </li>
            <li>
              For non-emergency queries, contact your local police station
            </li>
          </ul>
        </section>
      </div>
    </Layout>
  );
};

export default EmergencyHelpline;
