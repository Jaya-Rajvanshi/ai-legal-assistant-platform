import React from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { getSubcategoryByKeys } from "../config/legalHelpCategories.js";

const SubCategoryPage = () => {
  const { categoryKey, subKey } = useParams();
  const result = getSubcategoryByKeys(categoryKey, subKey);

  if (!result) {
    return <Navigate to="/legal-help" replace />;
  }

  const { category, subcategory } = result;

  const description = `You have selected the "${subcategory.label}" subcategory under ${category.name}. You can gather facts here and then use the AI Legal Assistance module to draft a detailed, structured complaint or FIR.`;

  return (
    <Layout>
      <div className="w-full space-y-4">
        {/* Breadcrumbs */}
        <nav className="text-[11px] text-slate-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link to="/" className="hover:text-primary">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link to="/legal-help" className="hover:text-primary">
                Legal Help
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link
                to={`/legal-help/${category.key}`}
                className="hover:text-primary"
              >
                {category.name}
              </Link>
            </li>
            <li>/</li>
            <li className="font-medium text-slate-700">
              {subcategory.label}
            </li>
          </ol>
        </nav>

        <header className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold text-primary">
              {subcategory.label}
            </h1>
            <p className="mt-1 max-w-2xl text-xs text-slate-600">
              {description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/legal-help/${category.key}`}
              className="btn-secondary rounded-full px-4 py-1.5 text-xs"
            >
              ← Back to {category.name}
            </Link>
            <Link
              to="/legal-help"
              className="btn-secondary rounded-full px-4 py-1.5 text-xs"
            >
              AI Legal Help
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="card bg-white/90 backdrop-blur">
            <h2 className="text-sm font-semibold text-primary">
              Information to collect
            </h2>
            <ul className="mt-2 space-y-1 text-xs text-slate-700 list-disc list-inside">
              <li>Date, time, and exact place of occurrence.</li>
              <li>
                Names and contact details of persons involved or witnesses, if
                known.
              </li>
              <li>
                Any documents, messages, or digital evidence relevant to{" "}
                {subcategory.label.toLowerCase()}.
              </li>
              <li>
                Clear sequence of events in your own words (you can paste this
                into the AI assistant later).
              </li>
            </ul>
          </div>
          <div className="card bg-gradient-to-br from-primary/95 via-primary/80 to-sky-700 text-white">
            <h3 className="text-sm font-semibold">Next steps</h3>
            <p className="mt-2 text-xs text-sky-100">
              Once you have noted down the basic details, open the AI Legal
              Assistance module. It will help you organise your facts, suggest
              structure, and generate a printable complaint or FIR-style draft.
            </p>
            <Link
              to="/legal-help"
              className="btn-primary mt-4 bg-white/90 text-primary hover:bg-white"
            >
              Open AI Legal Assistance
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default SubCategoryPage;

