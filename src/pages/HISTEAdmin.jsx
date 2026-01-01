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
    <div className="histe-admin">
      <h1>HISTE — Human Interaction Stress Testing</h1>
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
    </div>
  );
}
