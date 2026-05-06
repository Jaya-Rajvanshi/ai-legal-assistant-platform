import React, { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import api from "../api/client.js";
import AdminRoute from "../components/AdminRoute.jsx";

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [harassmentReports, setHarassmentReports] = useState([]);
  const [missingAlerts, setMissingAlerts] = useState([]);
  const [missingPersonReports, setMissingPersonReports] = useState([]);
  const [error, setError] = useState("");

  const loadData = async () => {
    setError("");
    try {
      const [overviewRes, harassmentRes, missingRes, missingPersonRes] =
        await Promise.all([
          api.get("/admin/overview"),
          api.get("/admin/harassment"),
          api.get("/admin/missing"),
          api.get("/missing-person").catch(() => ({ data: [] })),
        ]);
      setOverview(overviewRes.data);
      setHarassmentReports(harassmentRes.data);
      setMissingAlerts(missingRes.data);
      setMissingPersonReports(missingPersonRes?.data ?? []);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Failed to load admin data. Ensure you are logged in as admin."
      );
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateHarassmentStatus = async (id, status) => {
    try {
      await api.patch(`/admin/harassment/${id}`, { status });
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Failed to update harassment status.");
    }
  };

  const updateMissingStatus = async (id, status, isActive) => {
    try {
      await api.patch(`/admin/missing/${id}`, { status, isActive });
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Failed to update missing alert.");
    }
  };

  const reportId = (r) => r._id || r.id;

  const approveMissingPersonReport = async (id) => {
    try {
      await api.put(`/missing-person/${id}/approve`);
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Failed to approve report.");
    }
  };

  const rejectMissingPersonReport = async (id) => {
    try {
      await api.put(`/missing-person/${id}/reject`);
      await loadData();
    } catch (err) {
      console.error(err);
      setError("Failed to reject report.");
    }
  };

  const statusBadge = (status) => {
    const classes = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`inline rounded px-2 py-0.5 text-xs font-medium ${classes[status] || "bg-slate-100 text-slate-800"}`}
      >
        {status}
      </span>
    );
  };

  return (
    <AdminRoute>
      <Layout>
        <div className="flex w-full flex-col gap-4">
          <h1 className="text-xl font-semibold text-primary">Admin Dashboard</h1>
          {error && <p className="text-xs text-alert">{error}</p>}
          {overview && (
            <section className="grid gap-3 md:grid-cols-4">
              <div className="card">
                <p className="text-xs text-slate-500">Registered Users</p>
                <p className="mt-1 text-2xl font-semibold text-primary">
                  {overview.users}
                </p>
              </div>
              <div className="card">
                <p className="text-xs text-slate-500">Harassment Reports</p>
                <p className="mt-1 text-2xl font-semibold text-primary">
                  {overview.harassmentReports}
                </p>
              </div>
              <div className="card">
                <p className="text-xs text-slate-500">Missing Alerts</p>
                <p className="mt-1 text-2xl font-semibold text-primary">
                  {overview.missingPersonAlerts}
                </p>
              </div>
              <div className="card">
                <p className="text-xs text-slate-500">Active Alerts</p>
                <p className="mt-1 text-2xl font-semibold text-primary">
                  {overview.activeApprovedAlerts}
                </p>
              </div>
            </section>
          )}

          <section className="card">
            <h2 className="text-base font-semibold text-primary">
              Harassment Reports
            </h2>
            <div className="mt-2 max-h-60 overflow-y-auto text-xs">
              {harassmentReports.map((r) => (
                <div
                  key={r._id}
                  className="border-b border-slate-200 py-2 last:border-b-0"
                >
                  <p className="font-semibold text-slate-800">
                    {r.trackingId} - {r.category || "Uncategorised"}
                  </p>
                  <p className="text-slate-600">
                    Status:{" "}
                    <span className="font-medium">{r.status}</span>
                  </p>
                  {r.reporter && (
                    <p className="text-slate-500">
                      Reporter: {r.reporter.name} ({r.reporter.email})
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {["pending", "in_review", "resolved", "rejected"].map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => updateHarassmentStatus(r._id, status)}
                          className="btn-secondary px-2 py-1 text-xs"
                        >
                          {status}
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
              {harassmentReports.length === 0 && (
                <p className="text-slate-500">No reports yet.</p>
              )}
            </div>
          </section>

          <section className="card">
            <h2 className="text-base font-semibold text-primary">
              Missing Person Reports
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Approve or reject new missing person reports. Approved alerts go
              live and contact receives SMS.
            </p>
            <div className="mt-3 max-h-60 overflow-y-auto text-xs">
              {missingPersonReports.map((r) => (
                <div
                  key={reportId(r)}
                  className="border-b border-slate-200 py-3 last:border-b-0"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-800">
                      {r.fullName}
                    </span>
                    {statusBadge(r.status)}
                  </div>
                  <p className="mt-1 text-slate-600">
                    Last seen: {r.lastSeenLocation} • {r.contactPhone}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => approveMissingPersonReport(reportId(r))}
                          className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectMissingPersonReport(reportId(r))}
                          className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {missingPersonReports.length === 0 && (
                <p className="text-slate-500">No reports yet.</p>
              )}
            </div>
          </section>

          <section className="card">
            <h2 className="text-base font-semibold text-primary">
              Missing Person Alerts (Legacy)
            </h2>
            <div className="mt-2 max-h-60 overflow-y-auto text-xs">
              {missingAlerts.map((a) => (
                <div
                  key={a._id}
                  className="border-b border-slate-200 py-2 last:border-b-0"
                >
                  <p className="font-semibold text-slate-800">
                    {a.name} - {a.region || "N/A"}
                  </p>
                  <p className="text-slate-600">
                    Status:{" "}
                    <span className="font-medium">{a.status}</span> | Active:{" "}
                    <span className="font-medium">
                      {a.isActive ? "Yes" : "No"}
                    </span>
                  </p>
                  {a.publicId && (
                    <p className="text-slate-500">
                      Public ID: {a.publicId}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {["pending", "approved", "rejected"].map((status) => (
                      <button
                        key={status}
                        onClick={() =>
                          updateMissingStatus(a._id, status, a.isActive)
                        }
                        className="btn-secondary px-2 py-1 text-xs"
                      >
                        {status}
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        updateMissingStatus(a._id, a.status, !a.isActive)
                      }
                      className="btn-secondary px-2 py-1 text-xs"
                    >
                      Toggle Active
                    </button>
                  </div>
                </div>
              ))}
              {missingAlerts.length === 0 && (
                <p className="text-slate-500">No alerts yet.</p>
              )}
            </div>
          </section>
        </div>
      </Layout>
    </AdminRoute>
  );
};

export default AdminDashboard;

