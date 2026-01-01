// File path: src/pages/HISTEAdmin.jsx
import { useRef, useState } from "react";
import {
  start,
  stop,
  pause,
  resume,
} from "../../testing/environments/histe/engine/histeRunner.js";
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
const STATE_SIMULATION_PAUSED = "SIMULATION_PAUSED";

export default function HISTEAdmin() {
  const [isRunning, setIsRunning] = useState(false);
  const [scenarioPath, setScenarioPath] = useState("");
  const fileInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [showJson, setShowJson] = useState(false);
  const [histeState, setHisteState] = useState(STATE_PAGE_LOADED);
  const [roomSize, setRoomSize] = useState(35);
  const [conversationTempo, setConversationTempo] = useState(0.5);
  const [flowStability, setFlowStability] = useState(0.5);
  const [surfacingSpeed, setSurfacingSpeed] = useState(0.5);
  const adjustmentsRef = useRef({
    roomSize: 35,
    conversationTempo: 0.5,
    flowStability: 0.5,
    surfacingSpeed: 0.5,
  });

  const getCurrentAdjustments = () => ({ ...adjustmentsRef.current });

  const updateAdjustment = (field, setter, value) => {
    const numericValue = Number(value);
    adjustmentsRef.current = {
      ...adjustmentsRef.current,
      [field]: numericValue,
    };
    setter(numericValue);
  };

  const handleStart = async (getAdjustments) => {
    if (isRunning) return;
    try {
      await start({
        serverUrl: SERVER_URL,
        scenarioPath: scenarioPath.trim() || undefined,
        getAdjustments,
      });
      setIsRunning(true);
      return true;
    } catch (error) {
      console.error("[HISTE_ADMIN] failed to start", error);
      setIsRunning(false);
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
    if (
      histeState === STATE_SIMULATION_RUNNING ||
      histeState === STATE_SIMULATION_PAUSED
    ) {
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
      case STATE_SIMULATION_PAUSED:
        return "Paused";
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
    const started = await handleStart(getCurrentAdjustments);
    if (started) {
      setHisteState(STATE_SIMULATION_RUNNING);
    }
  };

  const handlePauseToggle = () => {
    if (histeState === STATE_SIMULATION_RUNNING) {
      pause();
      setHisteState(STATE_SIMULATION_PAUSED);
    } else if (histeState === STATE_SIMULATION_PAUSED) {
      resume();
      setHisteState(STATE_SIMULATION_RUNNING);
    }
  };

  const handleStopClick = () => {
    if (
      histeState !== STATE_SIMULATION_RUNNING &&
      histeState !== STATE_SIMULATION_PAUSED
    )
      return;
    handleStop();
    setHisteState(STATE_SCENARIO_ARMED);
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
              onClick={handlePauseToggle}
              disabled={
                histeState !== STATE_SIMULATION_RUNNING &&
                histeState !== STATE_SIMULATION_PAUSED
              }
            >
              {histeState === STATE_SIMULATION_PAUSED ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              onClick={handleStopClick}
              disabled={
                histeState !== STATE_SIMULATION_RUNNING &&
                histeState !== STATE_SIMULATION_PAUSED
              }
            >
              Stop
            </button>
          </div>
          <div className="runtime-adjustments">
            <div className="runtime-heading">
              <p>Runtime Adjustments</p>
              <span>(Applies to future behavior only)</span>
            </div>
            <div className="adjustment-row">
              <label htmlFor="room-size">Room Size</label>
              <input
                id="room-size"
                className="runtime-slider"
                type="range"
                min="35"
                max="45"
                value={roomSize}
                onChange={(event) =>
                  updateAdjustment("roomSize", setRoomSize, event.target.value)
                }
              />
              <span className="runtime-value">{roomSize}</span>
            </div>
            <div className="adjustment-row">
              <label htmlFor="conversation-tempo">Conversation Tempo</label>
              <input
                id="conversation-tempo"
                className="runtime-slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={conversationTempo}
                onChange={(event) =>
                  updateAdjustment(
                    "conversationTempo",
                    setConversationTempo,
                    event.target.value
                  )
                }
              />
              <span className="runtime-value">
                {conversationTempo.toFixed(2)}
              </span>
            </div>
            <div className="adjustment-row">
              <label htmlFor="flow-stability">Flow Stability</label>
              <input
                id="flow-stability"
                className="runtime-slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={flowStability}
                onChange={(event) =>
                  updateAdjustment(
                    "flowStability",
                    setFlowStability,
                    event.target.value
                  )
                }
              />
              <span className="runtime-value">
                {flowStability.toFixed(2)}
              </span>
            </div>
            <div className="adjustment-row">
              <label htmlFor="surfacing-speed">Surfacing Speed</label>
              <input
                id="surfacing-speed"
                className="runtime-slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={surfacingSpeed}
                onChange={(event) =>
                  updateAdjustment(
                    "surfacingSpeed",
                    setSurfacingSpeed,
                    event.target.value
                  )
                }
              />
              <span className="runtime-value">
                {surfacingSpeed.toFixed(2)}
              </span>
            </div>
          </div>
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
