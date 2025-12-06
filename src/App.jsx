// src/App.jsx
import React from "react";
import { Routes, Route, Link } from "react-router-dom";

import TrainerView from "./pages/TrainerView";
import AudienceInput from "./pages/AudienceInput";
import AudienceView from "./pages/AudienceView";
import ROUTES from "./paths";

export default function App() {
  return (
    <div>
      {import.meta.env.DEV && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            padding: "4px 8px",
            fontSize: "10px",
            color: "#aaa",
            opacity: 0.5,
          }}
        >
          Phase 0.5 — Plumbing OK
        </div>
      )}
      <nav className="dev-nav" style={{ padding: "1rem", gap: "1rem" }}>
        <Link to={ROUTES.ROOT}>Trainer</Link>
        <Link to={ROUTES.AUDIENCE}>Audience View</Link>
        <Link to={ROUTES.AUDIENCE_INPUT}>Audience Input</Link>
      </nav>

      <Routes>
        <Route path={ROUTES.ROOT} element={<TrainerView />} />
        <Route path={ROUTES.TRAINER} element={<TrainerView />} />
        <Route path={ROUTES.AUDIENCE} element={<AudienceView />} />
        <Route path={ROUTES.AUDIENCE_INPUT} element={<AudienceInput />} />
        <Route path="*" element={<TrainerView />} />
      </Routes>
    </div>
  );
}
