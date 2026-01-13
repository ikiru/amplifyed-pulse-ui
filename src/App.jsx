import React from "react";
import { Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import TrainerView from "./pages/TrainerView.jsx";
import AudienceInput from "./pages/AudienceInput.jsx";
import HISTEAdmin from "./pages/HISTEAdmin.jsx";
import LiveView from "./pages/LiveView.jsx";

/**
 * JoinRedirect Component
 * Handles QR code scans by redirecting /join?code=XXXX-XXXX to /audience
 * The code is preserved in the URL for AudienceInput to consume
 */
function JoinRedirect() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  
  // Redirect to audience page with the code preserved in URL params
  return <Navigate to={`/audience?code=${code || ''}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TrainerView />} />
      <Route path="/trainer" element={<TrainerView />} />
      <Route path="/audience" element={<AudienceInput />} />
      <Route path="/join" element={<JoinRedirect />} />
      <Route path="/live/:sessionCode" element={<LiveView />} />
      <Route path="/testing/histe" element={<HISTEAdmin />} />
    </Routes>
  );
}
