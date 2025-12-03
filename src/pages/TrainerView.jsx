// src/pages/TrainerView.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EVENTS from "../socket/events";
import ConnectionStatus from "../components/system/ConnectionStatus";
import "../components/system/ConnectionStatus.css";
import guard from "../utils/guard";
import sanitizeMessage from "../utils/sanitizeMessage";
import usePulseIngestion from "../utils/usePulseIngestion";
import useSocket from "../socket/useSocket";
import ROUTES from "../paths";

const INITIAL_LEVELS = {
  engaged: 0,
  neutral: 0,
  frustrated: 0,
};

const INITIAL_HISTORY = {
  engaged: 0,
  neutral: 0,
  frustrated: 0,
};

const VALID_EMOTIONS = Object.keys(INITIAL_LEVELS);

const formatTimestamp = (value) =>
  new Date(Number.isFinite(value) ? value : Date.now()).toISOString();

export default function TrainerView() {
  const [levels, setLevels] = useState(INITIAL_LEVELS);
  const [pulseHistory, setPulseHistory] = useState(INITIAL_HISTORY);
  // Filter out null/empty/echo messages for clarity & safety
  const [messages, setMessages] = useState([]);
  const [roomState, setRoomState] = useState({});
  const [engineMove, setEngineMove] = useState(null);
  const [focus, setFocus] = useState("audience");

  const { ingest } = usePulseIngestion();

  useEffect(() => {
    console.debug("[TrainerView] pulse + message systems online");
  }, []);

  const appendMessage = useCallback((rawMessage) => {
    const clean = sanitizeMessage(rawMessage);
    if (!clean) return;

    setMessages((prev) => [...prev, clean]);
  }, []);

  const handlePulseUpdate = useCallback(
    (payload) => {
      if (!payload || typeof payload !== "object") return;
      const normalized = ingest(payload);
      if (!normalized) return;

      const emotion = normalized.emotion;
      const safeEmotion =
        typeof emotion === "string" ? emotion.toLowerCase() : null;
      if (!safeEmotion || !VALID_EMOTIONS.includes(safeEmotion)) return;

      const value = Number.isFinite(normalized.value)
        ? normalized.value
        : 0;

      setLevels((prev) => ({
        ...prev,
        [safeEmotion]: value,
      }));

      setPulseHistory((prev) => ({
        ...prev,
        [safeEmotion]: (prev[safeEmotion] ?? 0) + 1,
      }));
    },
    [ingest]
  );

  const eventHandlers = useMemo(
    () => ({
      [EVENTS.PULSE_UPDATE]: (payload) =>
        guard(() => {
          if (!payload || !payload.userId || !payload.emotion) return;
          setRoomState((prev) => ({
            ...prev,
            [payload.userId]: payload.emotion,
          }));
          handlePulseUpdate(payload);
        }, "PULSE_UPDATE"),
      [EVENTS.TRAINER_MESSAGE]: (payload) =>
        guard(() => appendMessage(payload), "TRAINER_MESSAGE"),
      [EVENTS.ENGINE_MOVE]: (payload) =>
        guard(
          () =>
            setEngineMove({
              move: payload?.move ?? null,
              reasoning: payload?.reasoning ?? null,
            }),
          "ENGINE_MOVE"
        ),
      [EVENTS.FOCUS_CHANGE]: (payload) =>
        guard(() => {
          if (payload?.focus) setFocus(payload.focus);
        }, "FOCUS_CHANGE"),
      "message:update": (payload) =>
        guard(() => appendMessage(payload), "MESSAGE_UPDATE"),
    }),
    [appendMessage, handlePulseUpdate]
  );

  const { connectionStatus } = useSocket(eventHandlers);

  return (
    <div className="trainer-view" style={{ padding: "20px" }}>
      <ConnectionStatus status={connectionStatus} />
      <Link to={ROUTES.AUDIENCE}>Trainer Audience Input</Link>

      <h1>Trainer View</h1>

      <h2>Emotional Levels</h2>
      <p>Engaged: {levels.engaged.toFixed(2)}</p>
      <p>Neutral: {levels.neutral.toFixed(2)}</p>
      <p>Frustrated: {levels.frustrated.toFixed(2)}</p>

      <h2>Pulse History</h2>
      <p>Engaged Count: {pulseHistory.engaged}</p>
      <p>Neutral Count: {pulseHistory.neutral}</p>
      <p>Frustrated Count: {pulseHistory.frustrated}</p>

      <h2>Spotlight</h2>
      <p>Focus: {focus}</p>
      <p>
        Latest move: {engineMove?.move ?? "waiting for insights"}
        {engineMove?.reasoning ? ` (${engineMove.reasoning})` : ""}
      </p>
      <p>Participants tracked: {Object.keys(roomState).length}</p>

      <h2>Messages</h2>
      <ul>
        {messages.map((msg) => (
          <li key={msg.id}>
            {msg.body} — {formatTimestamp(msg.timestamp)}
          </li>
        ))}
      </ul>
    </div>
  );
}
