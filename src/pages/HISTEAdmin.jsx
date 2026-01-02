// File path: src/pages/HISTEAdmin.jsx
import { useRef, useState, useEffect } from "react";
import {
  start,
  stop,
  pause,
  resume,
} from "../../testing/environments/histe/engine/histeRunner.js";
import { adaptMessage } from "./messageHelpers.js";
import { useSocket } from "../socket/SocketContext.jsx";
import { OFFICIAL_SCENARIOS } from "../../testing/environments/histe/scenarios/index.js";
import "./HISTEAdmin.css";

const SERVER_URL = "http://localhost:3000";
const OBSERVATION_WINDOW_MS = 10000;
const OVERLAP_THRESHOLD_MS = 800;

const DRAFT_STORAGE_KEY = "histe.draftScenarios.v1";

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
  const [draftScenarios, setDraftScenarios] = useState([]);
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
  const draftFileInputRef = useRef(null);
  const { onEvent, offEvent, emit, socket } = useSocket();
  const [flowDensity, setFlowDensity] = useState(0);
  const [overlapCount, setOverlapCount] = useState(0);
  const [silenceDuration, setSilenceDuration] = useState(0);
  const [driftScore, setDriftScore] = useState(null);
  const messageWindowRef = useRef([]);

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

  const loadDraftScenarios = () => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  };

  const persistDrafts = (nextDrafts) => {
    setDraftScenarios(nextDrafts);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(nextDrafts));
    } catch {
      // ignore
    }
  };

  const addDraftScenario = (draft) => {
    const next = [draft, ...draftScenarios];
    persistDrafts(next);
  };

  const handleExportDraft = () => {
    const scenario = selectedScenario;
    if (!scenario || scenario.source !== "draft") return;
    const blob = new Blob([JSON.stringify(scenario.json, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${scenario.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteDraft = () => {
    const scenario = selectedScenario;
    if (!scenario || scenario.source !== "draft") return;
    const next = draftScenarios.filter((item) => item.id !== scenario.id);
    persistDrafts(next);
    setSelectedScenarioId(null);
  };

  useEffect(() => {
    if (!onEvent || !offEvent) return;

    const handleMessageStateUpdate = ({ messages: canonicalMessages }) => {
      if (!Array.isArray(canonicalMessages)) return;

      const now = Date.now();
      const timestamps = canonicalMessages
        .map(adaptMessage)
        .filter(Boolean)
        .map((message) => new Date(message.createdAt).getTime())
        .filter((ts) => Number.isFinite(ts));

      const trimmed = timestamps
        .filter((ts) => now - ts <= OBSERVATION_WINDOW_MS)
        .sort((a, b) => a - b);

      messageWindowRef.current = trimmed;

      setFlowDensity(trimmed.length);

      let overlaps = 0;
      for (let i = 1; i < trimmed.length; i += 1) {
        if (trimmed[i] - trimmed[i - 1] <= OVERLAP_THRESHOLD_MS) {
          overlaps += 1;
        }
      }
      setOverlapCount(overlaps);

      const lastTimestamp = trimmed[trimmed.length - 1];
      if (lastTimestamp) {
        setSilenceDuration(
          Math.max(0, Math.floor((now - lastTimestamp) / 1000))
        );
      } else {
        setSilenceDuration(0);
      }
    };

    onEvent("message.state.update", handleMessageStateUpdate);
    return () => {
      offEvent("message.state.update", handleMessageStateUpdate);
    };
  }, [onEvent, offEvent]);

  useEffect(() => {
    setDraftScenarios(loadDraftScenarios());
  }, []);

  const handleDraftUploadClick = () => {
    draftFileInputRef.current?.click();
  };

  const handleDraftFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== "object") return;
        const normalized = {
          id:
            parsed.id ??
            parsed.name ??
            `draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: parsed.name ?? "Draft Scenario",
          participantsRange: parsed.participantsRange ?? "N/A",
          tempo: parsed.tempo ?? "Unknown",
          flow: parsed.flow ?? "Unknown",
          surfacing: parsed.surfacing ?? "Unknown",
          json: parsed,
          source: "draft",
          createdAt: Date.now(),
        };
        addDraftScenario(normalized);
        setSelectedScenarioId(normalized.id);
      } catch (error) {
        console.error("Invalid scenario JSON", error);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const lastTimestamp =
        messageWindowRef.current[messageWindowRef.current.length - 1];
      if (!lastTimestamp) {
        setSilenceDuration(0);
        return;
      }
      setSilenceDuration(
        Math.max(0, Math.floor((Date.now() - lastTimestamp) / 1000))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!onEvent || !offEvent) return;

    const handleDriftUpdate = (payload) => {
      if (!payload || typeof payload.score !== "number") return;
      setDriftScore(payload.score);
    };

    onEvent("audience:drift:update", handleDriftUpdate);
    return () => {
      offEvent("audience:drift:update", handleDriftUpdate);
    };
  }, [onEvent, offEvent]);

  const allScenarios = [...OFFICIAL_SCENARIOS, ...draftScenarios];
  const filteredScenarios = allScenarios.filter((scenario) =>
    scenario.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );
  const filteredOfficial = OFFICIAL_SCENARIOS.filter((scenario) =>
    scenario.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );
  const filteredDrafts = draftScenarios.filter((scenario) =>
    scenario.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const selectedScenario = allScenarios.find(
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

  const handleClearSessionClick = () => {
    if (
      histeState === STATE_SIMULATION_RUNNING ||
      histeState === STATE_SIMULATION_PAUSED
    ) {
      handleStop();
    }
    const sessionId = socket?.sessionId ?? "session:default";
    emit("message.state.update", {
      sessionId,
      messages: [],
    });
    emit("audience:drift:update", {
      sessionId,
      score: 0,
    });
    setIsRunning(false);
    setSelectedScenarioId(null);
    setShowJson(false);
    setHisteState(STATE_PAGE_LOADED);
    setFlowDensity(0);
    setOverlapCount(0);
    setSilenceDuration(0);
    setDriftScore(null);
    messageWindowRef.current = [];
    adjustmentsRef.current = {
      roomSize: 35,
      conversationTempo: 0.5,
      flowStability: 0.5,
      surfacingSpeed: 0.5,
    };
    setRoomSize(35);
    setConversationTempo(0.5);
    setFlowStability(0.5);
    setSurfacingSpeed(0.5);
  };

  const scenarioNameLabel = selectedScenario
    ? selectedScenario.name
    : "— None Selected —";
  const sessionIdLabel = socket?.sessionId ?? "session:default";

  const flowPercent = Math.min(100, (flowDensity / 20) * 100);
  const overlapPercent = Math.min(100, overlapCount * 14);
  const driftPercent =
    typeof driftScore === "number"
      ? Math.max(0, Math.min(100, ((driftScore + 1) / 2) * 100))
      : 50;
  const driftLabel =
    typeof driftScore === "number" ? driftScore.toFixed(2) : "—";
  const silenceLabel = `${silenceDuration}s`;

  return (
    <div className="histe-page">
      <header className="histe-header">
        <h1>HISTE — Human Interaction Stress Testing Environment</h1>
        <p className="session-label">Session: {sessionIdLabel}</p>
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
          <div className="scenario-section">
            <div className="scenario-section-header">
              <h3>Official Scenarios</h3>
              <span className="section-note">Repo</span>
            </div>
            <div className="scenario-list">
              {filteredOfficial.map((scenario) => (
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
              {filteredOfficial.length === 0 && (
                <p className="no-results">No official scenarios match.</p>
              )}
            </div>
          </div>
          <div className="scenario-section">
            <div className="scenario-section-header">
              <h3>Draft Scenarios</h3>
              <button
                type="button"
                className="draft-upload-button"
                onClick={handleDraftUploadClick}
              >
                Upload Draft JSON
              </button>
            </div>
            <input
              ref={draftFileInputRef}
              type="file"
              accept="application/json"
              onChange={handleDraftFileChange}
              style={{ display: "none" }}
            />
            <div className="scenario-list">
              {filteredDrafts.map((scenario) => (
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
              {filteredDrafts.length === 0 && (
                <p className="no-results">No drafts yet.</p>
              )}
            </div>
          </div>
          <div className="scenario-details">
            <h3>Scenario Details</h3>
            {selectedScenario ? (
              <>
                <ul>
                  <li>Participants: {selectedScenario.participantsRange}</li>
                  <li>Tempo: {selectedScenario.tempo}</li>
                  <li>Flow: {selectedScenario.flow}</li>
                  <li>Surfacing: {selectedScenario.surfacing}</li>
                  <li>Source: {selectedScenario.source}</li>
                </ul>
                <button
                  type="button"
                  onClick={toggleJson}
                  disabled={!selectedScenario}
                  className="view-json-button"
                >
                  View JSON
                </button>
                {selectedScenario.source === "draft" && (
                  <div className="draft-actions">
                    <button
                      type="button"
                      onClick={handleExportDraft}
                      className="export-button"
                    >
                      Export JSON
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteDraft}
                      className="delete-button"
                    >
                      Delete Draft
                    </button>
                  </div>
                )}
                {showJson && selectedScenario && (
                  <pre className="scenario-json">
                    {JSON.stringify(selectedScenario.json, null, 2)}
                  </pre>
                )}
              </>
            ) : (
              <p>No scenario selected.</p>
            )}
            {selectedScenario?.source === "draft" && (
              <p className="draft-note">
                Drafts are local only. Export and add to
                testing/environments/histe/scenarios + update index.js when
                promoting.
              </p>
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
            <button
              type="button"
              onClick={handleClearSessionClick}
              className="clear-session-button"
            >
              Clear Session
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
                min="6"
                max="50"
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
          <div className="observation-card">
            <span className="observation-label">Message Flow Density</span>
            <span className="observation-value">
              {flowDensity} msgs / {OBSERVATION_WINDOW_MS / 1000}s
            </span>
            <div className="observation-bar">
              <span
                className="observation-bar-fill"
                style={{ width: `${flowPercent}%` }}
              />
            </div>
          </div>
          <div className="observation-card">
            <span className="observation-label">Overlap Events</span>
            <span className="observation-value">{overlapCount}</span>
            <div className="observation-bar">
              <span
                className="observation-bar-fill"
                style={{ width: `${overlapPercent}%` }}
              />
            </div>
          </div>
          <div className="observation-card">
            <span className="observation-label">Silence Duration</span>
            <span className="observation-value">{silenceLabel}</span>
            <div className="observation-bar">
              <span
                className="observation-bar-fill"
                style={{
                  width: `${Math.min(100, silenceDuration * 10)}%`,
                }}
              />
            </div>
          </div>
          <div className="observation-card">
            <span className="observation-label">Drift Indicators</span>
            <span className="observation-value">
              {driftLabel}
            </span>
            <div className="observation-bar">
              <span
                className="observation-bar-fill"
                style={{ width: `${driftPercent}%` }}
              />
            </div>
          </div>
          <p className="readonly-label">(Read-only)</p>
        </section>
      </div>
    </div>
  );
}
