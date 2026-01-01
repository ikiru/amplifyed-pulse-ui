// File path: src/pages/HISTEAdmin.jsx
import { useRef, useState } from "react";
import { start, stop } from "../../testing/environments/histe/engine/histeRunner.js";
import "./HISTEAdmin.css";

const SERVER_URL = "http://localhost:3000";

const HISTE_SCENARIOS = [
  {
    id: "large-low-energy",
    name: "Large / Low Energy",
    participantsRange: "35–40",
    tempo: "Workshop",
    flow: "Gradual Drift",
    surfacing: "Medium",
    json: { name: "Large / Low Energy", participants: 40, tempo: "Workshop" },
  },
  {
    id: "small-heated",
    name: "Small / Heated",
    participantsRange: "5–10",
    tempo: "Heated",
    flow: "Burst",
    surfacing: "Fast",
    json: { name: "Small / Heated", participants: 8, tempo: "Heated" },
  },
  {
    id: "silent-majority",
    name: "Silent Majority",
    participantsRange: "25–30",
    tempo: "Slow",
    flow: "Steady",
    surfacing: "Low",
    json: { name: "Silent Majority", participants: 28, tempo: "Slow" },
  },
  {
    id: "gradual-drift",
    name: "Gradual Drift",
    participantsRange: "20–25",
    tempo: "Workshop",
    flow: "Gradual Drift",
    surfacing: "Medium",
    json: { name: "Gradual Drift", participants: 22, tempo: "Workshop" },
  },
  {
    id: "post-break-chaos",
    name: "Post-Break Chaos",
    participantsRange: "30–35",
    tempo: "Bursty",
    flow: "Turbulent",
    surfacing: "Fast",
    json: { name: "Post-Break Chaos", participants: 33, tempo: "Bursty" },
  },
  {
    id: "high-overlap-discussion",
    name: "High Overlap Discussion",
    participantsRange: "35–40",
    tempo: "Heated",
    flow: "Overlap",
    surfacing: "Fast",
    json: { name: "High Overlap Discussion", participants: 37, tempo: "Heated" },
  },
];

const STATE_SERVER_RUNNING = "SERVER_RUNNING";
const STATE_PAGE_LOADED = "PAGE_LOADED";
const STATE_SCENARIO_SELECTED = "SCENARIO_SELECTED";
const STATE_SCENARIO_ARMED = "SCENARIO_ARMED";
const STATE_SIMULATION_RUNNING = "SIMULATION_RUNNING";

export default function HISTEAdmin() {
  const [isRunning, setIsRunning] = useState(false);
  const [scenarioPath, setScenarioPath] = useState("");
  const fileInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [showJson, setShowJson] = useState(false);
  const [histeState, setHisteState] = useState(STATE_PAGE_LOADED);

  const handleStart = async () => {
    if (isRunning) return;
    try {
      await start({
        serverUrl: SERVER_URL,
        scenarioPath: scenarioPath.trim() || undefined,
      });
      setIsRunning(true);
      return true;
    } catch (error) {
      console.error("[HISTE_ADMIN] failed to start", error);
      return false;
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

  const handleScenarioSelect = (scenarioId) => {
    if (histeState === STATE_SIMULATION_RUNNING) {
      return;
    }
    setSelectedScenarioId(scenarioId);
    setShowJson(false);
    setHisteState(STATE_SCENARIO_SELECTED);
  };

  const filteredScenarios = HISTE_SCENARIOS.filter((scenario) =>
    scenario.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const selectedScenario = HISTE_SCENARIOS.find(
    (scenario) => scenario.id === selectedScenarioId
  );

  const toggleJson = () => {
    setShowJson((prev) => !prev);
  };

  const statusLabel = (() => {
    switch (histeState) {
      case STATE_SIMULATION_RUNNING:
        return "Running";
      case STATE_SCENARIO_ARMED:
        return "Armed";
      case STATE_SCENARIO_SELECTED:
        return "Selected";
      case STATE_PAGE_LOADED:
      case STATE_SERVER_RUNNING:
      default:
        return "Idle";
    }
  })();

  const handleArmClick = () => {
    if (!selectedScenario || histeState !== STATE_SCENARIO_SELECTED) return;
    setHisteState(STATE_SCENARIO_ARMED);
  };

  const handleStartClick = async () => {
    if (histeState !== STATE_SCENARIO_ARMED) return;
    setHisteState(STATE_SIMULATION_RUNNING);
    const started = await handleStart();
    if (!started) {
      setHisteState(STATE_SCENARIO_ARMED);
    }
  };

  const handleStopClick = () => {
    if (histeState !== STATE_SIMULATION_RUNNING) return;
    handleStop();
    setHisteState(STATE_SCENARIO_ARMED);
  };

  const scenarioNameLabel = selectedScenario
    ? selectedScenario.name
    : "— None Selected —";

  return (
    <div className="histe-page">
      <header className="histe-header">
        <h1>HISTE — Human Interaction Stress Testing Environment</h1>
      </header>
      <div className="histe-grid">
        <section className="histe-column histe-column--left">
          <h2>Scenario Library</h2>
          <input
            className="scenario-search"
            type="text"
            placeholder="Search scenarios"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <div className="scenario-list">
            {filteredScenarios.map((scenario) => (
              <button
                type="button"
                key={scenario.id}
                className={`scenario-item ${
                  selectedScenarioId === scenario.id ? "is-selected" : ""
                }`}
                onClick={() => handleScenarioSelect(scenario.id)}
              >
                {scenario.name}
              </button>
            ))}
            {filteredScenarios.length === 0 && (
              <p className="no-results">No scenarios match that search.</p>
            )}
          </div>
          <div className="scenario-details">
            <h3>Scenario Details</h3>
            {selectedScenario ? (
              <ul>
                <li>Participants: {selectedScenario.participantsRange}</li>
                <li>Tempo: {selectedScenario.tempo}</li>
                <li>Flow: {selectedScenario.flow}</li>
                <li>Surfacing: {selectedScenario.surfacing}</li>
              </ul>
            ) : (
              <p>No scenario selected.</p>
            )}
            <button
              type="button"
              onClick={toggleJson}
              disabled={!selectedScenario}
              className="view-json-button"
            >
              View JSON
            </button>
            {showJson && selectedScenario && (
              <pre className="scenario-json">
                {JSON.stringify(selectedScenario.json, null, 2)}
              </pre>
            )}
          </div>
        </section>
        <section className="histe-column histe-column--center">
          <h2>Live Simulation &amp; Controls</h2>
          <p className="status-label">Status: {statusLabel}</p>
          <p className="scenario-label">Scenario: {scenarioNameLabel}</p>
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
            <button
              type="button"
              onClick={handleArmClick}
              disabled={
                !selectedScenario || histeState !== STATE_SCENARIO_SELECTED
              }
              className="arm-button"
            >
              Arm
            </button>
            <button
              type="button"
              onClick={handleStartClick}
              disabled={histeState !== STATE_SCENARIO_ARMED}
            >
              Start
            </button>
            <button
              type="button"
              onClick={handleStopClick}
              disabled={histeState !== STATE_SIMULATION_RUNNING}
            >
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
