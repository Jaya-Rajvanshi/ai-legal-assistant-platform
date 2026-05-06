import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import api from "../api/client.js";

const MissingAlert = () => {
  const { id } = useParams();
  const [alert, setAlert] = useState(null);
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await api.get(`/missing-person/${id}`);
        if (!cancelled) setAlert(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message || "Alert not found or not yet approved."
          );
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const pdfUrl = id ? `${baseUrl}/missing-person/${id}/pdf` : null;

  const handleShare = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };


  const dateStr = alert?.dateLastSeen
    ? new Date(alert.dateLastSeen).toLocaleDateString()
    : "—";

  return (
    <Layout>
      <div className="mx-auto w-full max-w-xl">
        {error && (
          <div className="card border-l-4 border-l-alert">
            <p className="text-sm text-alert">{error}</p>
          </div>
        )}
        {alert && (
          <div className="card space-y-4">
            <h1 className="text-xl font-semibold text-primary">
              Missing Person Alert
            </h1>
            {alert.photo && (
              <img
                src={alert.photo}
                alt={alert.fullName}
                className="h-64 w-full rounded object-cover"
              />
            )}
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {alert.fullName}
              </p>
              <p className="text-sm text-slate-600">
                Age: {alert.age != null ? alert.age : "—"}
                {alert.gender ? ` • ${alert.gender}` : ""}
              </p>
            </div>
            <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-slate-700">
                <span className="font-medium">Last seen:</span>{" "}
                {alert.lastSeenLocation || "—"} on {dateStr}
              </p>
              <p className="mt-2 text-slate-700">
                <span className="font-medium">Contact:</span>{" "}
                {alert.contactName} – {alert.contactPhone}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Description</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                {alert.description || "—"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Download PDF Poster
              </a>
              <button
                type="button"
                onClick={handleShare}
                className="btn-secondary"
              >
                {copySuccess ? "Link copied!" : "Share (copy link)"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MissingAlert;
