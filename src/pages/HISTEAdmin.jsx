// File path: src/pages/HISTEAdmin.jsx
import { useRef, useState } from "react";
import { start, stop } from "../../testing/environments/histe/engine/histeRunner.js";
import "./HISTEAdmin.css";

const SERVER_URL = "http://localhost:3000";

export default function HISTEAdmin() {
  const [isRunning, setIsRunning] = useState(false);
  const [scenarioPath, setScenarioPath] = useState("");
  const fileInputRef = useRef(null);

  const handleStart = async () => {
    if (isRunning) return;
    try {
      await start({
        serverUrl: SERVER_URL,
        scenarioPath: scenarioPath.trim() || undefined,
      });
      setIsRunning(true);
    } catch (error) {
      console.error("[HISTE_ADMIN] failed to start", error);
    }
  };

  const handleStop = () => {
    if (!isRunning) return;
    stop();
    setIsRunning(false);
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setScenarioPath(file.webkitRelativePath || file.name);
    event.target.value = "";
  };

  return (
    <div className="histe-page">
      <header className="histe-header">
        <h1>HISTE — Human Interaction Stress Testing Environment</h1>
      </header>
      <div className="histe-grid">
        <section className="histe-column histe-column--left">
          <h2>Scenario Library</h2>
          <div className="placeholder">Search (placeholder)</div>
          <div className="placeholder">Scenario list (placeholder)</div>
          <div className="placeholder">Scenario details + View JSON (placeholder)</div>
        </section>
        <section className="histe-column histe-column--center">
          <h2>Live Simulation &amp; Controls</h2>
          <p className="status-label">Status: {isRunning ? "RUNNING" : "STOPPED"}</p>
          <div className="histe-controls">
            <input
              type="text"
              value={scenarioPath}
              onChange={(event) => setScenarioPath(event.target.value)}
              placeholder="Optional scenario path"
            />
            <button type="button" onClick={handleFileButtonClick}>
              Choose File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <button type="button" onClick={handleStart}>
              Start
            </button>
            <button type="button" onClick={handleStop} disabled={!isRunning}>
              Stop
            </button>
          </div>
          <div className="placeholder">Runtime Adjustments (placeholder)</div>
          <div className="placeholder">Simulation Timeline (placeholder)</div>
        </section>
        <section className="histe-column histe-column--right">
          <h2>Observation Surfaces</h2>
          <div className="placeholder">Message Flow Density (placeholder)</div>
          <div className="placeholder">Overlap Events (placeholder)</div>
          <div className="placeholder">Silence Duration (placeholder)</div>
          <div className="placeholder">Drift Indicators (placeholder)</div>
          <p className="readonly-label">(Read-only)</p>
        </section>
      </div>
    </div>
  );
}
