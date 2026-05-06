import React, { useState } from "react";
import Layout from "../components/Layout.jsx";
import api from "../api/client.js";

const inputClass =
  "mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors";
const labelClass = "block text-xs font-medium text-slate-700";
const requiredStar = <span className="text-alert"> *</span>;
const sectionTitleClass = "text-sm font-semibold text-primary border-b border-slate-200 pb-2 mb-3";

const MissingPerson = () => {
  const [reporter, setReporter] = useState({
    fullName: "",
    relationship: "",
    mobile: "",
    alternateContact: "",
    email: "",
    address: "",
    preferredContact: "Call",
  });
  const [missingPerson, setMissingPerson] = useState({
    fullName: "",
    nickname: "",
    gender: "",
    age: "",
    dob: "",
    height: "",
    weight: "",
    complexion: "",
    identifyingMarks: "",
    bloodGroup: "",
    medicalConditions: "",
    mentalHealth: "",
    lastSeenWearing: "",
  });
  const [lastSeen, setLastSeen] = useState({
    dateLastSeen: "",
    timeLastSeen: "",
    exactLocation: "",
    landmark: "",
    cityState: "",
    cctvNearby: "no",
    policeInformed: "no",
    firNumber: "",
    policeStationName: "",
  });
  const [circumstances, setCircumstances] = useState({
    type: "Unknown",
    suspectName: "",
    suspectVehicle: "",
    suspectDescription: "",
  });
  const [uploads, setUploads] = useState({
    recentPhoto: null,
    recentPhotoPreview: null,
    additionalPhotos: [],
    additionalPreviews: [],
    cctv: [],
    documents: [],
    firCopy: [],
  });
  const [allowPublicAlert, setAllowPublicAlert] = useState(false);
  const [declaration, setDeclaration] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleReporterChange = (e) => {
    const { name, value } = e.target;
    setReporter((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };
  const handleMissingPersonChange = (e) => {
    const { name, value } = e.target;
    setMissingPerson((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };
  const handleLastSeenChange = (e) => {
    const { name, value } = e.target;
    setLastSeen((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };
  const handleCircumstancesChange = (e) => {
    const { name, value } = e.target;
    setCircumstances((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleRecentPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploads((prev) => ({
      ...prev,
      recentPhoto: file,
      recentPhotoPreview: URL.createObjectURL(file),
    }));
    setErrors((prev) => ({ ...prev, recentPhoto: undefined }));
  };
  const handleAdditionalPhotos = (e) => {
    const files = Array.from(e.target.files || []);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setUploads((prev) => ({
      ...prev,
      additionalPhotos: [...prev.additionalPhotos, ...files],
      additionalPreviews: [...prev.additionalPreviews, ...newPreviews],
    }));
  };
  const removeAdditionalPreview = (idx) => {
    setUploads((prev) => {
      const np = [...prev.additionalPhotos];
      const nv = [...prev.additionalPreviews];
      if (prev.additionalPreviews[idx]) URL.revokeObjectURL(prev.additionalPreviews[idx]);
      np.splice(idx, 1);
      nv.splice(idx, 1);
      return { ...prev, additionalPhotos: np, additionalPreviews: nv };
    });
  };

  const validate = () => {
    const e = {};
    if (!reporter.fullName?.trim()) e.reporterFullName = "Full Name is required.";
    if (!reporter.relationship?.trim()) e.relationship = "Relationship to missing person is required.";
    if (!reporter.mobile?.trim()) e.mobile = "Mobile Number is required.";
    else if (!/^[0-9]{10}$/.test(reporter.mobile.trim())) e.mobile = "Enter a valid 10-digit number.";
    if (!reporter.address?.trim()) e.address = "Residential Address (City, State, PIN) is required.";

    if (!missingPerson.fullName?.trim()) e.missingFullName = "Missing person's full name is required.";
    if (!missingPerson.gender) e.gender = "Gender is required.";
    if (!missingPerson.age?.trim()) e.age = "Age is required.";
    else if (isNaN(Number(missingPerson.age)) || Number(missingPerson.age) < 0 || Number(missingPerson.age) > 150)
      e.age = "Enter a valid age.";
    if (!missingPerson.height?.trim()) e.height = "Height (cm) is required.";
    if (!missingPerson.complexion?.trim()) e.complexion = "Complexion is required.";
    if (!missingPerson.identifyingMarks?.trim()) e.identifyingMarks = "Identifying marks are required.";
    if (!missingPerson.lastSeenWearing?.trim()) e.lastSeenWearing = "Last seen wearing description is required.";

    if (!lastSeen.dateLastSeen) e.dateLastSeen = "Date last seen is required.";
    if (!lastSeen.timeLastSeen) e.timeLastSeen = "Time last seen is required.";
    if (!lastSeen.exactLocation?.trim()) e.exactLocation = "Exact location is required.";
    if (!lastSeen.landmark?.trim()) e.landmark = "Landmark is required.";
    if (!lastSeen.cityState?.trim()) e.cityState = "City & State is required.";
    if (lastSeen.policeInformed === "yes") {
      if (!lastSeen.firNumber?.trim()) e.firNumber = "FIR Number is required when police was informed.";
      if (!lastSeen.policeStationName?.trim()) e.policeStationName = "Police Station Name is required.";
    }

    if (!uploads.recentPhoto) e.recentPhoto = "Recent photograph is required.";
    if (!declaration) e.declaration = "You must confirm the information is true and accurate.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = () => {
    const desc = [
      `Relationship: ${reporter.relationship}.`,
      `Missing person: ${missingPerson.fullName}${missingPerson.nickname ? ` (${missingPerson.nickname})` : ""}, ${missingPerson.gender}, Age ${missingPerson.age}, DOB ${missingPerson.dob || "N/A"}, Height ${missingPerson.height} cm, Weight ${missingPerson.weight || "N/A"}, Complexion ${missingPerson.complexion}.`,
      `Identifying marks: ${missingPerson.identifyingMarks}. Blood group: ${missingPerson.bloodGroup || "N/A"}. Medical: ${missingPerson.medicalConditions || "N/A"}. Mental health: ${missingPerson.mentalHealth || "N/A"}.`,
      `Last seen wearing: ${missingPerson.lastSeenWearing}.`,
      `Last seen: ${lastSeen.dateLastSeen} at ${lastSeen.timeLastSeen}, Location: ${lastSeen.exactLocation}, Landmark: ${lastSeen.landmark}, City & State: ${lastSeen.cityState}. CCTV nearby: ${lastSeen.cctvNearby}. Police informed: ${lastSeen.policeInformed}${lastSeen.policeInformed === "yes" ? `, FIR: ${lastSeen.firNumber}, Station: ${lastSeen.policeStationName}` : ""}.`,
      `Suspected circumstances: ${circumstances.type}.${circumstances.type === "Kidnapping Suspected" ? ` Suspect: ${circumstances.suspectName || "N/A"}, Vehicle: ${circumstances.suspectVehicle || "N/A"}, Description: ${circumstances.suspectDescription || "N/A"}.` : ""}`,
    ].join(" ");
    return {
      fullName: missingPerson.fullName,
      age: missingPerson.age,
      gender: missingPerson.gender,
      lastSeenLocation: `${lastSeen.exactLocation}, ${lastSeen.landmark}, ${lastSeen.cityState}`,
      dateLastSeen: lastSeen.dateLastSeen,
      description: desc,
      contactName: reporter.fullName,
      contactPhone: reporter.mobile,
      contactEmail: reporter.email || undefined,
      relationship: reporter.relationship,
      alternateContact: reporter.alternateContact || undefined,
      address: reporter.address,
      preferredContact: reporter.preferredContact,
      allowPublicAlert,
      // Backend may ignore extra fields; description carries full detail
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = new FormData();
      const payload = buildPayload();
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== "") data.append(k, String(v));
      });
      if (uploads.recentPhoto) data.append("file", uploads.recentPhoto);
      const res = await api.post("/missing-person", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setErrors((prev) => ({
        ...prev,
        submit: err.response?.data?.message || "Failed to submit report. Please try again.",
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    const draft = { reporter, missingPerson, lastSeen, circumstances, allowPublicAlert };
    localStorage.setItem("missingPersonDraft", JSON.stringify(draft));
    setResult(null);
    setErrors((prev) => ({ ...prev, submit: undefined }));
    setTimeout(() => setErrors((prev) => ({ ...prev, submit: "Draft saved locally." })), 0);
    setTimeout(() => setErrors((prev) => ({ ...prev, submit: undefined })), 3000);
  };

  const alertLink = result?.id ? `${window.location.origin}/missing-alert/${result.id}` : null;
  const pdfUrl = result?.id ? `${window.location.origin}/missing-person/${result.id}/pdf` : null;

  return (
    <Layout>
      <div className="w-full space-y-4">
        <h1 className="text-xl font-semibold text-primary">Missing Person Report Form</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Submit a detailed missing person report. After admin approval, the alert will be published and you can share the public link and download the poster PDF.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Section 1: Reporter Information */}
          <div className="card bg-white/95 backdrop-blur transition-shadow duration-200">
            <h2 className={sectionTitleClass}>Section 1: Reporter Information</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>Full Name{requiredStar}</label>
                <input type="text" name="fullName" value={reporter.fullName} onChange={handleReporterChange} className={inputClass} />
                {errors.reporterFullName && <p className="mt-1 text-[11px] text-alert">{errors.reporterFullName}</p>}
              </div>
              <div>
                <label className={labelClass}>Relationship to Missing Person{requiredStar}</label>
                <input type="text" name="relationship" value={reporter.relationship} onChange={handleReporterChange} className={inputClass} placeholder="e.g. Parent, Sibling" />
                {errors.relationship && <p className="mt-1 text-[11px] text-alert">{errors.relationship}</p>}
              </div>
              <div>
                <label className={labelClass}>Mobile Number{requiredStar}</label>
                <input type="tel" name="mobile" value={reporter.mobile} onChange={handleReporterChange} className={inputClass} maxLength={10} />
                {errors.mobile && <p className="mt-1 text-[11px] text-alert">{errors.mobile}</p>}
              </div>
              <div>
                <label className={labelClass}>Alternate Contact Number</label>
                <input type="tel" name="alternateContact" value={reporter.alternateContact} onChange={handleReporterChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email Address</label>
                <input type="email" name="email" value={reporter.email} onChange={handleReporterChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Preferred Contact Mode</label>
                <select name="preferredContact" value={reporter.preferredContact} onChange={handleReporterChange} className={inputClass}>
                  <option value="Call">Call</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Email">Email</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Residential Address (City, State, PIN Code){requiredStar}</label>
                <textarea name="address" value={reporter.address} onChange={handleReporterChange} rows={2} className={inputClass} />
                {errors.address && <p className="mt-1 text-[11px] text-alert">{errors.address}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Missing Person Details */}
          <div className="card bg-white/95 backdrop-blur transition-shadow duration-200">
            <h2 className={sectionTitleClass}>Section 2: Missing Person Details</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>Full Name{requiredStar}</label>
                <input type="text" name="fullName" value={missingPerson.fullName} onChange={handleMissingPersonChange} className={inputClass} />
                {errors.missingFullName && <p className="mt-1 text-[11px] text-alert">{errors.missingFullName}</p>}
              </div>
              <div>
                <label className={labelClass}>Nickname (if any)</label>
                <input type="text" name="nickname" value={missingPerson.nickname} onChange={handleMissingPersonChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Gender{requiredStar}</label>
                <select name="gender" value={missingPerson.gender} onChange={handleMissingPersonChange} className={inputClass}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && <p className="mt-1 text-[11px] text-alert">{errors.gender}</p>}
              </div>
              <div>
                <label className={labelClass}>Age{requiredStar}</label>
                <input type="number" name="age" min={0} max={150} value={missingPerson.age} onChange={handleMissingPersonChange} className={inputClass} />
                {errors.age && <p className="mt-1 text-[11px] text-alert">{errors.age}</p>}
              </div>
              <div>
                <label className={labelClass}>Date of Birth</label>
                <input type="date" name="dob" value={missingPerson.dob} onChange={handleMissingPersonChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Height (in cm){requiredStar}</label>
                <input type="text" name="height" value={missingPerson.height} onChange={handleMissingPersonChange} className={inputClass} placeholder="e.g. 165" />
                {errors.height && <p className="mt-1 text-[11px] text-alert">{errors.height}</p>}
              </div>
              <div>
                <label className={labelClass}>Weight (approx)</label>
                <input type="text" name="weight" value={missingPerson.weight} onChange={handleMissingPersonChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Complexion{requiredStar}</label>
                <input type="text" name="complexion" value={missingPerson.complexion} onChange={handleMissingPersonChange} className={inputClass} placeholder="e.g. Fair, Wheatish" />
                {errors.complexion && <p className="mt-1 text-[11px] text-alert">{errors.complexion}</p>}
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Identifying Marks (tattoo, scar, birthmark){requiredStar}</label>
                <textarea name="identifyingMarks" value={missingPerson.identifyingMarks} onChange={handleMissingPersonChange} rows={2} className={inputClass} />
                {errors.identifyingMarks && <p className="mt-1 text-[11px] text-alert">{errors.identifyingMarks}</p>}
              </div>
              <div>
                <label className={labelClass}>Blood Group (if known)</label>
                <input type="text" name="bloodGroup" value={missingPerson.bloodGroup} onChange={handleMissingPersonChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Medical Conditions (if any)</label>
                <input type="text" name="medicalConditions" value={missingPerson.medicalConditions} onChange={handleMissingPersonChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Mental Health Condition (if any)</label>
                <input type="text" name="mentalHealth" value={missingPerson.mentalHealth} onChange={handleMissingPersonChange} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Last Seen Wearing (detailed description){requiredStar}</label>
                <textarea name="lastSeenWearing" value={missingPerson.lastSeenWearing} onChange={handleMissingPersonChange} rows={2} className={inputClass} />
                {errors.lastSeenWearing && <p className="mt-1 text-[11px] text-alert">{errors.lastSeenWearing}</p>}
              </div>
            </div>
          </div>

          {/* Section 3: Last Seen Information */}
          <div className="card bg-white/95 backdrop-blur transition-shadow duration-200">
            <h2 className={sectionTitleClass}>Section 3: Last Seen Information</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className={labelClass}>Date Last Seen{requiredStar}</label>
                <input type="date" name="dateLastSeen" value={lastSeen.dateLastSeen} onChange={handleLastSeenChange} className={inputClass} />
                {errors.dateLastSeen && <p className="mt-1 text-[11px] text-alert">{errors.dateLastSeen}</p>}
              </div>
              <div>
                <label className={labelClass}>Time Last Seen{requiredStar}</label>
                <input type="time" name="timeLastSeen" value={lastSeen.timeLastSeen} onChange={handleLastSeenChange} className={inputClass} />
                {errors.timeLastSeen && <p className="mt-1 text-[11px] text-alert">{errors.timeLastSeen}</p>}
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Exact Location{requiredStar}</label>
                <input type="text" name="exactLocation" value={lastSeen.exactLocation} onChange={handleLastSeenChange} className={inputClass} />
                {errors.exactLocation && <p className="mt-1 text-[11px] text-alert">{errors.exactLocation}</p>}
              </div>
              <div>
                <label className={labelClass}>Landmark{requiredStar}</label>
                <input type="text" name="landmark" value={lastSeen.landmark} onChange={handleLastSeenChange} className={inputClass} />
                {errors.landmark && <p className="mt-1 text-[11px] text-alert">{errors.landmark}</p>}
              </div>
              <div>
                <label className={labelClass}>City & State{requiredStar}</label>
                <input type="text" name="cityState" value={lastSeen.cityState} onChange={handleLastSeenChange} className={inputClass} />
                {errors.cityState && <p className="mt-1 text-[11px] text-alert">{errors.cityState}</p>}
              </div>
              <div>
                <label className={labelClass}>Was CCTV nearby?</label>
                <select name="cctvNearby" value={lastSeen.cctvNearby} onChange={handleLastSeenChange} className={inputClass}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Was Police Informed?</label>
                <select name="policeInformed" value={lastSeen.policeInformed} onChange={handleLastSeenChange} className={inputClass}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              {lastSeen.policeInformed === "yes" && (
                <>
                  <div>
                    <label className={labelClass}>FIR Number{requiredStar}</label>
                    <input type="text" name="firNumber" value={lastSeen.firNumber} onChange={handleLastSeenChange} className={inputClass} />
                    {errors.firNumber && <p className="mt-1 text-[11px] text-alert">{errors.firNumber}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Police Station Name{requiredStar}</label>
                    <input type="text" name="policeStationName" value={lastSeen.policeStationName} onChange={handleLastSeenChange} className={inputClass} />
                    {errors.policeStationName && <p className="mt-1 text-[11px] text-alert">{errors.policeStationName}</p>}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 4: Suspected Circumstances */}
          <div className="card bg-white/95 backdrop-blur transition-shadow duration-200">
            <h2 className={sectionTitleClass}>Section 4: Suspected Circumstances</h2>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Circumstance Type</label>
                <select name="type" value={circumstances.type} onChange={handleCircumstancesChange} className={inputClass}>
                  <option value="Voluntary Missing">Voluntary Missing</option>
                  <option value="Kidnapping Suspected">Kidnapping Suspected</option>
                  <option value="Family Dispute">Family Dispute</option>
                  <option value="Mental Health Episode">Mental Health Episode</option>
                  <option value="Trafficking Suspected">Trafficking Suspected</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
              {circumstances.type === "Kidnapping Suspected" && (
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Suspect Name (if known)</label>
                    <input type="text" name="suspectName" value={circumstances.suspectName} onChange={handleCircumstancesChange} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Suspect Vehicle Number</label>
                    <input type="text" name="suspectVehicle" value={circumstances.suspectVehicle} onChange={handleCircumstancesChange} className={inputClass} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Suspect Description</label>
                    <textarea name="suspectDescription" value={circumstances.suspectDescription} onChange={handleCircumstancesChange} rows={2} className={inputClass} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Upload Section */}
          <div className="card bg-white/95 backdrop-blur transition-shadow duration-200">
            <h2 className={sectionTitleClass}>Section 5: Upload Section</h2>
            <p className="mb-3 text-xs text-slate-600">
              Ensure the latest clear photograph is uploaded for better search visibility.
            </p>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Recent Photograph (Required){requiredStar}</label>
                <input type="file" accept="image/*" onChange={handleRecentPhoto} className="mt-1 text-sm" />
                {errors.recentPhoto && <p className="mt-1 text-[11px] text-alert">{errors.recentPhoto}</p>}
                {uploads.recentPhotoPreview && (
                  <div className="mt-2">
                    <img src={uploads.recentPhotoPreview} alt="Recent" className="h-24 w-24 rounded border object-cover" />
                  </div>
                )}
              </div>
              <div>
                <label className={labelClass}>Additional Photos</label>
                <input type="file" accept="image/*" multiple onChange={handleAdditionalPhotos} className="mt-1 text-sm" />
                <div className="mt-2 flex flex-wrap gap-2">
                  {uploads.additionalPreviews.map((url, idx) => (
                    <div key={idx} className="relative">
                      <img src={url} alt={`Extra ${idx + 1}`} className="h-20 w-20 rounded border object-cover" />
                      <button type="button" onClick={() => removeAdditionalPreview(idx)} className="absolute -right-1 -top-1 rounded-full bg-alert px-1.5 py-0.5 text-[10px] text-white">×</button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>CCTV Footage</label>
                <input type="file" accept="video/*" className="mt-1 text-sm" />
              </div>
              <div>
                <label className={labelClass}>Documents</label>
                <input type="file" accept=".pdf,.doc,.docx,image/*" multiple className="mt-1 text-sm" />
              </div>
              <div>
                <label className={labelClass}>FIR Copy</label>
                <input type="file" accept=".pdf,image/*" className="mt-1 text-sm" />
              </div>
            </div>
          </div>

          {/* Section 6: Public Alert Toggle */}
          <div className="card bg-white/95 backdrop-blur transition-shadow duration-200">
            <h2 className={sectionTitleClass}>Section 6: Public Alert</h2>
            <div className="flex items-center gap-2">
              <input
                id="allowPublicAlert"
                type="checkbox"
                checked={allowPublicAlert}
                onChange={(e) => setAllowPublicAlert(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <label htmlFor="allowPublicAlert" className="text-sm font-medium text-slate-700">
                Allow public alert poster generation
              </label>
            </div>
            {allowPublicAlert && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="btn-secondary text-sm">Generate Missing Poster</button>
                <button type="button" className="btn-secondary text-sm">Shareable Public Link</button>
              </div>
            )}
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
                I confirm that the above information is true and accurate.<span className="text-alert"> *</span>
              </label>
            </div>
            {errors.declaration && <p className="mt-1 text-[11px] text-alert">{errors.declaration}</p>}
          </div>

          {/* Final buttons */}
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Submitting..." : "Submit Report"}
            </button>
            <button type="button" onClick={handleSaveDraft} className="btn-secondary">Save Draft</button>
            <button type="button" className="btn-secondary">Generate Missing Poster</button>
            <button type="button" className="btn-secondary">Download PDF</button>
            <button type="button" className="btn-secondary">Share Public Alert Link</button>
          </div>

          {errors.submit && <p className="text-sm text-alert">{errors.submit}</p>}

          {result && (
            <div className="card border-primary/30 bg-sky-50/50">
              <p className="font-semibold text-slate-800">Report submitted successfully. Status: {result.status}.</p>
              <p className="mt-2 text-slate-700">After admin approval, your alert will be live at:</p>
              {alertLink && <p className="mt-1 break-all font-mono text-xs text-primary">{alertLink}</p>}
            </div>
          )}
        </form>
      </div>
    </Layout>
  );
};

export default MissingPerson;
