// src/App.jsx
import React from "react";
import { Routes, Route, Link } from "react-router-dom";

import TrainerView from "./pages/TrainerView.jsx";
import AudienceInput from "./pages/AudienceInput.jsx";

export default function App() {
  return (
    <div>
      <nav className="dev-nav" style={{ padding: "1rem", gap: "1rem" }}>
        <Link to="/">Trainer</Link>
        <Link to="/audience">Audience Input</Link>
      </nav>

      <Routes>
        <Route path="/" element={<TrainerView />} />
        <Route path="/audience" element={<AudienceInput />} />
      </Routes>
    </div>
  );
}
