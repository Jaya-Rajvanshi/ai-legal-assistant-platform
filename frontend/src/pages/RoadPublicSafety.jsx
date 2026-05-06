import React, { useMemo, useState } from "react";
import api from "../api/client.js";

const initialComplainant = {
  fullName: "",
  gender: "",
  mobile: "",
  email: "",
  address: "",
  role: "",
};

const initialIncident = {
  date: "",
  time: "",
  location: "",
  landmark: "",
  description: "",
  injuries: "no",
  propertyDamaged: "no",
  estimatedExpense: "",
  vehiclesInvolved: "",
  policeInformed: "no",
  firNumber: "",
  policeStation: "",
};

const initialDynamic = {
  "road-accident": {
    yourVehicleNumber: "",
    otherVehicleNumber: "",
    vehicleType: "",
    insuranceDetails: "",
  },
  "hit-and-run": {
    suspectVehicleNumber: "",
    vehicleColor: "",
    directionOfEscape: "",
    eyewitnessDetails: "",
  },
  "drunk-driving": {
    behaviorDescription: "",
    timeObserved: "",
    driverStillPresent: "no",
  },
  "rash-driving": {
    speedEstimate: "",
    trafficCondition: "",
    signalViolated: "no",
  },
  "public-nuisance": {
    nuisanceNature: "",
    duration: "",
    recurring: "no",
  },
  "dangerous-road-condition": {
    issueType: "",
    sinceWhen: "",
    previouslyReported: "no",
  },
};

