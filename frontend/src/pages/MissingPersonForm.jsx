import React, { useState } from "react";
import Layout from "../components/Layout.jsx";
import PosterPreviewModal from "../components/PosterPreviewModal.jsx";
import api from "../api/client.js";

const inputClass =
  "mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors";
const labelClass = "block text-xs font-medium text-slate-700";
const requiredStar = <span className="text-alert"> *</span>;
const sectionTitleClass = "text-sm font-semibold text-primary border-b border-slate-200 pb-2 mb-3";

const RELATIONSHIP_OPTIONS = [
  "Parent",
  "Sibling",
  "Spouse",
  "Child",
  "Guardian",
  "Friend",
  "Other",
];

const MissingPersonForm = () => {
  const [complainant, setComplainant] = useState({
    fullName: "",
    mobile: "",
    email: "",
    address: "",
    relationship: "",
    preferredContact: "Call",
  });
  const [missingPerson, setMissingPerson] = useState({
    fullName: "",
    gender: "",
    age: "",
    dob: "",
    height: "",
    weight: "",
    complexion: "",
    identifyingMarks: "",
    photo: null,
    photoPreview: null,
    idNumber: "",
    mentalPhysicalCondition: "",
    carryingMobile: "no",
    mobileNumber: "",
  });
  const [lastSeen, setLastSeen] = useState({
    dateLastSeen: "",
    timeLastSeen: "",
    locationLastSeen: "",
    landmark: "",
    lastSeenWith: "",
    clothingDescription: "",
    circumstancesDisappearance: "",
  });
  const [additional, setAdditional] = useState({
    kidnappingSuspected: "no",
    knownThreats: "no",
    suspectedPersonName: "",
    suspectContact: "",
    socialMediaAccounts: "",
    recentPhoto: null,
    recentPhotoPreview: null,
  });
  const [police, setPolice] = useState({
    reported: "no",
    firNumber: "",
    policeStationName: "",
    firDate: "",
  });
  const [supportingFiles, setSupportingFiles] = useState([]);
  const [declaration, setDeclaration] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [posterOpen, setPosterOpen] = useState(false);
  const [caseId, setCaseId] = useState(() => "MP-" + Date.now());

  const handleComplainant = (e) => {
    const { name, value } = e.target;
    setComplainant((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };
  const handleMissingPerson = (e) => {
    const { name, value } = e.target;
    setMissingPerson((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };
  const handleLastSeen = (e) => {
    const { name, value } = e.target;
    setLastSeen((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };
  const handleAdditional = (e) => {
    const { name, value } = e.target;
    setAdditional((prev) => ({ ...prev, [name]: value }));
  };
  const handlePolice = (e) => {
    const { name, value } = e.target;
    setPolice((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const onPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMissingPerson((prev) => ({
      ...prev,
      photo: file,
      photoPreview: URL.createObjectURL(file),
    }));
    setErrors((prev) => ({ ...prev, photo: undefined }));
  };
  const onRecentPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAdditional((prev) => ({
      ...prev,
      recentPhoto: file,
      recentPhotoPreview: URL.createObjectURL(file),
    }));
  };
  const onSupportingChange = (e) => {
    setSupportingFiles(Array.from(e.target.files || []));
  };

  const validate = () => {
    const e = {};
    if (!complainant.fullName?.trim()) e.complainantFullName = "Full Name is required.";
    if (!complainant.mobile?.trim()) e.complainantMobile = "Mobile Number is required.";
    else if (!/^[0-9]{10}$/.test(complainant.mobile.trim())) e.complainantMobile = "Enter a valid 10-digit number.";
    if (!missingPerson.fullName?.trim()) e.missingFullName = "Missing person's full name is required.";
    if (!missingPerson.photo) e.photo = "Photograph upload is required.";
    if (!lastSeen.dateLastSeen) e.dateLastSeen = "Date last seen is required.";
    if (!lastSeen.locationLastSeen?.trim()) e.locationLastSeen = "Location last seen is required.";
    if (police.reported === "yes") {
      if (!police.firNumber?.trim()) e.firNumber = "FIR Number is required.";
      if (!police.policeStationName?.trim()) e.policeStationName = "Police Station Name is required.";
      if (!police.firDate) e.firDate = "FIR Date is required.";
    }
    if (!declaration) e.declaration = "You must confirm the information is true.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = () => ({
    complainant,
    missingPerson: {
      ...missingPerson,
      photo: undefined,
      photoPreview: undefined,
    },
    lastSeen,
    additional: {
      ...additional,
      recentPhoto: undefined,
      recentPhotoPreview: undefined,
    },
    police,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("fullName", missingPerson.fullName);
      formData.append("age", missingPerson.age || "");
      formData.append("gender", missingPerson.gender || "");
      formData.append("lastSeenLocation", lastSeen.locationLastSeen);
      formData.append("dateLastSeen", lastSeen.dateLastSeen);
      formData.append("description", [
        lastSeen.clothingDescription,
        lastSeen.circumstancesDisappearance,
        `Landmark: ${lastSeen.landmark}. Last seen with: ${lastSeen.lastSeenWith}.`,
      ].filter(Boolean).join(" "));
      formData.append("contactName", complainant.fullName);
      formData.append("contactPhone", complainant.mobile);
      formData.append("contactEmail", complainant.email || "");
      if (missingPerson.photo) formData.append("file", missingPerson.photo);

      const res = await api.post("/missing-person", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      if (res.data?.id) setCaseId("MP-" + res.data.id);
    } catch (err) {
      console.error(err);
      setErrors((prev) => ({
        ...prev,
        submit: err.response?.data?.message || "Failed to submit. Please try again.",
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    const draft = { complainant, missingPerson: { ...missingPerson, photo: null, photoPreview: null }, lastSeen, additional: { ...additional, recentPhoto: null, recentPhotoPreview: null }, police };
    localStorage.setItem("missingPersonFormDraft", JSON.stringify(draft));
    setErrors((prev) => ({ ...prev, submit: "Draft saved locally." }));
    setTimeout(() => setErrors((prev) => ({ ...prev, submit: undefined })), 3000);
  };

  const posterData = {
    caseId,
    name: missingPerson.fullName,
    age: missingPerson.age,
    gender: missingPerson.gender,
    height: missingPerson.height,
    identifyingMarks: missingPerson.identifyingMarks,
    photoPreview: missingPerson.photoPreview,
    dateLastSeen: lastSeen.dateLastSeen,
    location: lastSeen.locationLastSeen,
    clothing: lastSeen.clothingDescription,
    circumstances: lastSeen.circumstancesDisappearance,
    firNumber: police.firNumber,
    policeStationName: police.policeStationName,
    reporterContact: complainant.mobile,
  };

  return (
    <Layout>
      <div className="w-full space-y-4">
        <h1 className="text-xl font-semibold text-primary">Missing Person Report Form</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Submit a detailed missing person report. No word limits on description fields.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Section 1: Complainant / Reporter Details */}
          <div className="card bg-white/95 backdrop-blur transition-shadow duration-200">
            <h2 className={sectionTitleClass}>Section 1: Complainant / Reporter Details</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>Full Name{requiredStar}</label>
                <input type="text" name="fullName" value={complainant.fullName} onChange={handleComplainant} className={inputClass} />
                {errors.complainantFullName && <p className="mt-1 text-[11px] text-alert">{errors.complainantFullName}</p>}
              </div>
              <div>
                <label className={labelClass}>Mobile Number{requiredStar}</label>
                <input type="tel" name="mobile" value={complainant.mobile} onChange={handleComplainant} className={inputClass} maxLength={10} />
                {errors.complainantMobile && <p className="mt-1 text-[11px] text-alert">{errors.complainantMobile}</p>}
              </div>
              <div>
                <label className={labelClass}>Email Address</label>
                <input type="email" name="email" value={complainant.email} onChange={handleComplainant} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Residential Address (City, State, PIN Code)</label>
                <input type="text" name="address" value={complainant.address} onChange={handleComplainant} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Relationship to Missing Person</label>
                <select name="relationship" value={complainant.relationship} onChange={handleComplainant} className={inputClass}>
                  <option value="">Select</option>
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Preferred Mode of Contact</label>
                <select name="preferredContact" value={complainant.preferredContact} onChange={handleComplainant} className={inputClass}>
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                  <option value="WhatsApp">WhatsApp</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Missing Person Information */}
          <div className="card bg-white/95 backdrop-blur transition-shadow duration-200">
            <h2 className={sectionTitleClass}>Section 2: Missing Person Information</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>Full Name{requiredStar}</label>
                <input type="text" name="fullName" value={missingPerson.fullName} onChange={handleMissingPerson} className={inputClass} />
                {errors.missingFullName && <p className="mt-1 text-[11px] text-alert">{errors.missingFullName}</p>}
              </div>
              <div>
                <label className={labelClass}>Gender</label>
                <select name="gender" value={missingPerson.gender} onChange={handleMissingPerson} className={inputClass}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Age</label>
                <input type="number" name="age" min={0} max={150} value={missingPerson.age} onChange={handleMissingPerson} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Date of Birth</label>
                <input type="date" name="dob" value={missingPerson.dob} onChange={handleMissingPerson} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Height (cm)</label>
                <input type="text" name="height" value={missingPerson.height} onChange={handleMissingPerson} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Weight</label>
                <input type="text" name="weight" value={missingPerson.weight} onChange={handleMissingPerson} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Complexion</label>
                <input type="text" name="complexion" value={missingPerson.complexion} onChange={handleMissingPerson} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Identifying Marks</label>
                <input type="text" name="identifyingMarks" value={missingPerson.identifyingMarks} onChange={handleMissingPerson} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Photograph Upload (Required){requiredStar}</label>
                <input type="file" accept="image/*" onChange={onPhotoChange} className="mt-1 text-sm" />
                {errors.photo && <p className="mt-1 text-[11px] text-alert">{errors.photo}</p>}
                {missingPerson.photoPreview && (
                  <img src={missingPerson.photoPreview} alt="Upload" className="mt-2 h-24 w-24 rounded border object-cover" />
                )}
              </div>
              <div>
                <label className={labelClass}>Aadhar / ID Number (Optional)</label>
                <input type="text" name="idNumber" value={missingPerson.idNumber} onChange={handleMissingPerson} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Mental or Physical Condition</label>
                <input type="text" name="mentalPhysicalCondition" value={missingPerson.mentalPhysicalCondition} onChange={handleMissingPerson} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Was carrying mobile phone?</label>
                <select name="carryingMobile" value={missingPerson.carryingMobile} onChange={handleMissingPerson} className={inputClass}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              {missingPerson.carryingMobile === "yes" && (
                <div>
                  <label className={labelClass}>Mobile Number</label>
                  <input type="tel" name="mobileNumber" value={missingPerson.mobileNumber} onChange={handleMissingPerson} className={inputClass} />
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Last Seen Information */}
          <div className="card bg-white/95 backdrop-blur transition-shadow duration-200">
            <h2 className={sectionTitleClass}>Section 3: Last Seen Information</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>Date Last Seen{requiredStar}</label>
                <input type="date" name="dateLastSeen" value={lastSeen.dateLastSeen} onChange={handleLastSeen} className={inputClass} />
                {errors.dateLastSeen && <p className="mt-1 text-[11px] text-alert">{errors.dateLastSeen}</p>}
              </div>
              <div>
                <label className={labelClass}>Time Last Seen</label>
                <input type="time" name="timeLastSeen" value={lastSeen.timeLastSeen} onChange={handleLastSeen} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Location Last Seen{requiredStar}</label>
                <input type="text" name="locationLastSeen" value={lastSeen.locationLastSeen} onChange={handleLastSeen} className={inputClass} />
                {errors.locationLastSeen && <p className="mt-1 text-[11px] text-alert">{errors.locationLastSeen}</p>}
              </div>
              <div>
                <label className={labelClass}>Landmark</label>
                <input type="text" name="landmark" value={lastSeen.landmark} onChange={handleLastSeen} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Last Seen With</label>
                <input type="text" name="lastSeenWith" value={lastSeen.lastSeenWith} onChange={handleLastSeen} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Clothing Description</label>
                <textarea name="clothingDescription" value={lastSeen.clothingDescription} onChange={handleLastSeen} rows={4} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Circumstances of Disappearance</label>
                <textarea name="circumstancesDisappearance" value={lastSeen.circumstancesDisappearance} onChange={handleLastSeen} rows={4} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Section 4: Additional Information */}
          <div className="card bg-white/95 backdrop-blur transition-shadow duration-200">
            <h2 className={sectionTitleClass}>Section 4: Additional Information</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>Is kidnapping suspected?</label>
                <select name="kidnappingSuspected" value={additional.kidnappingSuspected} onChange={handleAdditional} className={inputClass}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                  <option value="not_sure">Not Sure</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Known threats/disputes?</label>
                <select name="knownThreats" value={additional.knownThreats} onChange={handleAdditional} className={inputClass}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Suspected Person Name</label>
                <input type="text" name="suspectedPersonName" value={additional.suspectedPersonName} onChange={handleAdditional} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Suspect Contact</label>
                <input type="text" name="suspectContact" value={additional.suspectContact} onChange={handleAdditional} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Social Media Accounts</label>
                <input type="text" name="socialMediaAccounts" value={additional.socialMediaAccounts} onChange={handleAdditional} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Recent Photograph Upload (optional)</label>
                <input type="file" accept="image/*" onChange={onRecentPhotoChange} className="mt-1 text-sm" />
                {additional.recentPhotoPreview && (
                  <img src={additional.recentPhotoPreview} alt="Recent" className="mt-2 h-20 w-20 rounded border object-cover" />
                )}
              </div>
            </div>
          </div>

          {/* Section 5: Police Reporting Information */}
          <div className="card bg-white/95 backdrop-blur transition-shadow duration-200">
            <h2 className={sectionTitleClass}>Section 5: Police Reporting Information</h2>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Has incident been reported?</label>
                <select name="reported" value={police.reported} onChange={handlePolice} className={inputClass}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              {police.reported === "yes" && (
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>FIR Number</label>
                    <input type="text" name="firNumber" value={police.firNumber} onChange={handlePolice} className={inputClass} />
                    {errors.firNumber && <p className="mt-1 text-[11px] text-alert">{errors.firNumber}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Police Station Name</label>
                    <input type="text" name="policeStationName" value={police.policeStationName} onChange={handlePolice} className={inputClass} />
                    {errors.policeStationName && <p className="mt-1 text-[11px] text-alert">{errors.policeStationName}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>FIR Date</label>
                    <input type="date" name="firDate" value={police.firDate} onChange={handlePolice} className={inputClass} />
                    {errors.firDate && <p className="mt-1 text-[11px] text-alert">{errors.firDate}</p>}
                  </div>
                </div>
              )}
              {police.reported === "no" && (
                <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-800">
                    🚨 If a person is missing, immediately report to nearest police station or dial 112.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 6: Upload Supporting Documents */}
          <div className="card bg-white/95 backdrop-blur transition-shadow duration-200">
            <h2 className={sectionTitleClass}>Section 6: Upload Supporting Documents</h2>
            <div className="space-y-2">
              <p className="text-xs text-slate-600">Photos, FIR Copy, ID Proof, CCTV, Other Documents</p>
              <input type="file" accept="image/*,.pdf,video/*" multiple onChange={onSupportingChange} className="text-sm" />
              {supportingFiles.length > 0 && <p className="text-xs text-slate-500">{supportingFiles.length} file(s) selected</p>}
            </div>
          </div>

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
                I confirm that the information provided is true.<span className="text-alert"> *</span>
              </label>
            </div>
            {errors.declaration && <p className="mt-1 text-[11px] text-alert">{errors.declaration}</p>}
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Submitting..." : "Submit Complaint"}
            </button>
            <button type="button" onClick={handleSaveDraft} className="btn-secondary">Save Draft</button>
            <button type="button" className="btn-secondary">Generate Missing Person Report (AI Summary)</button>
            <button type="button" className="btn-secondary">Download Complaint as PDF</button>
            <button type="button" onClick={() => setPosterOpen(true)} className="btn-secondary">Print Poster Format</button>
          </div>

          {errors.submit && <p className="text-sm text-alert">{errors.submit}</p>}

          {result && (
            <div className="card border-primary/30 bg-sky-50/50">
              <p className="font-semibold text-slate-800">Report submitted successfully. Status: {result.status}.</p>
              {result.id && <p className="mt-1 text-xs text-slate-600">Case ID: MP-{result.id}</p>}
            </div>
          )}
        </form>

        {posterOpen && (
          <PosterPreviewModal
            data={posterData}
            onClose={() => setPosterOpen(false)}
          />
        )}
      </div>
    </Layout>
  );
};

export default MissingPersonForm;
