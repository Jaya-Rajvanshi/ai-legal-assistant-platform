export const LEGAL_HELP_CATEGORIES = {
  "property-financial": {
    key: "property-financial",
    name: "Property & Financial Crime",
    description:
      "Matters related to theft, property disputes, loan fraud, land encroachment, and financial scams.",
    subcategories: [
      { key: "theft", label: "Theft" },
      { key: "property-dispute", label: "Property Dispute" },
      { key: "loan-fraud", label: "Loan Fraud" },
      { key: "land-encroachment", label: "Land Encroachment" },
      { key: "investment-scam", label: "Investment Scam" },
    ],
  },
  "cyber-digital": {
    key: "cyber-digital",
    name: "Cyber & Digital Crime",
    description:
      "Incidents involving online fraud, hacking, cyber bullying, identity theft, and harmful digital content.",
    subcategories: [
      { key: "online-fraud", label: "Online Fraud" },
      { key: "hacking", label: "Hacking" },
      { key: "cyber-bullying", label: "Cyber Bullying" },
      { key: "identity-theft", label: "Identity Theft" },
      { key: "inappropriate-content", label: "Inappropriate Content" },
    ],
  },
  "road-public-safety": {
    key: "road-public-safety",
    name: "Road & Public Safety",
    description:
      "Issues on roads and public spaces including accidents, hit and run, public nuisance, and related disputes.",
    subcategories: [
      { key: "hit-and-run", label: "Hit and Run" },
      { key: "public-nuisance", label: "Public Nuisance" },
      { key: "drunk-driving", label: "Drunk Driving" },
      { key: "accident", label: "Accident" },
      { key: "civil-disputes", label: "Civil Disputes" },
    ],
  },
};

export const getCategoryByKey = (key) => LEGAL_HELP_CATEGORIES[key];

export const getSubcategoryByKeys = (categoryKey, subKey) => {
  const category = LEGAL_HELP_CATEGORIES[categoryKey];
  if (!category) return null;
  const sub = category.subcategories.find((s) => s.key === subKey);
  if (!sub) return null;
  return { category, subcategory: sub };
};

