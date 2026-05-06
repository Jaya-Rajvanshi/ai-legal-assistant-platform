import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import LegalHelp from "./pages/LegalHelp.jsx";
import LegalHelpCategoryPage from "./pages/LegalHelpCategoryPage.jsx";
import SubCategoryPage from "./pages/SubCategoryPage.jsx";
import ReportHarassment from "./pages/ReportHarassment.jsx";
import MissingPersonForm from "./pages/MissingPersonForm.jsx";
import Emergency from "./pages/Emergency.jsx";
import EmergencyHelpline from "./pages/EmergencyHelpline.jsx";
import PoliceStationFinder from "./pages/PoliceStationFinder.jsx";
import SafetyTimer from "./pages/SafetyTimer.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import PublicAlert from "./pages/PublicAlert.jsx";
import MissingAlert from "./pages/MissingAlert.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/legal-help" element={<LegalHelp />} />
      <Route path="/legal-help/:categoryKey" element={<LegalHelpCategoryPage />} />
      <Route
        path="/legal-help/:categoryKey/:subKey"
        element={<SubCategoryPage />}
      />
      <Route path="/report-harassment" element={<ReportHarassment />} />
      <Route path="/missing-person" element={<MissingPersonForm />} />
      <Route path="/missing-persons" element={<MissingPersonForm />} />
      <Route path="/emergency" element={<Emergency />} />
      <Route path="/emergency-helpline" element={<EmergencyHelpline />} />
      <Route path="/police-stations" element={<PoliceStationFinder />} />
      <Route path="/safety-timer" element={<SafetyTimer />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/alerts/:publicId" element={<PublicAlert />} />
      <Route path="/missing-alert/:id" element={<MissingAlert />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/login" element={<Navigate to="/auth" replace />} />
      <Route path="/register" element={<Navigate to="/auth?tab=register" replace />} />
    </Routes>
  );
};

export default App;