const RoadPublicSafety = () => {
  const [incidentType, setIncidentType] = useState("");
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

  const handleIncidentTypeChange = (e) => {
    setIncidentType(e.target.value);
    setErrors((prev) => ({ ...prev, incidentType: undefined }));
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
    if (!incidentType) return null;
    const keyMap = {
      "Road Accident": "road-accident",
      "Hit and Run": "hit-and-run",
      "Drunk Driving": "drunk-driving",
      "Rash / Negligent Driving": "rash-driving",
      "Public Nuisance": "public-nuisance",
      "Dangerous Road Condition": "dangerous-road-condition",
    };
    return keyMap[incidentType] || null;
  }, [incidentType]);

  const handleFilesChange = (e) => {
    setFiles(Array.from(e.target.files || []));
  };

  const showEmergencyAlert = useMemo(() => {
    return (
      incident.injuries === "yes" ||
      incidentType === "Hit and Run" ||
      incidentType === "Road Accident"
    );
  }, [incident.injuries, incidentType]);

  const validate = () => {
    const newErrors = {};

    if (!incidentType) newErrors.incidentType = "Please select an incident type.";

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
    if (!complainant.role)
      newErrors.role = "Please specify if you are Victim / Witness / Third Party Reporter.";

    if (!incident.date) newErrors.date = "Date of incident is required.";
    if (!incident.time) newErrors.time = "Time of incident is required.";
    if (!incident.location.trim())
      newErrors.location = "Exact location is required.";
    if (!incident.description.trim())
      newErrors.description = "Description is required.";
    else if (incident.description.trim().length < 150)
      newErrors.description =
        "Description must be at least 150 characters for clarity.";

    if (incident.policeInformed === "yes") {
      if (!incident.firNumber.trim())
        newErrors.firNumber = "FIR Number is required if police was informed.";
      if (!incident.policeStation.trim())
        newErrors.policeStation = "Police Station name is required.";
    }

    if (!declared) {
      newErrors.declared =
        "You must confirm that the information provided is true.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildComplaintText = () => {
    const lines = [];
    lines.push(`Incident Category: Road & Public Safety (${incidentType || "N/A"})`);
    lines.push("");
    lines.push("Complainant Information:");
    lines.push(`Name: ${complainant.fullName}`);
    lines.push(`Gender: ${complainant.gender}`);
    lines.push(`Mobile: ${complainant.mobile} | Email: ${complainant.email}`);
    lines.push(`Address: ${complainant.address}`);
    lines.push(`Role: ${complainant.role}`);
    lines.push("");
    lines.push("Incident Information:");
    lines.push(`Date & Time: ${incident.date} at ${incident.time || "N/A"}`);
    lines.push(`Exact Location: ${incident.location}`);
    if (incident.landmark) lines.push(`Landmark: ${incident.landmark}`);
    lines.push(`Were there injuries: ${incident.injuries === "yes" ? "Yes" : "No"}`);
    lines.push(`Was property damaged: ${incident.propertyDamaged === "yes" ? "Yes" : "No"}`);
    if (incident.estimatedExpense)
      lines.push(`Estimated Expense: ${incident.estimatedExpense}`);
    if (incident.vehiclesInvolved)
      lines.push(`Number of vehicles involved: ${incident.vehiclesInvolved}`);
    lines.push(
      `Was police informed: ${incident.policeInformed === "yes" ? "Yes" : "No"}`
    );
    if (incident.policeInformed === "yes") {
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
        case "road-accident":
          lines.push(`Your Vehicle Number: ${dyn.yourVehicleNumber || "N/A"}`);
          lines.push(`Other Vehicle Number: ${dyn.otherVehicleNumber || "N/A"}`);
          lines.push(`Vehicle Type: ${dyn.vehicleType || "N/A"}`);
          lines.push(`Insurance Details: ${dyn.insuranceDetails || "N/A"}`);
          break;
        case "hit-and-run":
          lines.push(`Suspect Vehicle Number: ${dyn.suspectVehicleNumber || "N/A"}`);
          lines.push(`Vehicle Color: ${dyn.vehicleColor || "N/A"}`);
          lines.push(`Direction of Escape: ${dyn.directionOfEscape || "N/A"}`);
          lines.push(`Eyewitness Details: ${dyn.eyewitnessDetails || "N/A"}`);
          break;
        case "drunk-driving":
          lines.push(`Description of Behavior: ${dyn.behaviorDescription || "N/A"}`);
          lines.push(`Time Observed: ${dyn.timeObserved || "N/A"}`);
          lines.push(
            `Is driver still present: ${dyn.driverStillPresent === "yes" ? "Yes" : "No"}`
          );
          break;
        case "rash-driving":
          lines.push(`Speed Estimate: ${dyn.speedEstimate || "N/A"}`);
          lines.push(`Traffic Condition: ${dyn.trafficCondition || "N/A"}`);
          lines.push(
            `Was signal violated: ${dyn.signalViolated === "yes" ? "Yes" : "No"}`
          );
          break;
        case "public-nuisance":
          lines.push(`Nature of Nuisance: ${dyn.nuisanceNature || "N/A"}`);
          lines.push(`Duration: ${dyn.duration || "N/A"}`);
          lines.push(`Recurring: ${dyn.recurring === "yes" ? "Yes" : "No"}`);
          break;
        case "dangerous-road-condition":
          lines.push(`Type of Issue: ${dyn.issueType || "N/A"}`);
          lines.push(`Since When: ${dyn.sinceWhen || "N/A"}`);
          lines.push(
            `Previously Reported: ${dyn.previouslyReported === "yes" ? "Yes" : "No"}`
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
      incidentType,
      complainant,
      incident,
      dynamicFields,
      declared,
    };
    localStorage.setItem("roadPublicSafetyDraft", JSON.stringify(draft));
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
          complainantAddress: complainant.address,
          contactNumber: complainant.mobile,
        },
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "road-public-safety-complaint.pdf");
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
      {/* SECTION 1: Incident Type Selection */}
      <div className="card bg-white/90 backdrop-blur">
        <h2 className="text-sm font-semibold text-primary">
          Road &amp; Public Safety Complaint Form
        </h2>
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-700">
            Select Type of Road / Public Safety Issue
            <span className="text-alert"> *</span>
          </label>
          <select
            value={incidentType}
            onChange={handleIncidentTypeChange}
            className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select...</option>
            <option value="Road Accident">Road Accident</option>
            <option value="Hit and Run">Hit and Run</option>
            <option value="Drunk Driving">Drunk Driving</option>
            <option value="Rash / Negligent Driving">
              Rash / Negligent Driving
            </option>
            <option value="Road Rage">Road Rage</option>
            <option value="Public Nuisance">Public Nuisance</option>
            <option value="Illegal Parking">Illegal Parking</option>
            <option value="Traffic Signal Violation">
              Traffic Signal Violation
            </option>
            <option value="Dangerous Road Condition">
              Dangerous Road Condition
            </option>
            <option value="Other">Other</option>
          </select>
          {errors.incidentType && (
            <p className="mt-1 text-[11px] text-alert">{errors.incidentType}</p>
          )}
        </div>
      </div>

      {/* SECTION 2: Complainant Information */}
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
              Are you Victim / Witness / Third Party Reporter?
              <span className="text-alert"> *</span>
            </label>
            <select
              name="role"
              value={complainant.role}
              onChange={handleComplainantChange}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select...</option>
              <option value="Victim">Victim</option>
              <option value="Witness">Witness</option>
              <option value="Third Party Reporter">Third Party Reporter</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-[11px] text-alert">{errors.role}</p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: Incident Information */}
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
              <p className="mt-1 text-[11px] text-alert">{errors.date}</p>
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
              <p className="mt-1 text-[11px] text-alert">{errors.time}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Number of Vehicles Involved
            </label>
            <input
              type="number"
              name="vehiclesInvolved"
              value={incident.vehiclesInvolved}
              onChange={handleIncidentChange}
              min="0"
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-700">
            Exact Location<span className="text-alert"> *</span>
          </label>
          <input
            type="text"
            name="location"
            value={incident.location}
            onChange={handleIncidentChange}
            className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.location && (
            <p className="mt-1 text-[11px] text-alert">{errors.location}</p>
          )}
        </div>
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-700">
            Landmark
          </label>
          <input
            type="text"
            name="landmark"
            value={incident.landmark}
            onChange={handleIncidentChange}
            className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-700">
            Description<span className="text-alert"> *</span>
          </label>
          <textarea
            name="description"
            value={incident.description}
            onChange={handleIncidentChange}
            rows={5}
            className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Provide a detailed, chronological description (minimum 150 words recommended)..."
          />
          {errors.description && (
            <p className="mt-1 text-[11px] text-alert">
              {errors.description}
            </p>
          )}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <span className="block text-xs font-medium text-slate-700">
              Were there injuries?
            </span>
            <div className="mt-1 flex items-center gap-3 text-xs">
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="injuries"
                  value="yes"
                  checked={incident.injuries === "yes"}
                  onChange={handleIncidentChange}
                  className="h-3 w-3"
                />
                Yes
              </label>
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="injuries"
                  value="no"
                  checked={incident.injuries === "no"}
                  onChange={handleIncidentChange}
                  className="h-3 w-3"
                />
                No
              </label>
            </div>
          </div>
          <div>
            <span className="block text-xs font-medium text-slate-700">
              Was property damaged?
            </span>
            <div className="mt-1 flex items-center gap-3 text-xs">
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="propertyDamaged"
                  value="yes"
                  checked={incident.propertyDamaged === "yes"}
                  onChange={handleIncidentChange}
                  className="h-3 w-3"
                />
                Yes
              </label>
              <label className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name="propertyDamaged"
                  value="no"
                  checked={incident.propertyDamaged === "no"}
                  onChange={handleIncidentChange}
                  className="h-3 w-3"
                />
                No
              </label>
            </div>
          </div>
        </div>
        {incident.injuries === "yes" || incident.propertyDamaged === "yes" ? (
          <div className="mt-3">
            <label className="block text-xs font-medium text-slate-700">
              Estimated Medical/Damage Expense
            </label>
            <input
              type="number"
              name="estimatedExpense"
              value={incident.estimatedExpense}
              onChange={handleIncidentChange}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        ) : null}
        <div className="mt-3">
          <span className="block text-xs font-medium text-slate-700">
            Was police informed?
          </span>
          <div className="mt-1 flex items-center gap-3 text-xs">
            <label className="inline-flex items-center gap-1">
              <input
                type="radio"
                name="policeInformed"
                value="yes"
                checked={incident.policeInformed === "yes"}
                onChange={handleIncidentChange}
                className="h-3 w-3"
              />
              Yes
            </label>
            <label className="inline-flex items-center gap-1">
              <input
                type="radio"
                name="policeInformed"
                value="no"
                checked={incident.policeInformed === "no"}
                onChange={handleIncidentChange}
                className="h-3 w-3"
              />
              No
            </label>
          </div>
          {incident.policeInformed === "yes" && (
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
                  Police Station
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
            Additional Details – {incidentType}
          </h3>
          <div className="mt-3 space-y-3 text-xs text-slate-700">
            {/* Road Accident */}
            {currentDynamicKey === "road-accident" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Your Vehicle Number
                  </label>
                  <input
                    type="text"
                    name="yourVehicleNumber"
                    value={dynamicFields["road-accident"].yourVehicleNumber}
                    onChange={(e) => handleDynamicChange("road-accident", e)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Other Vehicle Number
                  </label>
                  <input
                    type="text"
                    name="otherVehicleNumber"
                    value={dynamicFields["road-accident"].otherVehicleNumber}
                    onChange={(e) => handleDynamicChange("road-accident", e)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Vehicle Type
                  </label>
                  <select
                    name="vehicleType"
                    value={dynamicFields["road-accident"].vehicleType}
                    onChange={(e) => handleDynamicChange("road-accident", e)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select...</option>
                    <option value="Two-Wheeler">Two-Wheeler</option>
                    <option value="Four-Wheeler">Four-Wheeler</option>
                    <option value="Commercial Vehicle">Commercial Vehicle</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Insurance Details
                  </label>
                  <textarea
                    name="insuranceDetails"
                    value={dynamicFields["road-accident"].insuranceDetails}
                    onChange={(e) => handleDynamicChange("road-accident", e)}
                    rows={2}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </>
            )}

            {/* Hit and Run */}
            {currentDynamicKey === "hit-and-run" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Suspect Vehicle Number
                  </label>
                  <input
                    type="text"
                    name="suspectVehicleNumber"
                    value={dynamicFields["hit-and-run"].suspectVehicleNumber}
                    onChange={(e) => handleDynamicChange("hit-and-run", e)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Vehicle Color
                  </label>
                  <input
                    type="text"
                    name="vehicleColor"
                    value={dynamicFields["hit-and-run"].vehicleColor}
                    onChange={(e) => handleDynamicChange("hit-and-run", e)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Direction of Escape
                  </label>
                  <input
                    type="text"
                    name="directionOfEscape"
                    value={dynamicFields["hit-and-run"].directionOfEscape}
                    onChange={(e) => handleDynamicChange("hit-and-run", e)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Eyewitness Details
                  </label>
                  <textarea
                    name="eyewitnessDetails"
                    value={dynamicFields["hit-and-run"].eyewitnessDetails}
                    onChange={(e) => handleDynamicChange("hit-and-run", e)}
                    rows={2}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </>
            )}

            {/* Drunk Driving */}
            {currentDynamicKey === "drunk-driving" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Description of Behavior
                  </label>
                  <textarea
                    name="behaviorDescription"
                    value={dynamicFields["drunk-driving"].behaviorDescription}
                    onChange={(e) => handleDynamicChange("drunk-driving", e)}
                    rows={2}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Time Observed
                  </label>
                  <input
                    type="time"
                    name="timeObserved"
                    value={dynamicFields["drunk-driving"].timeObserved}
                    onChange={(e) => handleDynamicChange("drunk-driving", e)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-700">
                    Is driver still present?
                  </span>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="driverStillPresent"
                        value="yes"
                        checked={
                          dynamicFields["drunk-driving"].driverStillPresent ===
                          "yes"
                        }
                        onChange={(e) => handleDynamicChange("drunk-driving", e)}
                        className="h-3 w-3"
                      />
                      Yes
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="driverStillPresent"
                        value="no"
                        checked={
                          dynamicFields["drunk-driving"].driverStillPresent ===
                          "no"
                        }
                        onChange={(e) => handleDynamicChange("drunk-driving", e)}
                        className="h-3 w-3"
                      />
                      No
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Rash Driving */}
            {currentDynamicKey === "rash-driving" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Speed Estimate
                  </label>
                  <input
                    type="text"
                    name="speedEstimate"
                    value={dynamicFields["rash-driving"].speedEstimate}
                    onChange={(e) => handleDynamicChange("rash-driving", e)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Traffic Condition
                  </label>
                  <select
                    name="trafficCondition"
                    value={dynamicFields["rash-driving"].trafficCondition}
                    onChange={(e) => handleDynamicChange("rash-driving", e)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select...</option>
                    <option value="Heavy Traffic">Heavy Traffic</option>
                    <option value="Moderate Traffic">Moderate Traffic</option>
                    <option value="Light Traffic">Light Traffic</option>
                    <option value="No Traffic">No Traffic</option>
                  </select>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-700">
                    Was signal violated?
                  </span>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="signalViolated"
                        value="yes"
                        checked={
                          dynamicFields["rash-driving"].signalViolated === "yes"
                        }
                        onChange={(e) => handleDynamicChange("rash-driving", e)}
                        className="h-3 w-3"
                      />
                      Yes
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="signalViolated"
                        value="no"
                        checked={
                          dynamicFields["rash-driving"].signalViolated === "no"
                        }
                        onChange={(e) => handleDynamicChange("rash-driving", e)}
                        className="h-3 w-3"
                      />
                      No
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Public Nuisance */}
            {currentDynamicKey === "public-nuisance" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Nature of Nuisance
                  </label>
                  <textarea
                    name="nuisanceNature"
                    value={dynamicFields["public-nuisance"].nuisanceNature}
                    onChange={(e) => handleDynamicChange("public-nuisance", e)}
                    rows={2}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Duration
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={dynamicFields["public-nuisance"].duration}
                    onChange={(e) => handleDynamicChange("public-nuisance", e)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-700">
                    Recurring?
                  </span>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="recurring"
                        value="yes"
                        checked={
                          dynamicFields["public-nuisance"].recurring === "yes"
                        }
                        onChange={(e) =>
                          handleDynamicChange("public-nuisance", e)
                        }
                        className="h-3 w-3"
                      />
                      Yes
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="recurring"
                        value="no"
                        checked={
                          dynamicFields["public-nuisance"].recurring === "no"
                        }
                        onChange={(e) =>
                          handleDynamicChange("public-nuisance", e)
                        }
                        className="h-3 w-3"
                      />
                      No
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Dangerous Road Condition */}
            {currentDynamicKey === "dangerous-road-condition" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Type of Issue
                  </label>
                  <select
                    name="issueType"
                    value={dynamicFields["dangerous-road-condition"].issueType}
                    onChange={(e) =>
                      handleDynamicChange("dangerous-road-condition", e)
                    }
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select...</option>
                    <option value="Pothole">Pothole</option>
                    <option value="Broken Signal">Broken Signal</option>
                    <option value="No Streetlight">No Streetlight</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Since When?
                  </label>
                  <input
                    type="text"
                    name="sinceWhen"
                    value={dynamicFields["dangerous-road-condition"].sinceWhen}
                    onChange={(e) =>
                      handleDynamicChange("dangerous-road-condition", e)
                    }
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-700">
                    Previously Reported?
                  </span>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="previouslyReported"
                        value="yes"
                        checked={
                          dynamicFields["dangerous-road-condition"]
                            .previouslyReported === "yes"
                        }
                        onChange={(e) =>
                          handleDynamicChange("dangerous-road-condition", e)
                        }
                        className="h-3 w-3"
                      />
                      Yes
                    </label>
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="radio"
                        name="previouslyReported"
                        value="no"
                        checked={
                          dynamicFields["dangerous-road-condition"]
                            .previouslyReported === "no"
                        }
                        onChange={(e) =>
                          handleDynamicChange("dangerous-road-condition", e)
                        }
                        className="h-3 w-3"
                      />
                      No
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* SECTION 5: Evidence Upload */}
      <div className="card bg-white/95 backdrop-blur">
        <h3 className="text-sm font-semibold text-primary">
          Evidence Upload
        </h3>
        <p className="mt-1 text-[11px] text-slate-600">
          Ensure vehicle numbers and faces are clearly visible if available.
        </p>
        <div className="mt-3">
          <input
            type="file"
            multiple
            accept="image/*,application/pdf,video/*"
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
      {showEmergencyAlert && (
        <div className="rounded-lg border-2 border-alert bg-red-50 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-alert">
            <span>🚨</span>
            <span>
              If this is an emergency, immediately dial 112 (National Emergency
              Helpline).
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
              I confirm that the information provided is true to the best of my
              knowledge.
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
              Save Draft
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
                setStatusMessage("Complaint text copied to clipboard for Traffic Police format.");
              }}
              className="btn-secondary text-xs"
            >
              Send to Traffic Police Format
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

export default RoadPublicSafety;
