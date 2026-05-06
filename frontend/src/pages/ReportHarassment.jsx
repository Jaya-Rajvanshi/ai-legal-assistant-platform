import React, { useState, useMemo, useRef, useEffect } from "react";
import Layout from "../components/Layout.jsx";
import api from "../api/client.js";

const inputClass =
  "mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors";
const labelClass = "block text-xs font-medium text-slate-700";
const requiredStar = <span className="text-alert"> *</span>;
const sectionTitleClass = "text-sm font-semibold text-primary border-b border-slate-200 pb-2 mb-3";

const REPORT_TYPES = [
  "Sexual Harassment",
  "Domestic Violence",
  "Stalking",
  "Dowry Harassment",
  "Cyber Harassment",
  "Assault",
  "Acid Attack",
  "Human Trafficking",
  "Workplace Harassment",
  "Other",
];

// Auto-expanding textarea: no maxLength, grows with content
const AutoExpandTextarea = ({ value, onChange, rows = 6, className, placeholder, name }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(rows * 20, el.scrollHeight)}px`;
  }, [value, rows]);
  return (
    <textarea
      ref={ref}
      name={name}
      value={value}
      onChange={onChange}
      rows={rows}
      className={className}
      placeholder={placeholder}
    />
  );
};

const ReportHarassment = () => {
  const [reportType, setReportType] = useState("");
  const [victim, setVictim] = useState({
    fullName: "",
    age: "",
    gender: "",
    mobile: "",
    address: "",
    occupation: "",
    filingOnBehalf: "no",
  });
  const [accused, setAccused] = useState({
    name: "",
    relationship: "",
    address: "",
    mobile: "",
    workplace: "",
  });
  const [incident, setIncident] = useState({
    date: "",
    time: "",
    location: "",
    description: "",
    witnesses: "no",
    witnessDetails: "",
    policeInformed: "no",
    firNumber: "",
    policeStation: "",
    medicalTreatment: "no",
  });
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [evidencePreviews, setEvidencePreviews] = useState([]);
  const [declaration, setDeclaration] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("idle"); // idle | success | error
  const [submitMessage, setSubmitMessage] = useState("");
  const [result, setResult] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [summaryError, setSummaryError] = useState("");
  const statusRef = useRef(null);

  const severeCrimes = ["Acid Attack", "Assault", "Human Trafficking"];
  const showEmergencyAlert = useMemo(
    () => reportType && severeCrimes.includes(reportType),
    [reportType]
  );

  const scrollToStatus = () => {
    statusRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const handleVictimChange = (e) => {
    const { name, value } = e.target;
    setVictim((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };
  const handleAccusedChange = (e) => {
    const { name, value } = e.target;
    setAccused((prev) => ({ ...prev, [name]: value }));
  };
  const handleIncidentChange = (e) => {
    const { name, value } = e.target;
    setIncident((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleEvidenceChange = (e) => {
    const files = Array.from(e.target.files || []);
    const newPreviews = files.map((f) => (f.type.startsWith("image/") ? URL.createObjectURL(f) : null));
    setEvidenceFiles((prev) => [...prev, ...files]);
    setEvidencePreviews((prev) => [...prev, ...newPreviews]);
  };
  const removeEvidence = (idx) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== idx));
    setEvidencePreviews((prev) => {
      if (prev[idx]) URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const validate = () => {
    const e = {};
    if (!reportType) e.reportType = "Please select reporting type.";
    if (!victim.fullName?.trim()) e.victimFullName = "Full Name is required.";
    if (!victim.age?.trim()) e.victimAge = "Age is required.";
    else if (isNaN(Number(victim.age)) || Number(victim.age) < 0 || Number(victim.age) > 120)
      e.victimAge = "Enter a valid age.";
    if (!victim.gender) e.victimGender = "Gender is required.";
    if (!victim.mobile?.trim()) e.victimMobile = "Mobile Number is required.";
    else if (!/^[0-9]{10}$/.test(victim.mobile.trim())) e.victimMobile = "Enter a valid 10-digit number.";
    if (!victim.address?.trim()) e.victimAddress = "Address is required.";
    if (!incident.date) e.incidentDate = "Date of incident is required.";
    if (!incident.time) e.incidentTime = "Time is required.";
    if (!incident.location?.trim()) e.incidentLocation = "Location is required.";
    if (!incident.description?.trim()) e.description = "Detailed description is required.";
    if (!declaration) e.declaration = "You must declare that the information provided is true.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSubmitStatus("idle");
    setSubmitMessage("");
    setResult(null);
    setErrors((prev) => ({ ...prev, submit: undefined }));

    const descriptionText = [
      `Type: ${reportType}. Victim: ${victim.fullName}, Age ${victim.age}, Gender ${victim.gender}, Mobile ${victim.mobile}, Address: ${victim.address}. Filing on behalf: ${victim.filingOnBehalf}.`,
      `Accused: ${accused.name || "N/A"}, Relationship: ${accused.relationship || "N/A"}, Address: ${accused.address || "N/A"}, Mobile: ${accused.mobile || "N/A"}, Workplace: ${accused.workplace || "N/A"}.`,
      `Incident: ${incident.date} at ${incident.time}, Location: ${incident.location}. Witnesses: ${incident.witnesses}${incident.witnesses === "yes" ? ` - ${incident.witnessDetails}` : ""}. Police informed: ${incident.policeInformed}${incident.policeInformed === "yes" ? `, FIR: ${incident.firNumber}, Station: ${incident.policeStation}` : ""}. Medical treatment: ${incident.medicalTreatment}.`,
      "Detailed description: " + (incident.description || ""),
    ].join(" ");

    const formData = new FormData();
    formData.append("reportType", reportType);
    formData.append("description", descriptionText);
    formData.append("name", victim.fullName || "");
    if (victim.email && String(victim.email).trim()) formData.append("email", String(victim.email).trim());
    formData.append("address", victim.address || "");
    formData.append("isAnonymous", "false");
    if (evidenceFiles.length > 0) formData.append("file", evidenceFiles[0]);

    try {
      const { data } = await api.post("/submit-crime-against-women", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
      const success = data && (data.success === true || data.trackingId);
      setSubmitStatus(success ? "success" : "error");
      setSubmitMessage(success ? "Form Submitted Successfully ✅" : "Submission Failed ❌ Please try again.");
      scrollToStatus();
    } catch (err) {
      setSubmitStatus("error");
      setSubmitMessage("Submission Failed ❌ Please try again.");
      setErrors((prev) => ({
        ...prev,
        submit: err.response?.data?.message || "Submission Failed ❌ Please try again.",
      }));
      scrollToStatus();
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    const hasMinimum = reportType && incident.description?.trim();
    if (!hasMinimum) {
      alert("Please fill details before generating summary.");
      return;
    }
    setSummaryLoading(true);
    setSummaryError("");
    setSummaryText("");
    try {
      const { data } = await api.post("/harassment/generate-summary", {
        reportType,
        victim: { ...victim },
        accused: { ...accused },
        incident: { ...incident },
      });
      if (data && data.success && data.summary) {
        setSummaryText(data.summary);
        setSummaryError("");
      } else {
        setSummaryError("Failed to generate summary. Please try again.");
      }
    } catch (err) {
      setSummaryError(err.response?.data?.message || "Failed to generate summary. Please try again.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSaveDraft = () => {
    const draft = { reportType, victim, accused, incident };
    localStorage.setItem("womenSafetyDraft", JSON.stringify(draft));
    setSubmitStatus("idle");
    setSubmitMessage("Draft saved locally.");
    setTimeout(() => setSubmitMessage(""), 3000);
  };

  return (
    <Layout>
      <div className="w-full space-y-4">
        <h1 className="text-xl font-semibold text-primary">Women Safety & Crime Reporting Form</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          File a structured FIR-style complaint for crimes against women. Your report will be securely stored and can be used to generate FIR drafts and PDFs for authorities.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Section 1: Reporting Type */}
          <div className="card bg-white/95 backdrop-blur transition-shadow duration-200">
            <h2 className={sectionTitleClass}>Section 1: Reporting Type</h2>
            <div>
              <label className={labelClass}>Select type of crime{requiredStar}</label>
              <select
                value={reportType}
                onChange={(e) => {
                  setReportType(e.target.value);
                  setErrors((prev) => ({ ...prev, reportType: undefined }));
                }}
                className={inputClass}
              >
                <option value="">Select...</option>
                {REPORT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.reportType && <p className="mt-1 text-[11px] text-alert">{errors.reportType}</p>}
            </div>
          </div>

          {/* Section 2: Victim Details */}
          <div className="card bg-white/95 backdrop-blur transition-shadow duration-200">
            <h2 className={sectionTitleClass}>Section 2: Victim Details</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>Full Name{requiredStar}</label>
                <input type="text" name="fullName" value={victim.fullName} onChange={handleVictimChange} className={inputClass} />
                {errors.victimFullName && <p className="mt-1 text-[11px] text-alert">{errors.victimFullName}</p>}
              </div>
              <div>
                <label className={labelClass}>Age{requiredStar}</label>
                <input type="number" name="age" min={0} max={120} value={victim.age} onChange={handleVictimChange} className={inputClass} />
                {errors.victimAge && <p className="mt-1 text-[11px] text-alert">{errors.victimAge}</p>}
              </div>
              <div>
                <label className={labelClass}>Gender{requiredStar}</label>
                <select name="gender" value={victim.gender} onChange={handleVictimChange} className={inputClass}>
                  <option value="">Select</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
                {errors.victimGender && <p className="mt-1 text-[11px] text-alert">{errors.victimGender}</p>}
              </div>
              <div>
                <label className={labelClass}>Mobile Number{requiredStar}</label>
                <input type="tel" name="mobile" value={victim.mobile} onChange={handleVictimChange} className={inputClass} maxLength={10} />
                {errors.victimMobile && <p className="mt-1 text-[11px] text-alert">{errors.victimMobile}</p>}
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Address{requiredStar}</label>
                <AutoExpandTextarea name="address" value={victim.address} onChange={handleVictimChange} rows={2} className={inputClass} />
                {errors.victimAddress && <p className="mt-1 text-[11px] text-alert">{errors.victimAddress}</p>}
              </div>
              <div>
                <label className={labelClass}>Occupation</label>
                <input type="text" name="occupation" value={victim.occupation} onChange={handleVictimChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Are you filing on behalf of victim?</label>
                <select name="filingOnBehalf" value={victim.filingOnBehalf} onChange={handleVictimChange} className={inputClass}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Accused Details */}
          <div className="card bg-white/95 backdrop-blur transition-shadow duration-200">
            <h2 className={sectionTitleClass}>Section 3: Accused Details (if known)</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>Accused Name</label>
                <input type="text" name="name" value={accused.name} onChange={handleAccusedChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Relationship to Victim</label>
                <input type="text" name="relationship" value={accused.relationship} onChange={handleAccusedChange} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Address</label>
                <input type="text" name="address" value={accused.address} onChange={handleAccusedChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Mobile Number</label>
                <input type="tel" name="mobile" value={accused.mobile} onChange={handleAccusedChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Workplace</label>
                <input type="text" name="workplace" value={accused.workplace} onChange={handleAccusedChange} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Section 4: Incident Details */}
          <div className="card bg-white/95 backdrop-blur transition-shadow duration-200">
            <h2 className={sectionTitleClass}>Section 4: Incident Details</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>Date of Incident{requiredStar}</label>
                <input type="date" name="date" value={incident.date} onChange={handleIncidentChange} className={inputClass} />
                {errors.incidentDate && <p className="mt-1 text-[11px] text-alert">{errors.incidentDate}</p>}
              </div>
              <div>
                <label className={labelClass}>Time{requiredStar}</label>
                <input type="time" name="time" value={incident.time} onChange={handleIncidentChange} className={inputClass} />
                {errors.incidentTime && <p className="mt-1 text-[11px] text-alert">{errors.incidentTime}</p>}
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Location{requiredStar}</label>
                <input type="text" name="location" value={incident.location} onChange={handleIncidentChange} className={inputClass} />
                {errors.incidentLocation && <p className="mt-1 text-[11px] text-alert">{errors.incidentLocation}</p>}
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Detailed Description{requiredStar}</label>
                <AutoExpandTextarea name="description" value={incident.description} onChange={handleIncidentChange} rows={6} className={inputClass} placeholder="Describe what happened in detail. No word limit." />
                {errors.description && <p className="mt-1 text-[11px] text-alert">{errors.description}</p>}
              </div>
              <div>
                <label className={labelClass}>Any witnesses?</label>
                <select name="witnesses" value={incident.witnesses} onChange={handleIncidentChange} className={inputClass}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              {incident.witnesses === "yes" && (
                <div className="md:col-span-2">
                  <label className={labelClass}>Witness Details</label>
                  <AutoExpandTextarea name="witnessDetails" value={incident.witnessDetails} onChange={handleIncidentChange} rows={2} className={inputClass} />
                </div>
              )}
              <div>
                <label className={labelClass}>Was Police Informed?</label>
                <select name="policeInformed" value={incident.policeInformed} onChange={handleIncidentChange} className={inputClass}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              {incident.policeInformed === "yes" && (
                <>
                  <div>
                    <label className={labelClass}>FIR Number</label>
                    <input type="text" name="firNumber" value={incident.firNumber} onChange={handleIncidentChange} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Police Station</label>
                    <input type="text" name="policeStation" value={incident.policeStation} onChange={handleIncidentChange} className={inputClass} />
                  </div>
                </>
              )}
              <div>
                <label className={labelClass}>Any Medical Treatment Taken?</label>
                <select name="medicalTreatment" value={incident.medicalTreatment} onChange={handleIncidentChange} className={inputClass}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Evidence Upload */}
          <div className="card bg-white/95 backdrop-blur transition-shadow duration-200">
            <h2 className={sectionTitleClass}>Section 5: Evidence Upload</h2>
            <div className="space-y-2">
              <p className="text-xs text-slate-600">Photos, videos, audio, medical reports, chat screenshots, FIR copy.</p>
              <input
                type="file"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                multiple
                onChange={handleEvidenceChange}
                className="text-sm"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {evidencePreviews.map((url, idx) =>
                  url ? (
                    <div key={idx} className="relative">
                      <img src={url} alt={`Evidence ${idx + 1}`} className="h-20 w-20 rounded border object-cover" />
                      <button type="button" onClick={() => removeEvidence(idx)} className="absolute -right-1 -top-1 rounded-full bg-alert px-1.5 py-0.5 text-[10px] text-white">×</button>
                    </div>
                  ) : (
                    <div key={idx} className="flex h-20 w-20 items-center justify-center rounded border bg-slate-100 text-[10px] text-slate-500">
                      File {idx + 1}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Section 6: Emergency Alert */}
          {showEmergencyAlert && (
            <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-800">
                🚨 If immediate danger, dial 112 or Women Helpline 181.
              </p>
            </div>
          )}

          {/* Section 7: Declaration */}
          <div className="card bg-white/95 backdrop-blur transition-shadow duration-200">
            <h2 className={sectionTitleClass}>Section 7: Declaration</h2>
            <div className="flex items-center gap-2">
              <input
                id="declaration"
                type="checkbox"
                checked={declaration}
                onChange={(e) => setDeclaration(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <label htmlFor="declaration" className="text-sm font-medium text-slate-700">
                I declare that the information provided is true.<span className="text-alert"> *</span>
              </label>
            </div>
            {errors.declaration && <p className="mt-1 text-[11px] text-alert">{errors.declaration}</p>}
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary inline-flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting...
                </>
              ) : (
                "Submit Complaint"
              )}
            </button>
            <button type="button" onClick={handleSaveDraft} className="btn-secondary">Save Draft</button>
            <button type="button" onClick={handleGenerateSummary} disabled={summaryLoading} className="btn-secondary inline-flex items-center gap-2">
              {summaryLoading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Generating...
                </>
              ) : (
                "Generate AI Summary"
              )}
            </button>
            <button type="button" className="btn-secondary">Generate FIR Draft</button>
            <button type="button" className="btn-secondary">Download PDF</button>
            <button type="button" className="btn-secondary">Send to Women Cell Format</button>
          </div>

          {/* Status message (below submit button) */}
          <div ref={statusRef} className="min-h-[60px]">
            {submitStatus === "success" && (
              <div className="rounded-lg border-2 border-green-300 bg-green-50 p-4 text-green-800">
                <p className="font-semibold">{submitMessage}</p>
                {result?.trackingId && <p className="mt-1 text-sm">Tracking ID: <strong>{result.trackingId}</strong></p>}
                {result?.category && <p className="text-sm">Category: {result.category}</p>}
              </div>
            )}
            {submitStatus === "error" && (
              <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 text-red-800">
                <p className="font-semibold">{submitMessage}</p>
                {errors.submit && <p className="mt-1 text-sm">{errors.submit}</p>}
              </div>
            )}
            {submitMessage && submitStatus === "idle" && (
              <p className="text-sm text-slate-600">{submitMessage}</p>
            )}
          </div>

          {/* AI Summary box */}
          {(summaryText || summaryError) && (
            <div className={`card ${summaryError ? "border-red-200 bg-red-50/50" : "border-primary/20 bg-sky-50/50"}`}>
              <h3 className="text-sm font-semibold text-primary">AI Summary</h3>
              {summaryError && <p className="mt-2 text-sm text-alert">{summaryError}</p>}
              {summaryText && <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{summaryText}</div>}
            </div>
          )}
        </form>
      </div>
    </Layout>
  );
};

export default ReportHarassment;
