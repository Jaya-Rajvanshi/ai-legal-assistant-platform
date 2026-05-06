import React, { useMemo, useState } from "react";
import api from "../api/client.js";

const initialComplainant = {
  fullName: "",
  gender: "",
  mobile: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pin: "",
  idType: "",
  idNumber: "",
};

const initialIncident = {
  date: "",
  time: "",
  location: "",
  description: "",
  lossAmount: "",
  reportedToPolice: "no",
  firNumber: "",
  policeStation: "",
};

const initialDynamic = {
  theft: {
    propertyType: "",
    approxValue: "",
    cctv: "no",
    suspect: "",
  },
  "property-dispute": {
    disputeNature: "",
    propertyAddress: "",
    hasDocuments: "no",
    opposingParty: "",
  },
  "loan-fraud": {
    loanType: "",
    institutionName: "",
    amountInvolved: "",
    modeOfFraud: "",
  },
  "land-encroachment": {
    ownershipStatus: "",
    surveyNumber: "",
    encroacherDetails: "",
    ongoingLitigation: "no",
  },
  "investment-scam": {
    investmentType: "",
    companyName: "",
    amountInvested: "",
    communicationMode: "",
  },
};

const PropertyFinancial = () => {
  const [crimeType, setCrimeType] = useState("");
  const [complainant, setComplainant] = useState(initialComplainant);
  const [incident, setIncident] = useState(initialIncident);
  const [dynamicFields, setDynamicFields] = useState(initialDynamic);
  const [files, setFiles] = useState([]);
  const [declared, setDeclared] = useState(false);
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleCrimeTypeChange = (e) => {
    setCrimeType(e.target.value);
    setErrors((prev) => ({ ...prev, crimeType: undefined }));
  };

  const handleComplainantChange = (e) => {
    const { name, value } = e.target;
    setComplainant((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleIncidentChange = (e) => {
    const { name, value } = e.target;
    setIncident((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleDynamicChange = (fieldKey, e) => {
    const { name, value } = e.target;
    setDynamicFields((prev) => ({
      ...prev,
      [fieldKey]: { ...prev[fieldKey], [name]: value },
    }));
    setErrors((prev) => ({ ...prev, [`${fieldKey}.${name}`]: undefined }));
  };

  const currentDynamicKey = useMemo(() => {
    if (!crimeType) return null;
    switch (crimeType) {
      case "Theft":
        return "theft";
      case "Property Dispute":
        return "property-dispute";
      case "Loan Fraud":
        return "loan-fraud";
      case "Land Encroachment":
        return "land-encroachment";
      case "Investment Scam":
        return "investment-scam";
      default:
        return null;
    }
  }, [crimeType]);

  const handleFilesChange = (e) => {
    setFiles(Array.from(e.target.files || []));
  };

  const validate = () => {
    const newErrors = {};

    if (!crimeType) newErrors.crimeType = "Please select a crime type.";

    if (!complainant.fullName.trim())
      newErrors.fullName = "Full Name is required.";
    if (!complainant.gender)
      newErrors.gender = "Gender is required.";
    if (!complainant.mobile.trim())
      newErrors.mobile = "Mobile Number is required.";
    else if (!/^[0-9]{10}$/.test(complainant.mobile.trim()))
      newErrors.mobile = "Enter a valid 10-digit mobile number.";
    if (!complainant.email.trim())
      newErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(complainant.email.trim()))
      newErrors.email = "Enter a valid email address.";
    if (!complainant.address.trim())
      newErrors.address = "Residential address is required.";
    if (!complainant.city.trim()) newErrors.city = "City is required.";
    if (!complainant.state.trim()) newErrors.state = "State is required.";
    if (!complainant.pin.trim())
      newErrors.pin = "PIN Code is required.";
    if (!complainant.idType)
      newErrors.idType = "ID proof type is required.";
    if (!complainant.idNumber.trim())
      newErrors.idNumber = "ID proof number is required.";

    if (!incident.date)
      newErrors.date = "Date of incident is required.";
    if (!incident.time)
      newErrors.time = "Time of incident is required.";
    if (!incident.location.trim())
      newErrors.location = "Location of incident is required.";
    if (!incident.description.trim())
      newErrors.description = "Description is required.";
    else if (incident.description.trim().length < 150)
      newErrors.description =
        "Description must be at least 150 characters for clarity.";

    if (incident.reportedToPolice === "yes") {
      if (!incident.firNumber.trim())
        newErrors.firNumber = "FIR Number is required if reported.";
      if (!incident.policeStation.trim())
        newErrors.policeStation = "Police Station name is required.";
    }

    if (!declared) {
      newErrors.declared =
        "You must declare that the information provided is true.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildComplaintText = () => {
    const lines = [];
    lines.push(
      `Crime Category: Property & Financial Crime (${crimeType || "N/A"})`
    );
    lines.push("");
    lines.push("Complainant Information:");
    lines.push(`Name: ${complainant.fullName}`);
    lines.push(`Gender: ${complainant.gender}`);
    lines.push(
      `Mobile: ${complainant.mobile} | Email: ${complainant.email}`
    );
    lines.push(
      `Address: ${complainant.address}, ${complainant.city}, ${complainant.state} - ${complainant.pin}`
    );
    lines.push(
      `ID Proof: ${complainant.idType} (${complainant.idNumber})`
    );
    lines.push("");
    lines.push("Incident Information:");
    lines.push(
      `Date & Time: ${incident.date} at ${incident.time || "N/A"}`
    );
    lines.push(`Location: ${incident.location}`);
    lines.push(`Estimated Financial Loss: ${incident.lossAmount || "N/A"}`);
    lines.push(
      `Reported to Police: ${
        incident.reportedToPolice === "yes" ? "Yes" : "No"
      }`
    );
    if (incident.reportedToPolice === "yes") {
      lines.push(`FIR Number: ${incident.firNumber}`);
      lines.push(`Police Station: ${incident.policeStation}`);
    }
    lines.push("");
    lines.push("Detailed Description of Incident:");
    lines.push(incident.description);
    lines.push("");

    if (currentDynamicKey) {
      const dyn = dynamicFields[currentDynamicKey];
      lines.push("Category-Specific Details:");
      switch (currentDynamicKey) {
        case "theft":
          lines.push(`Type of Property Stolen: ${dyn.propertyType || "N/A"}`);
          lines.push(`Approximate Value: ${dyn.approxValue || "N/A"}`);
          lines.push(`CCTV Footage: ${dyn.cctv === "yes" ? "Yes" : "No"}`);
          lines.push(`Suspect Identified: ${dyn.suspect || "N/A"}`);
          break;
        case "property-dispute":
          lines.push(`Nature of Dispute: ${dyn.disputeNature || "N/A"}`);
          lines.push(`Property Address: ${dyn.propertyAddress || "N/A"}`);
          lines.push(
            `Legal Documents Available: ${
              dyn.hasDocuments === "yes" ? "Yes" : "No"
            }`
          );
          lines.push(
            `Opposing Party Details: ${dyn.opposingParty || "N/A"}`
          );
          break;
        case "loan-fraud":
          lines.push(`Loan Type: ${dyn.loanType || "N/A"}`);
          lines.push(
            `Lending Institution Name: ${dyn.institutionName || "N/A"}`
          );
          lines.push(`Amount Involved: ${dyn.amountInvolved || "N/A"}`);
          lines.push(`Mode of Fraud: ${dyn.modeOfFraud || "N/A"}`);
          break;
        case "land-encroachment":
          lines.push(`Land Ownership Status: ${dyn.ownershipStatus || "N/A"}`);
          lines.push(`Survey Number: ${dyn.surveyNumber || "N/A"}`);
          lines.push(`Encroacher Details: ${dyn.encroacherDetails || "N/A"}`);
          lines.push(
            `Ongoing Litigation: ${
              dyn.ongoingLitigation === "yes" ? "Yes" : "No"
            }`
          );
          break;
        case "investment-scam":
          lines.push(`Investment Type: ${dyn.investmentType || "N/A"}`);
          lines.push(`Company/Individual: ${dyn.companyName || "N/A"}`);
          lines.push(`Amount Invested: ${dyn.amountInvested || "N/A"}`);
          lines.push(
            `Mode of Communication: ${dyn.communicationMode || "N/A"}`
          );
          break;
        default:
          break;
      }
    }

    return lines.join("\n");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      setStatusMessage("");
      return;
    }
    const text = buildComplaintText();
    setStatusMessage(
      "Complaint structured successfully. You can now use AI summary or download as PDF."
    );
    setAiSummary(text);
  };

  const handleSaveDraft = () => {
    const draft = {
      crimeType,
      complainant,
      incident,
      dynamicFields,
      declared,
    };
    localStorage.setItem(
      "propertyFinancialDraft",
      JSON.stringify(draft)
    );
    setStatusMessage("Draft saved locally in this browser.");
  };

  const handleGenerateAiSummary = async () => {
    if (!validate()) return;
    const text = buildComplaintText();
    setAiLoading(true);
    setStatusMessage("");
    try {
      const { data } = await api.post("/legal/chat", {
        message: text,
      });
      setAiSummary(data.reply || "");
      setStatusMessage("AI legal summary generated successfully.");
    } catch (err) {
      console.error(err);
      setStatusMessage(
        err.response?.data?.message ||
          "Failed to generate AI summary. Ensure you are logged in."
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!aiSummary && !validate()) return;
    const body = aiSummary || buildComplaintText();
    setPdfLoading(true);
    setStatusMessage("");
    try {
      const { data } = await api.post(
        "/legal/complaint-pdf",
        {
          body,
          complainantName: complainant.fullName,
          complainantAddress: `${complainant.address}, ${complainant.city}, ${complainant.state} - ${complainant.pin}`,
          contactNumber: complainant.mobile,
        },
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        "property-financial-complaint.pdf"
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      setStatusMessage(
        err.response?.data?.message ||
          "Failed to generate PDF. Please try again."
      );
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      noValidate
    >
      {/* Section 1: Category */}
      <div className="card bg-white/90 backdrop-blur">
        <h2 className="text-sm font-semibold text-primary">
          Property &amp; Financial Crime – Complaint Intake Form
        </h2>
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-700">
            Select Type of Property or Financial Crime
            <span className="text-alert"> *</span>
          </label>
          <select
            value={crimeType}
            onChange={handleCrimeTypeChange}
            className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select...</option>
            <option value="Theft">Theft</option>
            <option value="Property Dispute">Property Dispute</option>
            <option value="Loan Fraud">Loan Fraud</option>
            <option value="Land Encroachment">Land Encroachment</option>
            <option value="Investment Scam">Investment Scam</option>
          </select>
          {errors.crimeType && (
            <p className="mt-1 text-[11px] text-alert">
              {errors.crimeType}
            </p>
          )}
        </div>
      </div>

      {/* Section 2: Complainant Information */}
      <div className="card bg-white/95 backdrop-blur">
        <h3 className="text-sm font-semibold text-primary">
          Complainant Information
        </h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Full Name<span className="text-alert"> *</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={complainant.fullName}
              onChange={handleComplainantChange}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.fullName && (
              <p className="mt-1 text-[11px] text-alert">
                {errors.fullName}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Gender<span className="text-alert"> *</span>
            </label>
            <select
              name="gender"
              value={complainant.gender}
              onChange={handleComplainantChange}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.gender && (
              <p className="mt-1 text-[11px] text-alert">
                {errors.gender}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Mobile Number<span className="text-alert"> *</span>
            </label>
            <input
              type="tel"
              name="mobile"
              value={complainant.mobile}
              onChange={handleComplainantChange}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.mobile && (
              <p className="mt-1 text-[11px] text-alert">
                {errors.mobile}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Email Address<span className="text-alert"> *</span>
            </label>
            <input
              type="email"
              name="email"
              value={complainant.email}
              onChange={handleComplainantChange}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.email && (
              <p className="mt-1 text-[11px] text-alert">
                {errors.email}
              </p>
            )}
          </div>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700">
              Residential Address<span className="text-alert"> *</span>
            </label>
            <textarea
              name="address"
              value={complainant.address}
              onChange={handleComplainantChange}
              rows={2}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.address && (
              <p className="mt-1 text-[11px] text-alert">
                {errors.address}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              City<span className="text-alert"> *</span>
            </label>
            <input
              type="text"
              name="city"
              value={complainant.city}
              onChange={handleComplainantChange}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.city && (
              <p className="mt-1 text-[11px] text-alert">
                {errors.city}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              State<span className="text-alert"> *</span>
            </label>
            <input
              type="text"
              name="state"
              value={complainant.state}
              onChange={handleComplainantChange}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.state && (
              <p className="mt-1 text-[11px] text-alert">
                {errors.state}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              PIN Code<span className="text-alert"> *</span>
            </label>
            <input
              type="text"
              name="pin"
              value={complainant.pin}
              onChange={handleComplainantChange}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.pin && (
              <p className="mt-1 text-[11px] text-alert">
                {errors.pin}
              </p>
            )}
          </div>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-700">
              ID Proof Type<span className="text-alert"> *</span>
            </label>
            <select
              name="idType"
              value={complainant.idType}
              onChange={handleComplainantChange}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select...</option>
              <option value="Aadhaar">Aadhaar</option>
              <option value="PAN">PAN</option>
              <option value="Voter ID">Voter ID</option>
              <option value="Passport">Passport</option>
              <option value="Other">Other</option>
            </select>
            {errors.idType && (
              <p className="mt-1 text-[11px] text-alert">
                {errors.idType}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              ID Proof Number<span className="text-alert"> *</span>
            </label>
            <input
              type="text"
              name="idNumber"
              value={complainant.idNumber}
              onChange={handleComplainantChange}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.idNumber && (
              <p className="mt-1 text-[11px] text-alert">
                {errors.idNumber}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Incident Information */}
      <div className="card bg-white/95 backdrop-blur">
        <h3 className="text-sm font-semibold text-primary">
          Incident Information
        </h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Date of Incident<span className="text-alert"> *</span>
            </label>
            <input
              type="date"
              name="date"
              value={incident.date}
              onChange={handleIncidentChange}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.date && (
              <p className="mt-1 text-[11px] text-alert">
                {errors.date}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Time of Incident<span className="text-alert"> *</span>
            </label>
            <input
              type="time"
              name="time"
              value={incident.time}
              onChange={handleIncidentChange}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.time && (
              <p className="mt-1 text-[11px] text-alert">
                {errors.time}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Estimated Financial Loss
            </label>
            <input
              type="number"
              name="lossAmount"
              value={incident.lossAmount}
              onChange={handleIncidentChange}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-700">
            Location of Incident<span className="text-alert"> *</span>
          </label>
          <input
            type="text"
            name="location"
            value={incident.location}
            onChange={handleIncidentChange}
            className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.location && (
            <p className="mt-1 text-[11px] text-alert">
              {errors.location}
            </p>
          )}
        </div>
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-700">
            Description of Incident<span className="text-alert"> *</span>
          </label>
          <textarea
            name="description"
            value={incident.description}
            onChange={handleIncidentChange}
            rows={4}
            className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Provide a detailed, chronological description of what happened..."
          />
          {errors.description && (
            <p className="mt-1 text-[11px] text-alert">
              {errors.description}
            </p>
          )}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div>
            <span className="block text-xs font-medium text-slate-700">
              Was the incident reported to police?
            </span>
            <div className="mt-1 flex items-center gap-3 text-xs">
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="reportedToPolice"
                  value="yes"
                  checked={incident.reportedToPolice === "yes"}
                  onChange={handleIncidentChange}
                  className="h-3 w-3"
                />
                Yes
              </label>
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="reportedToPolice"
                  value="no"
                  checked={incident.reportedToPolice === "no"}
                  onChange={handleIncidentChange}
                  className="h-3 w-3"
                />
                No
              </label>
            </div>
          </div>
          {incident.reportedToPolice === "yes" && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  FIR Number
                </label>
                <input
                  type="text"
                  name="firNumber"
                  value={incident.firNumber}
                  onChange={handleIncidentChange}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.firNumber && (
                  <p className="mt-1 text-[11px] text-alert">
                    {errors.firNumber}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Police Station Name
                </label>
                <input
                  type="text"
                  name="policeStation"
                  value={incident.policeStation}
                  onChange={handleIncidentChange}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.policeStation && (
                  <p className="mt-1 text-[11px] text-alert">
                    {errors.policeStation}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Section 4: Dynamic fields */}
      {currentDynamicKey && (
        <div className="card bg-white/95 backdrop-blur transition-all">
          <h3 className="text-sm font-semibold text-primary">
            Additional Details – {crimeType}
          </h3>
          <div className="mt-3 space-y-3 text-xs text-slate-700">
            {currentDynamicKey === "theft" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Type of Property Stolen
                  </label>
                  <input
                    type="text"
                    name="propertyType"
                    value={dynamicFields.theft.propertyType}
                    onChange={(e) => handleDynamicChange("theft", e)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Approximate Value
                  </label>
                  <input
                    type="number"
                    name="approxValue"
                    value={dynamicFields.theft.approxValue}
                    onChange={(e) => handleDynamicChange("theft", e)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-700">
                    Was there CCTV footage?
                  </span>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="cctv"
                        value="yes"
                        checked={dynamicFields.theft.cctv === "yes"}
                        onChange={(e) => handleDynamicChange("theft", e)}
                        className="h-3 w-3"
                      />
                      Yes
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="cctv"
                        value="no"
                        checked={dynamicFields.theft.cctv === "no"}
                        onChange={(e) => handleDynamicChange("theft", e)}
                        className="h-3 w-3"
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Any suspect identified?
                  </label>
                  <input
                    type="text"
                    name="suspect"
                    value={dynamicFields.theft.suspect}
                    onChange={(e) => handleDynamicChange("theft", e)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </>
            )}

            {currentDynamicKey === "property-dispute" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Nature of Dispute
                  </label>
                  <select
                    name="disputeNature"
                    value={dynamicFields["property-dispute"].disputeNature}
                    onChange={(e) =>
                      handleDynamicChange("property-dispute", e)
                    }
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select...</option>
                    <option value="Ownership">Ownership</option>
                    <option value="Boundary">Boundary</option>
                    <option value="Inheritance">Inheritance</option>
                    <option value="Tenant Issue">Tenant Issue</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Property Address
                  </label>
                  <input
                    type="text"
                    name="propertyAddress"
                    value={dynamicFields["property-dispute"].propertyAddress}
                    onChange={(e) =>
                      handleDynamicChange("property-dispute", e)
                    }
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-700">
                    Do you possess legal documents?
                  </span>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="hasDocuments"
                        value="yes"
                        checked={
                          dynamicFields["property-dispute"].hasDocuments ===
                          "yes"
                        }
                        onChange={(e) =>
                          handleDynamicChange("property-dispute", e)
                        }
                        className="h-3 w-3"
                      />
                      Yes
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="hasDocuments"
                        value="no"
                        checked={
                          dynamicFields["property-dispute"].hasDocuments ===
                          "no"
                        }
                        onChange={(e) =>
                          handleDynamicChange("property-dispute", e)
                        }
                        className="h-3 w-3"
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Opposing Party Details
                  </label>
                  <textarea
                    name="opposingParty"
                    value={dynamicFields["property-dispute"].opposingParty}
                    onChange={(e) =>
                      handleDynamicChange("property-dispute", e)
                    }
                    rows={2}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </>
            )}

            {currentDynamicKey === "loan-fraud" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Loan Type
                  </label>
                  <select
                    name="loanType"
                    value={dynamicFields["loan-fraud"].loanType}
                    onChange={(e) => handleDynamicChange("loan-fraud", e)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select...</option>
                    <option value="Personal">Personal</option>
                    <option value="Business">Business</option>
                    <option value="Online App">Online App</option>
                    <option value="Bank Loan">Bank Loan</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Lending Institution Name
                  </label>
                  <input
                    type="text"
                    name="institutionName"
                    value={dynamicFields["loan-fraud"].institutionName}
                    onChange={(e) => handleDynamicChange("loan-fraud", e)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Amount Involved
                  </label>
                  <input
                    type="number"
                    name="amountInvolved"
                    value={dynamicFields["loan-fraud"].amountInvolved}
                    onChange={(e) => handleDynamicChange("loan-fraud", e)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Mode of Fraud
                  </label>
                  <select
                    name="modeOfFraud"
                    value={dynamicFields["loan-fraud"].modeOfFraud}
                    onChange={(e) => handleDynamicChange("loan-fraud", e)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select...</option>
                    <option value="Fake Call">Fake Call</option>
                    <option value="Phishing">Phishing</option>
                    <option value="Forged Documents">Forged Documents</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </>
            )}

            {currentDynamicKey === "land-encroachment" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Land Ownership Status
                  </label>
                  <input
                    type="text"
                    name="ownershipStatus"
                    value={dynamicFields["land-encroachment"].ownershipStatus}
                    onChange={(e) =>
                      handleDynamicChange("land-encroachment", e)
                    }
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Survey Number
                  </label>
                  <input
                    type="text"
                    name="surveyNumber"
                    value={dynamicFields["land-encroachment"].surveyNumber}
                    onChange={(e) =>
                      handleDynamicChange("land-encroachment", e)
                    }
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Encroacher Details
                  </label>
                  <textarea
                    name="encroacherDetails"
                    value={
                      dynamicFields["land-encroachment"].encroacherDetails
                    }
                    onChange={(e) =>
                      handleDynamicChange("land-encroachment", e)
                    }
                    rows={2}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-700">
                    Is there ongoing litigation?
                  </span>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="ongoingLitigation"
                        value="yes"
                        checked={
                          dynamicFields["land-encroachment"]
                            .ongoingLitigation === "yes"
                        }
                        onChange={(e) =>
                          handleDynamicChange("land-encroachment", e)
                        }
                        className="h-3 w-3"
                      />
                      Yes
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="ongoingLitigation"
                        value="no"
                        checked={
                          dynamicFields["land-encroachment"]
                            .ongoingLitigation === "no"
                        }
                        onChange={(e) =>
                          handleDynamicChange("land-encroachment", e)
                        }
                        className="h-3 w-3"
                      />
                      No
                    </label>
                  </div>
                </div>
              </>
            )}

            {currentDynamicKey === "investment-scam" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Type of Investment
                  </label>
                  <select
                    name="investmentType"
                    value={
                      dynamicFields["investment-scam"].investmentType
                    }
                    onChange={(e) =>
                      handleDynamicChange("investment-scam", e)
                    }
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select...</option>
                    <option value="Crypto">Crypto</option>
                    <option value="MLM">MLM</option>
                    <option value="Stock">Stock</option>
                    <option value="Ponzi">Ponzi</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Company/Individual Name
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={dynamicFields["investment-scam"].companyName}
                    onChange={(e) =>
                      handleDynamicChange("investment-scam", e)
                    }
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Amount Invested
                  </label>
                  <input
                    type="number"
                    name="amountInvested"
                    value={dynamicFields["investment-scam"].amountInvested}
                    onChange={(e) =>
                      handleDynamicChange("investment-scam", e)
                    }
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Mode of Communication
                  </label>
                  <input
                    type="text"
                    name="communicationMode"
                    value={
                      dynamicFields["investment-scam"].communicationMode
                    }
                    onChange={(e) =>
                      handleDynamicChange("investment-scam", e)
                    }
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Section 5: Evidence Upload */}
      <div className="card bg-white/95 backdrop-blur">
        <h3 className="text-sm font-semibold text-primary">
          Upload Supporting Documents
        </h3>
        <p className="mt-1 text-[11px] text-slate-600">
          You may attach images, PDFs, screenshots, or audio/video files that
          support your complaint. These are not uploaded yet but help you
          organise your evidence list.
        </p>
        <div className="mt-3">
          <input
            type="file"
            multiple
            accept="image/*,application/pdf,audio/*,video/*"
            onChange={handleFilesChange}
            className="text-xs"
          />
          {files.length > 0 && (
            <p className="mt-1 text-[11px] text-slate-600">
              {files.length} file(s) selected.
            </p>
          )}
        </div>
      </div>

      {/* Section 6: Declaration and actions */}
      <div className="card bg-white/95 backdrop-blur">
        <div className="space-y-3 text-xs">
          <label className="inline-flex items-start gap-2">
            <input
              type="checkbox"
              checked={declared}
              onChange={(e) => {
                setDeclared(e.target.checked);
                setErrors((prev) => ({ ...prev, declared: undefined }));
              }}
              className="mt-0.5 h-3 w-3"
            />
            <span>
              I hereby declare that the information provided is true to the
              best of my knowledge.
              <span className="text-alert"> *</span>
            </span>
          </label>
          {errors.declared && (
            <p className="text-[11px] text-alert">{errors.declared}</p>
          )}

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="submit"
              className="btn-primary text-xs"
            >
              Submit Complaint
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="btn-secondary text-xs"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={handleGenerateAiSummary}
              disabled={aiLoading}
              className="btn-secondary text-xs"
            >
              {aiLoading ? "Generating AI Summary..." : "Generate AI Legal Summary"}
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="btn-secondary text-xs"
            >
              {pdfLoading ? "Preparing PDF..." : "Download Complaint as PDF"}
            </button>
          </div>

          {statusMessage && (
            <p className="mt-2 text-[11px] text-slate-700">
              {statusMessage}
            </p>
          )}

          {aiSummary && (
            <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-800">
              <p className="mb-1 font-semibold text-slate-700">
                AI Legal Summary / Draft
              </p>
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap text-[11px]">
                {aiSummary}
              </pre>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default PropertyFinancial;

