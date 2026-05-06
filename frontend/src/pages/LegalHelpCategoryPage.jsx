import React from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { getCategoryByKey } from "../config/legalHelpCategories.js";
import PropertyFinancial from "./PropertyFinancial.jsx";
import CyberDigital from "./CyberDigital.jsx";
import RoadPublicSafety from "./RoadPublicSafety.jsx";

const LegalHelpCategoryPage = () => {
  const { categoryKey } = useParams();
  const category = getCategoryByKey(categoryKey);

  if (!category) {
    return <Navigate to="/legal-help" replace />;
  }

  const isPropertyFinancial = category.key === "property-financial";
  const isCyberDigital = category.key === "cyber-digital";
  const isRoadPublicSafety = category.key === "road-public-safety";

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
            <li className="font-medium text-slate-700">{category.name}</li>
          </ol>
        </nav>

        <header className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold text-primary">
              {category.name}
            </h1>
            <p className="mt-1 max-w-2xl text-xs text-slate-600">
              {category.description}
            </p>
          </div>
          <Link
            to="/legal-help"
            className="btn-secondary rounded-full px-4 py-1.5 text-xs"
          >
            ← Back to Legal Help
          </Link>
        </header>

        {isPropertyFinancial && (
          <section className="mt-4 space-y-3">
            <PropertyFinancial />
          </section>
        )}

        {isCyberDigital && (
          <section className="mt-4 space-y-3">
            <CyberDigital />
          </section>
        )}

        {isRoadPublicSafety && (
          <section className="mt-4 space-y-3">
            <RoadPublicSafety />
          </section>
        )}
      </div>
    </Layout>
  );
};

export default LegalHelpCategoryPage;

