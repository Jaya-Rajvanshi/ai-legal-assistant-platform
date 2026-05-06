import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import api from "../api/client.js";

const PublicAlert = () => {
  const { publicId } = useParams();
  const [alert, setAlert] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/missing/public/${publicId}`);
        setAlert(data);
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message ||
            "Alert not found or not active."
        );
      }
    };
    load();
  }, [publicId]);

  return (
    <Layout>
      <div className="mx-auto w-full max-w-xl">
        {error && <p className="text-sm text-alert">{error}</p>}
        {alert && (
          <div className="card space-y-3">
            <h1 className="text-xl font-semibold text-alert">
              Missing Person Alert
            </h1>
            <p className="text-sm font-semibold text-slate-900">
              {alert.name}
            </p>
            {alert.photoUrl && (
              <img
                src={alert.photoUrl}
                alt={alert.name}
                className="h-56 w-full rounded object-cover"
              />
            )}
            {alert.posterText && (
              <p className="whitespace-pre-wrap text-sm text-slate-800">
                {alert.posterText}
              </p>
            )}
            <p className="text-xs text-slate-600">
              Region: {alert.region || "N/A"}
            </p>
            <p className="text-xs text-slate-600">
              Contact: {alert.contactNumber}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PublicAlert;

