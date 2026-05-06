import React, { useRef } from "react";

const PosterPreviewModal = ({ data, onClose }) => {
  const posterRef = useRef(null);
  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/public/missing/${data.caseId}`
    : "";
  const qrSrc = publicUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(publicUrl)}`
    : "";

  const handleDownloadPNG = async () => {
    try {
      const html2canvas = (await import("html2canvas")).default;
      const el = posterRef.current;
      if (!el) return;
      const canvas = await html2canvas(el, {
        useCORS: true,
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `missing-person-${data.caseId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("PNG download failed:", err);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const el = posterRef.current;
      if (!el) return;
      const canvas = await html2canvas(el, {
        useCORS: true,
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const w = pdf.internal.pageSize.getWidth();
      const h = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, "PNG", 0, 0, w, h);
      pdf.save(`missing-person-${data.caseId}.pdf`);
    } catch (err) {
      console.error("PDF download failed:", err);
    }
  };

  const handleShareLink = () => {
    if (!publicUrl) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(publicUrl).then(() => alert("Link copied to clipboard."));
    } else {
      prompt("Copy this link:", publicUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-end gap-2 border-b border-slate-200 bg-slate-50 p-3">
          <button type="button" onClick={handleDownloadPNG} className="btn-secondary text-sm">
            Download PNG
          </button>
          <button type="button" onClick={handleDownloadPDF} className="btn-secondary text-sm">
            Download PDF
          </button>
          <button type="button" onClick={handleShareLink} className="btn-secondary text-sm">
            Share Public Link
          </button>
          <button type="button" onClick={onClose} className="btn-primary text-sm">
            Close
          </button>
        </div>

        <div className="p-4">
          <div
            ref={posterRef}
            className="mx-auto w-full max-w-[210mm] rounded border-4 border-red-600 bg-white p-6 shadow-lg print:border-2"
            style={{ minHeight: "297mm" }}
          >
            {/* Header */}
            <h1 className="mb-4 text-center text-2xl font-bold uppercase tracking-wide text-red-600">
              Missing Person Alert
            </h1>

            <div className="flex flex-col gap-4 sm:flex-row">
              {/* Left: Photo + basic info */}
              <div className="flex shrink-0 flex-col items-center sm:w-2/5">
                <div className="flex h-48 w-40 items-center justify-center overflow-hidden rounded border-2 border-slate-300 bg-slate-100">
                  {data.photoPreview ? (
                    <img
                      src={data.photoPreview}
                      alt={data.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">No photo</span>
                  )}
                </div>
                <div className="mt-3 w-full text-left text-sm">
                  <p><strong>Name:</strong> {data.name || "—"}</p>
                  <p><strong>Age:</strong> {data.age || "—"}</p>
                  <p><strong>Gender:</strong> {data.gender || "—"}</p>
                  <p><strong>Height:</strong> {data.height ? `${data.height} cm` : "—"}</p>
                  <p><strong>Identifying Marks:</strong> {data.identifyingMarks || "—"}</p>
                </div>
              </div>

              {/* Right: Last seen + circumstances */}
              <div className="flex-1 text-sm">
                <p><strong>Last Seen Date:</strong> {data.dateLastSeen || "—"}</p>
                <p><strong>Location:</strong> {data.location || "—"}</p>
                <p className="mt-2"><strong>Clothing:</strong> {data.clothing || "—"}</p>
                <p className="mt-2"><strong>Circumstances:</strong> {data.circumstances || "—"}</p>
                {(data.firNumber || data.policeStationName) && (
                  <p className="mt-2"><strong>FIR:</strong> {data.firNumber || ""} {data.policeStationName ? `- ${data.policeStationName}` : ""}</p>
                )}
              </div>
            </div>

            {/* Bottom: Contact + QR */}
            <div className="mt-6 flex flex-wrap items-end justify-between border-t-2 border-red-200 pt-4">
              <div className="text-sm">
                <p><strong>Reporter Contact:</strong> {data.reporterContact || "—"}</p>
                <p><strong>Emergency:</strong> 112</p>
                <p><strong>Case ID:</strong> {data.caseId}</p>
              </div>
              {qrSrc && (
                <div className="flex flex-col items-center">
                  <img src={qrSrc} alt="QR Code" className="h-[120px] w-[120px] border border-slate-200" />
                  <span className="mt-1 text-[10px] text-slate-500">Scan for details</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PosterPreviewModal;
