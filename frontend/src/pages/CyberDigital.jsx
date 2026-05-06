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
  preferredContact: "",
};

const initialIncident = {
  date: "",
  time: "",
  platform: "",
  url: "",
  suspectProfileLink: "",
  description: "",
  financialLoss: "",
  transactionId: "",
  reportedToBank: "no",
  reportedToCyberCell: "no",
  firNumber: "",
  policeStation: "",
};

const initialDynamic = {
  "online-fraud": {
    bankName: "",
    accountLast4: "",
    upiId: "",
    amountTransferred: "",
    paymentMode: "",
  },
  "upi-banking-fraud": {
    bankName: "",
    accountLast4: "",
    upiId: "",
    amountTransferred: "",
    paymentMode: "",
  },
  hacking: {
    accountType: "",
    passwordChanged: "no",
    twoFactorEnabled: "no",
  },
  "cyber-bullying": {
    platformName: "",
    accusedProfileName: "",
    harassmentNature: "",
    minorInvolved: "no",
  },
  "identity-theft": {
    identityType: "",
    whereMisused: "",
    financialDamage: "no",
  },
  "online-blackmail": {
    threatNature: "",
    sensitiveContentShared: "no",
    paymentDemanded: "no",
    amountDemanded: "",
  },
};

const CyberDigital = () => {
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
  };

  const currentDynamicKey = useMemo(() => {
    if (!crimeType) return null;
    const keyMap = {
      "Online Fraud": "online-fraud",
      "Hacking / Unauthorized Access": "hacking",
      "Cyber Bullying": "cyber-bullying",
      "Identity Theft": "identity-theft",
      "Online Blackmail / Sextortion": "online-blackmail",
      "UPI / Banking Fraud": "upi-banking-fraud",
    };
    return keyMap[crimeType] || null;
  }, [crimeType]);

  const handleFilesChange = (e) => {
    setFiles(Array.from(e.target.files || []));
  };

  const isRecentIncident = useMemo(() => {
    if (!incident.date) return false;
    const incidentDate = new Date(incident.date);
    const now = new Date();
    const diffHours = (now - incidentDate) / (1000 * 60 * 60);
    return diffHours <= 24 && incident.financialLoss && parseFloat(incident.financialLoss) > 0;
  }, [incident.date, incident.financialLoss]);

  const validate = () => {
    const newErrors = {};

    if (!crimeType) newErrors.crimeType = "Please select a crime type.";

    if (!complainant.fullName.trim())
      newErrors.fullName = "Full Name is required.";
    if (!complainant.gender) newErrors.gender = "Gender is required.";
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
    if (!complainant.pin.trim()) newErrors.pin = "PIN Code is required.";
    if (!complainant.preferredContact)
      newErrors.preferredContact = "Preferred mode of contact is required.";

    if (!incident.date) newErrors.date = "Date of incident is required.";
    if (!incident.time) newErrors.time = "Time of incident is required.";
    if (!incident.platform.trim())
      newErrors.platform = "Platform/Website/App is required.";
    if (!incident.description.trim())
      newErrors.description = "Description is required.";
    else if (incident.description.trim().length < 150)
      newErrors.description =
        "Description must be at least 150 characters for clarity.";

    if (incident.reportedToCyberCell === "yes") {
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
    lines.push(`Crime Category: Cyber & Digital Crime (${crimeType || "N/A"})`);
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
    lines.push(`Preferred Contact: ${complainant.preferredContact}`);
    lines.push("");
    lines.push("Cyber Incident Information:");
    lines.push(`Date & Time: ${incident.date} at ${incident.time || "N/A"}`);
    lines.push(`Platform/Website/App: ${incident.platform}`);
    if (incident.url) lines.push(`URL: ${incident.url}`);
    if (incident.suspectProfileLink)
      lines.push(`Suspect Profile Link: ${incident.suspectProfileLink}`);
    lines.push(`Estimated Financial Loss: ${incident.financialLoss || "N/A"}`);
    if (incident.transactionId)
      lines.push(`Transaction ID: ${incident.transactionId}`);
    lines.push(
      `Reported to Bank/Platform: ${
        incident.reportedToBank === "yes" ? "Yes" : "No"
      }`
    );
    lines.push(
      `Reported to Cyber Cell/Police: ${
        incident.reportedToCyberCell === "yes" ? "Yes" : "No"
      }`
    );
    if (incident.reportedToCyberCell === "yes") {
      lines.push(`FIR Number: ${incident.firNumber}`);
      lines.push(`Police Station: ${incident.policeStation}`);
    }
    lines.push("");
    lines.push("Detailed Description:");
    lines.push(incident.description);
    lines.push("");

    if (currentDynamicKey) {
      const dyn = dynamicFields[currentDynamicKey];
      lines.push("Category-Specific Details:");
      switch (currentDynamicKey) {
        case "online-fraud":
        case "upi-banking-fraud":
          lines.push(`Bank Name: ${dyn.bankName || "N/A"}`);
          lines.push(`Account Last 4 Digits: ${dyn.accountLast4 || "N/A"}`);
          lines.push(`UPI ID: ${dyn.upiId || "N/A"}`);
          lines.push(`Amount Transferred: ${dyn.amountTransferred || "N/A"}`);
          lines.push(`Mode of Payment: ${dyn.paymentMode || "N/A"}`);
          break;
        case "hacking":
          lines.push(`Account Type: ${dyn.accountType || "N/A"}`);
          lines.push(
            `Password Changed: ${dyn.passwordChanged === "yes" ? "Yes" : "No"}`
          );
          lines.push(
            `Two-Factor Authentication: ${
              dyn.twoFactorEnabled === "yes" ? "Enabled" : "Not Enabled"
            }`
          );
          break;
        case "cyber-bullying":
          lines.push(`Platform Name: ${dyn.platformName || "N/A"}`);
          lines.push(`Accused Profile Name: ${dyn.accusedProfileName || "N/A"}`);
          lines.push(`Nature of Harassment: ${dyn.harassmentNature || "N/A"}`);
          lines.push(
            `Minor Involved: ${dyn.minorInvolved === "yes" ? "Yes" : "No"}`
          );
          break;
        case "identity-theft":
          lines.push(`Type of Identity Misused: ${dyn.identityType || "N/A"}`);
          lines.push(`Where Misused: ${dyn.whereMisused || "N/A"}`);
          lines.push(
            `Financial Damage: ${dyn.financialDamage === "yes" ? "Yes" : "No"}`
          );
          break;
        case "online-blackmail":
          lines.push(`Nature of Threat: ${dyn.threatNature || "N/A"}`);
          lines.push(
            `Sensitive Content Shared: ${
              dyn.sensitiveContentShared === "yes" ? "Yes" : "No"
            }`
          );
          lines.push(
            `Payment Demanded: ${dyn.paymentDemanded === "yes" ? "Yes" : "No"}`
          );
          if (dyn.paymentDemanded === "yes")
            lines.push(`Amount Demanded: ${dyn.amountDemanded || "N/A"}`);
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
    localStorage.setItem("cyberDigitalDraft", JSON.stringify(draft));
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
      link.setAttribute("download", "cyber-digital-complaint.pdf");
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
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* SECTION 1: Crime Type Selection */}
      <div className="card bg-white/90 backdrop-blur">
        <h2 className="text-sm font-semibold text-primary">
          Cyber &amp; Digital Crime Complaint Form
        </h2>
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-700">
            Select Type of Cyber / Digital Crime
            <span className="text-alert"> *</span>
          </label>
          <select
            value={crimeType}
            onChange={handleCrimeTypeChange}
            className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select...</option>
            <option value="Online Fraud">Online Fraud</option>
            <option value="Hacking / Unauthorized Access">
              Hacking / Unauthorized Access
            </option>
            <option value="Cyber Bullying">Cyber Bullying</option>
            <option value="Identity Theft">Identity Theft</option>
            <option value="Phishing / Email Scam">
              Phishing / Email Scam
            </option>
            <option value="Social Media Account Misuse">
              Social Media Account Misuse
            </option>
            <option value="Online Blackmail / Sextortion">
              Online Blackmail / Sextortion
            </option>
            <option value="UPI / Banking Fraud">UPI / Banking Fraud</option>
            <option value="Fake Website / E-commerce Scam">
              Fake Website / E-commerce Scam
            </option>
            <option value="Other">Other</option>
          </select>
          {errors.crimeType && (
            <p className="mt-1 text-[11px] text-alert">{errors.crimeType}</p>
          )}
        </div>
      </div>

      {/* SECTION 2: Complainant Details */}
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
              <p className="mt-1 text-[11px] text-alert">{errors.fullName}</p>
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
              <p className="mt-1 text-[11px] text-alert">{errors.gender}</p>
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
              <p className="mt-1 text-[11px] text-alert">{errors.mobile}</p>
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
              <p className="mt-1 text-[11px] text-alert">{errors.email}</p>
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
              <p className="mt-1 text-[11px] text-alert">{errors.address}</p>
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
              <p className="mt-1 text-[11px] text-alert">{errors.city}</p>
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
              <p className="mt-1 text-[11px] text-alert">{errors.state}</p>
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
              <p className="mt-1 text-[11px] text-alert">{errors.pin}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Preferred Mode of Contact<span className="text-alert"> *</span>
            </label>
            <select
              name="preferredContact"
              value={complainant.preferredContact}
              onChange={handleComplainantChange}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select...</option>
              <option value="Call">Call</option>
              <option value="Email">Email</option>
              <option value="WhatsApp">WhatsApp</option>
            </select>
            {errors.preferredContact && (
              <p className="mt-1 text-[11px] text-alert">
                {errors.preferredContact}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: Cyber Incident Information */}
      <div className="card bg-white/95 backdrop-blur">
        <h3 className="text-sm font-semibold text-primary">
          Cyber Incident Information
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
              <p className="mt-1 text-[11px] text-alert">{errors.date}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Approximate Time<span className="text-alert"> *</span>
            </label>
            <input
              type="time"
              name="time"
              value={incident.time}
              onChange={handleIncidentChange}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.time && (
              <p className="mt-1 text-[11px] text-alert">{errors.time}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Estimated Financial Loss
            </label>
            <input
              type="number"
              name="financialLoss"
              value={incident.financialLoss}
              onChange={handleIncidentChange}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-700">
            Platform / Website / App Involved<span className="text-alert"> *</span>
          </label>
          <input
            type="text"
            name="platform"
            value={incident.platform}
            onChange={handleIncidentChange}
            className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.platform && (
            <p className="mt-1 text-[11px] text-alert">{errors.platform}</p>
          )}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-700">
              URL (optional)
            </label>
            <input
              type="url"
              name="url"
              value={incident.url}
              onChange={handleIncidentChange}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Suspect Profile Link (optional)
            </label>
            <input
              type="url"
              name="suspectProfileLink"
              value={incident.suspectProfileLink}
              onChange={handleIncidentChange}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-700">
            Description of Incident<span className="text-alert"> *</span>
          </label>
          <textarea
            name="description"
            value={incident.description}
            onChange={handleIncidentChange}
            rows={5}
            className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Provide a detailed, chronological description (minimum 150-200 words recommended)..."
          />
          {errors.description && (
            <p className="mt-1 text-[11px] text-alert">
              {errors.description}
            </p>
          )}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Transaction ID
            </label>
            <input
              type="text"
              name="transactionId"
              value={incident.transactionId}
              onChange={handleIncidentChange}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="mt-1 text-[10px] text-slate-500">
              Transaction ID can be found in your bank SMS
            </p>
          </div>
          <div>
            <span className="block text-xs font-medium text-slate-700">
              Was the incident reported to bank/platform?
            </span>
            <div className="mt-1 flex items-center gap-3 text-xs">
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="reportedToBank"
                  value="yes"
                  checked={incident.reportedToBank === "yes"}
                  onChange={handleIncidentChange}
                  className="h-3 w-3"
                />
                Yes
              </label>
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="reportedToBank"
                  value="no"
                  checked={incident.reportedToBank === "no"}
                  onChange={handleIncidentChange}
                  className="h-3 w-3"
                />
                No
              </label>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <span className="block text-xs font-medium text-slate-700">
            Was it reported to Cyber Cell or Police?
          </span>
          <div className="mt-1 flex items-center gap-3 text-xs">
            <label className="inline-flex items-center gap-1">
              <input
                type="radio"
                name="reportedToCyberCell"
                value="yes"
                checked={incident.reportedToCyberCell === "yes"}
                onChange={handleIncidentChange}
                className="h-3 w-3"
              />
              Yes
            </label>
            <label className="inline-flex items-center gap-1">
              <input
                type="radio"
                name="reportedToCyberCell"
                value="no"
                checked={incident.reportedToCyberCell === "no"}
                onChange={handleIncidentChange}
                className="h-3 w-3"
              />
              No
            </label>
          </div>
          {incident.reportedToCyberCell === "yes" && (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
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
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: Dynamic Fields */}
      {currentDynamicKey && (
        <div className="card bg-white/95 backdrop-blur transition-all">
          <h3 className="text-sm font-semibold text-primary">
            Additional Details – {crimeType}
          </h3>
          <div className="mt-3 space-y-3 text-xs text-slate-700">
            {/* Online Fraud / UPI Fraud */}
            {(currentDynamicKey === "online-fraud" ||
              currentDynamicKey === "upi-banking-fraud") && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={dynamicFields[currentDynamicKey].bankName}
                    onChange={(e) => handleDynamicChange(currentDynamicKey, e)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Account Number (Last 4 digits only)
                  </label>
                  <input
                    type="text"
                    name="accountLast4"
                    maxLength={4}
                    value={dynamicFields[currentDynamicKey].accountLast4}
                    onChange={(e) => handleDynamicChange(currentDynamicKey, e)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    name="upiId"
                    value={dynamicFields[currentDynamicKey].upiId}
                    onChange={(e) => handleDynamicChange(currentDynamicKey, e)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Amount Transferred
                  </label>
                  <input
                    type="number"
                    name="amountTransferred"
                    value={dynamicFields[currentDynamicKey].amountTransferred}
                    onChange={(e) => handleDynamicChange(currentDynamicKey, e)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Mode of Payment
                  </label>
                  <select
                    name="paymentMode"
                    value={dynamicFields[currentDynamicKey].paymentMode}
                    onChange={(e) => handleDynamicChange(currentDynamicKey, e)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select...</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Wallet">Wallet</option>
                  </select>
                </div>
              </>
            )}

            {/* Hacking */}
            {currentDynamicKey === "hacking" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Account Type
                  </label>
                  <select
                    name="accountType"
                    value={dynamicFields.hacking.accountType}
                    onChange={(e) => handleDynamicChange("hacking", e)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select...</option>
                    <option value="Email">Email</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Bank">Bank</option>
                    <option value="Website">Website</option>
                  </select>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-700">
                    Was password changed?
                  </span>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="passwordChanged"
                        value="yes"
                        checked={dynamicFields.hacking.passwordChanged === "yes"}
                        onChange={(e) => handleDynamicChange("hacking", e)}
                        className="h-3 w-3"
                      />
                      Yes
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="passwordChanged"
                        value="no"
                        checked={dynamicFields.hacking.passwordChanged === "no"}
                        onChange={(e) => handleDynamicChange("hacking", e)}
                        className="h-3 w-3"
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-700">
                    Two-factor authentication enabled?
                  </span>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="twoFactorEnabled"
                        value="yes"
                        checked={
                          dynamicFields.hacking.twoFactorEnabled === "yes"
                        }
                        onChange={(e) => handleDynamicChange("hacking", e)}
                        className="h-3 w-3"
                      />
                      Yes
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="twoFactorEnabled"
                        value="no"
                        checked={dynamicFields.hacking.twoFactorEnabled === "no"}
                        onChange={(e) => handleDynamicChange("hacking", e)}
                        className="h-3 w-3"
                      />
                      No
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Cyber Bullying */}
            {currentDynamicKey === "cyber-bullying" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Platform Name
                  </label>
                  <input
                    type="text"
                    name="platformName"
                    value={dynamicFields["cyber-bullying"].platformName}
                    onChange={(e) =>
                      handleDynamicChange("cyber-bullying", e)
                    }
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Accused Profile Name
                  </label>
                  <input
                    type="text"
                    name="accusedProfileName"
                    value={dynamicFields["cyber-bullying"].accusedProfileName}
                    onChange={(e) =>
                      handleDynamicChange("cyber-bullying", e)
                    }
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Nature of Harassment
                  </label>
                  <select
                    name="harassmentNature"
                    value={dynamicFields["cyber-bullying"].harassmentNature}
                    onChange={(e) =>
                      handleDynamicChange("cyber-bullying", e)
                    }
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select...</option>
                    <option value="Threat">Threat</option>
                    <option value="Defamation">Defamation</option>
                    <option value="Stalking">Stalking</option>
                  </select>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-700">
                    Is minor involved?
                  </span>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="minorInvolved"
                        value="yes"
                        checked={
                          dynamicFields["cyber-bullying"].minorInvolved === "yes"
                        }
                        onChange={(e) =>
                          handleDynamicChange("cyber-bullying", e)
                        }
                        className="h-3 w-3"
                      />
                      Yes
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="minorInvolved"
                        value="no"
                        checked={
                          dynamicFields["cyber-bullying"].minorInvolved === "no"
                        }
                        onChange={(e) =>
                          handleDynamicChange("cyber-bullying", e)
                        }
                        className="h-3 w-3"
                      />
                      No
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Identity Theft */}
            {currentDynamicKey === "identity-theft" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Type of Identity Misused
                  </label>
                  <select
                    name="identityType"
                    value={dynamicFields["identity-theft"].identityType}
                    onChange={(e) => handleDynamicChange("identity-theft", e)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select...</option>
                    <option value="Aadhaar">Aadhaar</option>
                    <option value="PAN">PAN</option>
                    <option value="Bank Details">Bank Details</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Where misused?
                  </label>
                  <input
                    type="text"
                    name="whereMisused"
                    value={dynamicFields["identity-theft"].whereMisused}
                    onChange={(e) => handleDynamicChange("identity-theft", e)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-700">
                    Financial damage occurred?
                  </span>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="financialDamage"
                        value="yes"
                        checked={
                          dynamicFields["identity-theft"].financialDamage ===
                          "yes"
                        }
                        onChange={(e) => handleDynamicChange("identity-theft", e)}
                        className="h-3 w-3"
                      />
                      Yes
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="financialDamage"
                        value="no"
                        checked={
                          dynamicFields["identity-theft"].financialDamage ===
                          "no"
                        }
                        onChange={(e) => handleDynamicChange("identity-theft", e)}
                        className="h-3 w-3"
                      />
                      No
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Online Blackmail */}
            {currentDynamicKey === "online-blackmail" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Nature of threat
                  </label>
                  <textarea
                    name="threatNature"
                    value={dynamicFields["online-blackmail"].threatNature}
                    onChange={(e) =>
                      handleDynamicChange("online-blackmail", e)
                    }
                    rows={2}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-700">
                    Was sensitive content shared?
                  </span>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="sensitiveContentShared"
                        value="yes"
                        checked={
                          dynamicFields["online-blackmail"]
                            .sensitiveContentShared === "yes"
                        }
                        onChange={(e) =>
                          handleDynamicChange("online-blackmail", e)
                        }
                        className="h-3 w-3"
                      />
                      Yes
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="sensitiveContentShared"
                        value="no"
                        checked={
                          dynamicFields["online-blackmail"]
                            .sensitiveContentShared === "no"
                        }
                        onChange={(e) =>
                          handleDynamicChange("online-blackmail", e)
                        }
                        className="h-3 w-3"
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-700">
                    Payment demanded?
                  </span>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="paymentDemanded"
                        value="yes"
                        checked={
                          dynamicFields["online-blackmail"].paymentDemanded ===
                          "yes"
                        }
                        onChange={(e) =>
                          handleDynamicChange("online-blackmail", e)
                        }
                        className="h-3 w-3"
                      />
                      Yes
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="paymentDemanded"
                        value="no"
                        checked={
                          dynamicFields["online-blackmail"].paymentDemanded ===
                          "no"
                        }
                        onChange={(e) =>
                          handleDynamicChange("online-blackmail", e)
                        }
                        className="h-3 w-3"
                      />
                      No
                    </label>
                  </div>
                </div>
                {dynamicFields["online-blackmail"].paymentDemanded ===
                  "yes" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Amount demanded
                    </label>
                    <input
                      type="number"
                      name="amountDemanded"
                      value={dynamicFields["online-blackmail"].amountDemanded}
                      onChange={(e) =>
                        handleDynamicChange("online-blackmail", e)
                      }
                      className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* SECTION 5: Evidence Upload */}
      <div className="card bg-white/95 backdrop-blur">
        <h3 className="text-sm font-semibold text-primary">
          Upload Digital Evidence
        </h3>
        <p className="mt-1 text-[11px] text-slate-600">
          Ensure sensitive information like full bank details is partially masked
          before uploading.
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

      {/* SECTION 6: Emergency Alert */}
      {isRecentIncident && (
        <div className="rounded-lg border-2 border-alert bg-red-50 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-alert">
            <span>⚠️</span>
            <span>
              Immediate Action Recommended: Contact your bank and dial 1930
              (National Cyber Crime Helpline).
            </span>
          </p>
        </div>
      )}

      {/* SECTION 7: Declaration & Actions */}
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
              I declare that the information provided is true and accurate to the
              best of my knowledge.
              <span className="text-alert"> *</span>
            </span>
          </label>
          {errors.declared && (
            <p className="text-[11px] text-alert">{errors.declared}</p>
          )}

          <div className="mt-2 flex flex-wrap gap-2">
            <button type="submit" className="btn-primary text-xs">
              Submit Complaint
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="btn-secondary text-xs"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={handleGenerateAiSummary}
              disabled={aiLoading}
              className="btn-secondary text-xs"
            >
              {aiLoading ? "Generating..." : "Generate AI Legal Summary"}
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="btn-secondary text-xs"
            >
              {pdfLoading ? "Preparing PDF..." : "Download Complaint as PDF"}
            </button>
            <button
              type="button"
              onClick={() => {
                const text = buildComplaintText();
                navigator.clipboard.writeText(text);
                setStatusMessage("Complaint text copied to clipboard for Cyber Cell format.");
              }}
              className="btn-secondary text-xs"
            >
              Send to Cyber Cell Format
            </button>
          </div>

          {statusMessage && (
            <p className="mt-2 text-[11px] text-slate-700">{statusMessage}</p>
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

export default CyberDigital;
