import React, { useEffect, useState } from "react";
import { useSocketContext } from "../socket/SocketContext.jsx";

export default function TrainerView() {
  const { emit, onEvent, offEvent, connectionStatus } = useSocketContext();
  const [livePulse, setLivePulse] = useState(null);
  const [messages, setMessages] = useState([]);
  const [momentData, setMomentData] = useState(null);
  const [trainerSignal, setTrainerSignal] = useState(null);
  const [showInsights, setShowInsights] = useState(false);
  const [hiddenInsights, setHiddenInsights] = useState(null);

  // -------------------------------
  // Socket listeners
  // -------------------------------
  useEffect(() => {
    const handlePulse = (payload) => {
      setLivePulse(payload);
    };

    onEvent("pulse:update", handlePulse);
    return () => offEvent("pulse:update", handlePulse);
  }, [onEvent, offEvent]);

  useEffect(() => {
    const handleAudienceMessage = (payload) => {
      setMessages((prev) => {
        const next = [...prev, payload];
        return next.slice(-5);
      });
    };

    const handleMomentUpdate = (payload) => {
      if (!payload) {
        setMomentData(null);
        setHiddenInsights(null);
        return;
      }

      // Normalize moment envelope to stable fields
      const ts = payload.ts ?? payload.timestamp ?? Date.now();

      // Strip insights from live updates (pull-only enforcement)
      if (Array.isArray(payload.insights)) {
        setHiddenInsights(payload.insights);
      } else {
        setHiddenInsights(null);
      }

      const normalized = {
        ts,
        pulse: payload.pulse ?? null,
        emotion: payload.emotion ?? null,
        safety: payload.safety ?? "none",
        message: payload.message ?? null,
        trainer: payload.trainer ?? null,
      };

      setMomentData(normalized);
    };

    const handleTrainerSignal = (payload) => {
      if (!payload) {
        setTrainerSignal(null);
        return;
      }

      const raw =
        typeof payload.trainerSignal === "object"
          ? payload.trainerSignal
          : payload;

      const signal = {
        actionType: raw.actionType ?? raw.type ?? "unknown",
        ts: raw.ts ?? Date.now(),
        meta: raw.meta ?? null,
      };

      setTrainerSignal(signal);
    };

    onEvent("message:audience", handleAudienceMessage);
    onEvent("moment:update", handleMomentUpdate);
    onEvent("trainer:signal", handleTrainerSignal);

    return () => {
      offEvent("message:audience", handleAudienceMessage);
      offEvent("moment:update", handleMomentUpdate);
      offEvent("trainer:signal", handleTrainerSignal);
    };
  }, [onEvent, offEvent]);

  // -------------------------------
  // Trainer action emitter
  // -------------------------------
  const sendTrainerAction = (actionType) => {
    emit("trainer:action", {
      actionType,
      ts: Date.now(),
    });
  };

  const rawMomentTs = momentData?.ts ?? momentData?.timestamp ?? null;
  const lastMomentTimestamp = rawMomentTs;
  const formattedLastMoment = lastMomentTimestamp
    ? new Date(lastMomentTimestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "waiting";

  // Unified moment panel model (foundation for emotional trendline)
  const currentMoment = momentData
    ? {
        ts: momentData.ts,
        pulse: momentData.pulse,
        emotion: momentData.emotion ?? null,
        safety: momentData.safety,
        message: momentData.message,
        trainerSignal: trainerSignal ?? null,
      }
    : null;

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 16,
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Trainer View</h1>
          <p style={{ margin: 0, color: "#666" }}>Socket: {connectionStatus}</p>
        </div>
        <button
          onClick={() => {
            setShowInsights((v) => !v);
          }}
          style={{ padding: "6px 10px", cursor: "pointer" }}
        >
          Insights
        </button>
      </header>

      {/* ---------------- TRAINER CONTROLS ---------------- */}
      <div
        style={{
          padding: "12px",
          border: "1px solid #ddd",
          borderRadius: 8,
          marginBottom: 12,
          background: "#fafafa",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Trainer Controls</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            ["slowdown", "Slow Down"],
            ["speedup", "Speed Up"],
            ["break", "Break"],
            ["checkin", "Check-in"],
          ].map(([type, label]) => (
            <button
              key={type}
              onClick={() => sendTrainerAction(type)}
              style={{
                padding: "8px 14px",
                background: "#222",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- AUDIENCE MESSAGES ---------------- */}
      <div
        style={{
          padding: "12px",
          border: "1px solid #ddd",
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Audience Messages</h3>
        {messages.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {messages.slice(-3).map((msg, index) => (
              <div
                key={`${msg.id ?? index}-${index}`}
                style={{
                  padding: "8px",
                  background: "#fff",
                  borderRadius: 6,
                  border: "1px solid #eee",
                }}
              >
                <pre
                  style={{
                    margin: 0,
                    fontSize: "0.8rem",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {JSON.stringify(msg, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, color: "#555" }}>No audience messages yet.</p>
        )}
      </div>

      {/* ---------------- TRAINER INSIGHTS (PULL-ONLY) ---------------- */}
      {showInsights && (
        <div
          style={{
            padding: "12px",
            border: "1px solid #ddd",
            borderRadius: 8,
            marginBottom: 20,
            background: "#fff",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Trainer Insights</h3>

          {Array.isArray(hiddenInsights) && hiddenInsights.length ? (
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {hiddenInsights.map((insight) => (
                <li key={insight.id} style={{ marginBottom: 8 }}>
                  <strong>{insight.category}</strong>: {insight.language}
                  {typeof insight.confidence === "number" && (
                    <span style={{ color: "#666" }}>
                      {" "}
                      ({Math.round(insight.confidence * 100)}%)
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0, color: "#555" }}>
              No insights available at this time.
            </p>
          )}
        </div>
      )}

      {/* ========================= */}
      {/*  Live Pulse Feed Section  */}
      {/* ========================= */}
      <h2>Live Pulse Feed</h2>
      <pre
        style={{
          background: "black",
          color: "lime",
          padding: 16,
          maxHeight: 200,
          overflowY: "auto",
        }}
      >
        {livePulse ? JSON.stringify(livePulse, null, 2) : "No data yet"}
      </pre>

      <h2>Pulse Vote Summary</h2>

      <p style={{ fontSize: "0.9rem", color: "#666", marginTop: "-8px" }}>
        Last pulse update: {formattedLastMoment}
      </p>

      {(() => {
        if (!livePulse || !livePulse.votes) {
          return <p>No pulse data yet.</p>;
        }

        const votes = Object.values(livePulse.votes);
        const engaged = votes.filter((v) => v === "engaged").length;
        const neutral = votes.filter((v) => v === "neutral").length;
        const frustrated = votes.filter((v) => v === "frustrated").length;

        return (
          <pre
            style={{
              background: "#111",
              color: "white",
              padding: "10px",
              marginBottom: "20px",
              lineHeight: "1.4",
            }}
          >
            {`Engaged:     ${engaged}
Neutral:     ${neutral}
Frustrated:  ${frustrated}`}
          </pre>
        );
      })()}

      <div
        style={{
          padding: "12px",
          border: "1px solid #ddd",
          borderRadius: 8,
          marginBottom: 20,
          background: "#f9f9f9",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Emotion / Moment Panel</h3>
        {momentData ? (
          <>
            <p style={{ margin: "4px 0" }}>
              Current moment: {momentData.label ?? momentData.id ?? "unknown"}
            </p>
            <pre
              style={{
                background: "#fff",
                padding: "10px",
                borderRadius: 6,
                border: "1px solid #eee",
                maxHeight: 220,
                overflowY: "auto",
                margin: 0,
                fontSize: "0.85rem",
              }}
            >
          {JSON.stringify(currentMoment, null, 2)}
            </pre>
          </>
        ) : (
          <p style={{ margin: 0, color: "#555" }}>Waiting for moment data…</p>
        )}
      </div>

      <div
        style={{
          padding: "12px",
          borderRadius: 8,
          border: "1px solid #ddd",
          background: "#f4f4f4",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Trainer Signal Debug</h3>
        {trainerSignal ? (
          <pre
            style={{
              margin: 0,
              fontSize: "0.8rem",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {JSON.stringify(trainerSignal, null, 2)}
          </pre>
        ) : (
          <p style={{ margin: 0, color: "#555" }}>No trainer signal yet</p>
        )}
      </div>
    </div>
  );
}
