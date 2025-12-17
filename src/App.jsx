import React from "react";
import { Routes, Route } from "react-router-dom";
import TrainerView from "./pages/TrainerView.jsx";
import AudienceInput from "./pages/AudienceInput.jsx";


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TrainerView />} />
      <Route path="/audience" element={<AudienceInput />} />
     
    </Routes>
  );
}

