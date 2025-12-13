import React, { useEffect, useState } from "react";
import { useSocket } from "../socket/SocketContext.jsx";

const MOMENT_HISTORY_LIMIT = 18;

export default function TrainerView() {
  const { emit, onEvent, offEvent, connectionStatus } = useSocket();
  const [focus, setFocus] = useState(null);
  const [focusInput, setFocusInput] = useState("");
  const [livePulse, setLivePulse] = useState(null);
  const [messages, setMessages] = useState([]);
  const [momentData, setMomentData] = useState(null);
  const [trainerSignal, setTrainerSignal] = useState(null);
  const [showInsights, setShowInsights] = useState(false);
  const [hiddenInsights, setHiddenInsights] = useState(null);
  const [visibleInsights, setVisibleInsights] = useState(null);
  const [moments, setMoments] = useState([]);
  const [compareSelection, setCompareSelection] = useState([]);
  const [compareSnapshot, setCompareSnapshot] = useState(null);
  const [showCompare, setShowCompare] = useState(false);

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
      const momentId = payload.id ?? ts;

      // Strip insights from live updates (pull-only enforcement)
      if (Array.isArray(payload.insights)) {
        setHiddenInsights(payload.insights);
      } else {
        setHiddenInsights(null);
      }

      const normalized = {
        id: momentId,
        ts,
        pulse: payload.pulse ?? null,
        emotion: payload.emotion ?? null,
        safety: payload.safety ?? "none",
        message: payload.message ?? null,
        trainer: payload.trainer ?? null,
      };

      setMoments((prev) => {
        const alreadyRecorded = prev.some((entry) => entry.id === normalized.id);
        if (alreadyRecorded) {
          return prev;
        }
        const next = [normalized, ...prev];
        return next.slice(0, MOMENT_HISTORY_LIMIT);
      });

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
  // Focus sync
  // -------------------------------
  useEffect(() => {
    const handleFocusUpdate = (payload) => {
      setFocus(payload?.focus ?? null);
    };

    const handleFocusCleared = () => {
      setFocus(null);
    };

    onEvent("focus:update", handleFocusUpdate);
    onEvent("focus:cleared", handleFocusCleared);

    return () => {
      offEvent("focus:update", handleFocusUpdate);
      offEvent("focus:cleared", handleFocusCleared);
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

  const handleSetFocus = (event) => {
    event.preventDefault();
    const text = focusInput.trim();
    if (!text) return;

    emit("focus:set", { text });
    setFocusInput("");
  };

  const handleClearFocus = () => {
    emit("focus:clear");
  };

  const toggleCompareSelection = (moment) => {
    setCompareSelection((prev) => {
      const exists = prev.some((entry) => entry.id === moment.id);
      if (exists) {
        return prev.filter((entry) => entry.id !== moment.id);
      }

      if (prev.length >= 3) {
        return prev;
      }

      return [...prev, moment];
    });
  };

  const openComparison = () => {
    if (compareSelection.length < 2) return;
    setCompareSnapshot(compareSelection.map((moment) => ({ ...moment })));
    setShowCompare(true);
  };

  const closeComparison = () => {
    setShowCompare(false);
    setCompareSnapshot(null);
  };

  useEffect(() => {
    if (compareSelection.length < 2 && showCompare) {
      setShowCompare(false);
      setCompareSnapshot(null);
    }
  }, [compareSelection, showCompare]);

  useEffect(() => {
    setCompareSelection((prev) => {
      const next = prev.filter((entry) =>
        moments.some((moment) => moment.id === entry.id)
      );
      return next.length === prev.length ? prev : next;
    });
  }, [moments]);

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
        id: momentData.id ?? momentData.ts ?? momentData.timestamp,
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
            setVisibleInsights(hiddenInsights);
            setShowInsights((v) => !v);
          }}
          style={{ padding: "6px 10px", cursor: "pointer" }}
        >
          Insights
        </button>
      </header>

      <section style={{ marginBottom: "1rem" }}>
        <h3>Session Focus</h3>

        {focus ? (
          <div style={{ marginBottom: "0.5rem" }}>
            <strong>Active Focus:</strong>
            <div>{focus.text}</div>
          </div>
        ) : (
          <div style={{ marginBottom: "0.5rem", opacity: 0.6 }}>
            No active focus
          </div>
        )}

        <input
          type="text"
          placeholder="Enter session focus"
          value={focusInput}
          onChange={(event) => setFocusInput(event.target.value)}
          style={{ width: "100%", marginBottom: "0.5rem" }}
        />

        <button onClick={handleSetFocus}>Set Focus</button>
        <button onClick={handleClearFocus} style={{ marginLeft: "0.5rem" }}>
          Clear Focus
        </button>
      </section>

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
      {showInsights && visibleInsights && (
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

          {Array.isArray(visibleInsights) && visibleInsights.length ? (
            Object.entries(
              visibleInsights.reduce((acc, insight) => {
                const key = insight.category ?? "Other";
                acc[key] = acc[key] || [];
                acc[key].push(insight);
                return acc;
              }, {})
            ).map(([category, insights]) => (
              <div key={category} style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    color: "#555",
                    marginBottom: 6,
                  }}
                >
                  {category.toUpperCase()}
                </div>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {insights.map((insight) => (
                    <li key={insight.id} style={{ marginBottom: 6 }}>
                      {insight.language}
                      {typeof insight.confidence === "number" && (
                        <span style={{ color: "#777", fontSize: "0.8rem" }}>
                          {" "}
                          (confidence {Math.round(insight.confidence * 100)}%)
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <p style={{ margin: 0, color: "#555" }}>
              No insights available for this moment.
            </p>
          )}
        </div>
      )}

      <div
        style={{
          padding: "12px",
          border: "1px solid #ddd",
          borderRadius: 8,
          marginBottom: 20,
          background: "#fff",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Moment History</h3>
        <p style={{ margin: "0 0 12px", color: "#555" }}>
          Tap up to three moments to hold them side-by-side for context.
        </p>

        {moments.length ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxHeight: 320,
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            {moments.map((moment) => (
              <MomentRow
                key={moment.id}
                moment={moment}
                selected={compareSelection.some(
                  (entry) => entry.id === moment.id
                )}
                onClick={() => toggleCompareSelection(moment)}
              />
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, color: "#555" }}>
            Waiting for moment history…
          </p>
        )}

        {compareSelection.length >= 2 && (
          <button
            type="button"
            onClick={openComparison}
            style={{
              marginTop: 12,
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #222",
              background: "#222",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Compare Moments
          </button>
        )}

        {showCompare && compareSnapshot && (
          <div
            className="moment-compare-panel"
            style={{
              marginTop: 12,
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 12,
              background: "#fefefe",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <strong>Moment comparison</strong>
              <button
                type="button"
                onClick={closeComparison}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#222",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                Close
              </button>
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              {compareSnapshot.map((moment, index) => (
                <div
                  key={index}
                  className="moment-column"
                  style={{
                    flex: "1 1 200px",
                    border: "1px solid #eee",
                    borderRadius: 6,
                    padding: 8,
                    background: "#fff",
                  }}
                >
                  <div
                    className="moment-header"
                    style={{
                      marginBottom: 6,
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#333",
                    }}
                  >
                    Moment {index + 1}
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      maxHeight: 220,
                      overflowY: "auto",
                      fontSize: "0.7rem",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {JSON.stringify(moment, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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

function MomentRow({ moment, onClick, selected }) {
  const formattedTime = moment.ts
    ? new Date(moment.ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "waiting";

  const primaryLabel =
    typeof moment.label === "string"
      ? moment.label
      : moment.trainer && typeof moment.trainer === "object"
        ? moment.trainer.actionType ?? "Trainer Action"
        : typeof moment.emotion === "string"
          ? moment.emotion.charAt(0).toUpperCase() + moment.emotion.slice(1)
          : "Moment";

  const trainerLabel =
    moment.trainer && typeof moment.trainer === "object"
      ? moment.trainer.actionType ?? moment.trainer.type ?? "momentary signal"
      : moment.trainer;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        borderRadius: 8,
        border: selected ? "2px solid #0066ff" : "1px solid #ddd",
        background: selected ? "#e8f5ff" : "#fff",
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          fontWeight: 600,
        }}
      >
        <span>{primaryLabel}</span>
        <span style={{ fontSize: "0.75rem", color: "#555" }}>
          {formattedTime}
        </span>
      </div>
      <div style={{ fontSize: "0.8rem", color: "#333" }}>
        Pulse {typeof moment.pulse === "number" ? moment.pulse : "—"} · Safety{" "}
        {moment.safety ?? "none"}
      </div>
      {moment.message && (
        <div style={{ fontSize: "0.75rem", color: "#444" }}>
          {typeof moment.message === "string"
            ? moment.message
            : JSON.stringify(moment.message)}
        </div>
      )}
      {trainerLabel && (
        <div
          style={{
            fontSize: "0.7rem",
            color: "#0066ff",
            textTransform: "capitalize",
          }}
        >
          Trainer · {trainerLabel}
        </div>
      )}
    </button>
  );
}
