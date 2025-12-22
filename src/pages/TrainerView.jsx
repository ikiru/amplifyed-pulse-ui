import React, { useEffect, useState } from "react";
import { useSocket } from "../socket/SocketContext.jsx";
import { adaptMessage } from "./messageHelpers.js";
import { buildMessageTree, ThreadItem } from "./messageThread.jsx";
import "./AudienceInput.css";
import "./TrainerView.css";

const MOMENT_HISTORY_LIMIT = 18;
const pulseOptions = [
  { value: "frustrated", label: "Frustrated" },
  { value: "neutral", label: "Neutral" },
  { value: "engaged", label: "Engaged" },
];

export default function TrainerView() {
  const { emit, onEvent, offEvent, connectionStatus } = useSocket();
  const [focus, setFocus] = useState(null);
  const [focusInput, setFocusInput] = useState("");
  const [livePulse, setLivePulse] = useState(null);
  const [messages, setMessages] = useState([]);
  const [voteTotals, setVoteTotals] = useState({});
  const [selectedPulse, setSelectedPulse] = useState("neutral");
  const [momentData, setMomentData] = useState(null);
  const [trainerSignal, setTrainerSignal] = useState(null);
  const [showInsights, setShowInsights] = useState(false);
  const [hiddenInsights, setHiddenInsights] = useState(null);
  const [visibleInsights, setVisibleInsights] = useState(null);
  const [moments, setMoments] = useState([]);
  const [compareSelection, setCompareSelection] = useState([]);
  const [compareSnapshot, setCompareSnapshot] = useState(null);
  const [showCompare, setShowCompare] = useState(false);
  const [trainerInput, setTrainerInput] = useState("");
  const [trainerReplyToId, setTrainerReplyToId] = useState(null);
  const [trainerReplyDrafts, setTrainerReplyDrafts] = useState({});

  // PulseTimeline now relies directly on the `pulse:update` payload so the visual stays tied to the canonical stream without cached selectors.
  const participantCount =
    typeof livePulse?.participantCount === "number"
      ? livePulse.participantCount
      : livePulse?.participants
        ? Object.keys(livePulse.participants).length
        : undefined;

  useEffect(() => {
    if (livePulse && participantCount === undefined) {
      console.warn(
        "[TrainerView] pulse:update payload missing participants info required for PulseTimeline scale."
      );
    }
  }, [livePulse, participantCount]);

  // -------------------------------
  // Socket listeners
  // -------------------------------
  useEffect(() => {
    // src/pages/TrainerView.jsx — `livePulse` is the canonical state key updated by the server’s `pulse:update` event whenever audience votes change.
    const handlePulse = (payload) => {
      if (!payload) {
        setLivePulse(null);
        return;
      }

      const nextPulse = {
        ...payload,
        participants:
          payload.participants && typeof payload.participants === "object"
            ? { ...payload.participants }
            : payload.participants,
        eventLog: Array.isArray(payload.eventLog)
          ? payload.eventLog.map((entry) => (entry ? { ...entry } : entry))
          : payload.eventLog,
      };

      setLivePulse(nextPulse);
    };

    onEvent("pulse:update", handlePulse);
    return () => offEvent("pulse:update", handlePulse);
  }, [onEvent, offEvent]);

  useEffect(() => {
    const handleMessageStateUpdate = ({ messages: canonicalMessages }) => {
      if (!Array.isArray(canonicalMessages)) return;

      const adapted = canonicalMessages
        .map(adaptMessage)
        .filter(Boolean);

      setMessages(adapted);
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

    onEvent("message.state.update", handleMessageStateUpdate);
    onEvent("moment:update", handleMomentUpdate);
    onEvent("trainer:signal", handleTrainerSignal);

    return () => {
      offEvent("message.state.update", handleMessageStateUpdate);
      offEvent("moment:update", handleMomentUpdate);
      offEvent("trainer:signal", handleTrainerSignal);
    };
  }, [onEvent, offEvent]);

  useEffect(() => {
    const handleVoteUpdate = ({ messageId, totals }) => {
      if (!messageId || !totals) {
        return;
      }

      setVoteTotals((prev) => ({
        ...prev,
        [messageId]: totals,
      }));
    };

    onEvent("message.vote.update", handleVoteUpdate);
    return () => offEvent("message.vote.update", handleVoteUpdate);
  }, [onEvent, offEvent]);

  // -------------------------------
  // Focus sync
  // -------------------------------
  useEffect(() => {
    // Phase 8.6.1 — normalize focus payloads at boundary
    const handleFocusUpdate = (payload) => {
      console.log("[FOCUS] raw payload received:", payload);

      if (!payload) {
        console.log("[FOCUS] payload empty → clearing focus");
        setFocus(null);
        return;
      }

      // Most common / expected
      if (typeof payload === "string") {
        console.log("[FOCUS] normalized string:", payload);
        setFocus(payload);
        return;
      }

      // focus:update payload shape
      if (typeof payload.text === "string") {
        console.log("[FOCUS] normalized payload.text:", payload.text);
        setFocus(payload.text);
        return;
      }

      // Defensive: nested focus object
      if (payload.focus && typeof payload.focus.text === "string") {
        console.log(
          "[FOCUS] normalized payload.focus.text:",
          payload.focus.text
        );
        setFocus(payload.focus.text);
        return;
      }

      // Unknown shape — do not render garbage
      console.log("[FOCUS] unknown payload shape → clearing", payload);
      setFocus(null);
    };

    const handleFocusCleared = () => {
      console.log("[FOCUS] focus:cleared event received");
      setFocus(null);
    };

    onEvent("focus:update", handleFocusUpdate);
    onEvent("focus:set", handleFocusUpdate); // alias safety
    onEvent("focus:cleared", handleFocusCleared);

    return () => {
      offEvent("focus:update", handleFocusUpdate);
      offEvent("focus:set", handleFocusUpdate);
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

  const handlePulseSelection = (pulse) => {
    if (!pulse) return;
    setSelectedPulse(pulse);
    emit("audience:pulse", { pulse });
  };

  const handleSetFocus = (event) => {
    event.preventDefault();
    const text = focusInput.trim();
    if (!text) return;

    emit("focus:set", { text });
    setFocusInput("");
  };

  const handleClearFocus = () => {
    emit("focus:cleared");
  };

  const emitTrainerMessage = ({ text, parentMessageId = null }) => {
    const trimmed = text?.trim();
    if (!trimmed) {
      return false;
    }

    emit("message:trainerReply", {
      content: { type: "text", text: trimmed },
      parentMessageId,
    });

    return true;
  };

  const handleTrainerSubmit = (event) => {
    event.preventDefault();
    if (emitTrainerMessage({ text: trainerInput })) {
      setTrainerInput("");
    }
  };

  const handleTrainerReplySubmit = (parentMessageId) => {
    const draft = trainerReplyDrafts[parentMessageId] ?? "";
    if (!emitTrainerMessage({ text: draft, parentMessageId })) {
      return;
    }

    setTrainerReplyDrafts((prev) => {
      const next = { ...prev };
      delete next[parentMessageId];
      return next;
    });
    setTrainerReplyToId(null);
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

  const activeMomentSignals = [
    ...(Array.isArray(momentData?.signals) ? momentData.signals : []),
    trainerSignal ? trainerSignal.actionType : null,
  ].filter(Boolean);

  const activeMoment = momentData
    ? {
        label: momentData.label ?? momentData.id ?? "Active moment",
        signals: activeMomentSignals,
      }
    : null;

  const messageRoots = buildMessageTree(messages);

  const renderPulseVotes = () => {
    if (!livePulse || !livePulse.votes) {
      return null;
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
  };

  const renderPulseSummary = () => (
    <>
      <p style={{ fontSize: "0.9rem", color: "#666", marginTop: "-8px" }}>
        Last update: {formattedLastMoment}
      </p>
      {renderPulseVotes()}
      {/* LEFT COLUMN pulse timeline (non-authoritative) */}
    </>
  );

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 2fr 1fr",
          gap: "12px",
          padding: "12px",
        }}
      >
        <div data-column="left">
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
                <h1 style={{ margin: 0 }}>Session View</h1>
                <p style={{ margin: 0, color: "#666" }}>
                  Socket: {connectionStatus}
                </p>
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

            {/* Pulse Summary (MOVED HERE) */}
            <section
              className="pulse-summary"
              style={{
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: 8,
                marginBottom: 20,
                background: "#fff",
              }}
            >
              <h2>Pulse Summary</h2>
              {renderPulseSummary()}
              <div
                className="pulse-bar"
                style={{
                  position: "static",
                  marginTop: 12,
                  background: "transparent",
                  borderBottom: "none",
                  padding: 0,
                }}
              >
                {pulseOptions.map((pulse) => (
                  <button
                    key={pulse.value}
                    onClick={() => handlePulseSelection(pulse.value)}
                    className={`pulse-button ${
                      selectedPulse === pulse.value ? "active" : ""
                    }`}
                  >
                    {pulse.label}
                  </button>
                ))}
              </div>
            </section>

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
                <h3 style={{ marginTop: 0 }}>Insights</h3>

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
                    No insights available
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
              <h3 style={{ marginTop: 0 }}>Moments</h3>
              <p style={{ margin: "0 0 12px", color: "#555" }}>
                Select up to three moments
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
                  No moments yet
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
                  Compare
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
                    <strong>Comparison</strong>
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

            <div
              style={{
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: 8,
                marginBottom: 20,
                background: "#f9f9f9",
              }}
            >
              <h3 style={{ marginTop: 0 }}>Moment</h3>
              {momentData ? (
                <>
                  <p style={{ margin: "4px 0" }}>
                    Moment ID: {momentData.label ?? momentData.id ?? "unknown"}
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
              ) : null}
            </div>

            <div
              style={{
                padding: "12px",
                borderRadius: 8,
                border: "1px solid #ddd",
                background: "#f4f4f4",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: 8 }}>Signals</h3>
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
                <p style={{ margin: 0, color: "#555" }}>No signal data</p>
              )}
            </div>
          </div>
        </div>

        <div
          data-column="center"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {/* ===== Pulse ===== */}
          <section>
            <h2>Pulse</h2>
            {/* CENTER COLUMN pulse timeline (authoritative) */}
            <PulseTimeline
              eventLog={livePulse?.eventLog ?? []}
              participantsCount={participantCount}
            />
          </section>

          <section
            style={{
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: 8,
              marginBottom: 12,
              background: "#fff",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Focus</h3>
            <p style={{ margin: 0, color: "#444" }}>
              {focus ?? "No focus set"}
            </p>
          </section>

            <div
              style={{
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: 8,
                marginBottom: 20,
                background: "#fff",
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 420,
              }}
            >
              <h3 style={{ marginTop: 0 }}>Messages</h3>

              {messageRoots.length ? (
                <div
                  className="message-stream trainer-message-stream"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    flex: 1,
                    minHeight: 360,
                    overflowY: "auto",
                    fontSize: "0.85rem",
                  }}
                >
                  {messageRoots.map((root) => (
                    <ThreadItem
                      key={root.messageId}
                      node={root}
                      depth={0}
                      replyToId={trainerReplyToId}
                      setReplyToId={setTrainerReplyToId}
                      replyDrafts={trainerReplyDrafts}
                      setReplyDrafts={setTrainerReplyDrafts}
                      handleSubmitReply={handleTrainerReplySubmit}
                      voteTotals={voteTotals[root.messageId]}
                      voteTotalsMap={voteTotals}
                      showVoteControls={true}
                    />
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, color: "#555" }}>No messages yet</p>
              )}

              <form className="message-input-bar" onSubmit={handleTrainerSubmit}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={trainerInput}
                  onChange={(event) => setTrainerInput(event.target.value)}
                />
                <button type="submit">Send</button>
              </form>
            </div>

          <section
            style={{
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: 8,
              marginBottom: 20,
              background: "#fafafa",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Active Moment</h3>

            {activeMoment ? (
              <div style={{ fontSize: "0.85rem", lineHeight: 1.4 }}>
                <div>
                  <strong>Moment:</strong> {activeMoment.label}
                </div>

                {activeMoment.signals?.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    <strong>Signals:</strong>
                    <ul style={{ margin: "4px 0 0 16px" }}>
                      {activeMoment.signals.map((signal, index) => (
                        <li key={index}>{signal}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>
                No active moment detected.
              </p>
            )}
          </section>
        </div>
        {/* ================= RIGHT COLUMN ================= */}
        <div data-column="right">
          <section style={{ marginBottom: "1rem" }}>
            <h3>Focus Controls</h3>
            <p
              style={{
                margin: "0 0 0.5rem",
                color: "#555",
                fontSize: "0.85rem",
              }}
            >
              Current focus is visible above the messages panel.
            </p>

            <input
              type="text"
              placeholder=""
              value={focusInput}
              onChange={(event) => setFocusInput(event.target.value)}
              style={{ width: "100%", marginBottom: "0.5rem" }}
            />

            <button onClick={handleSetFocus}>Set Focus</button>
            <button onClick={handleClearFocus} style={{ marginLeft: "0.5rem" }}>
              Clear Focus
            </button>
          </section>

          <div
            style={{
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: 8,
              marginBottom: 12,
              background: "#fafafa",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Controls</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                ["slowdown", "Slowdown"],
                ["speedup", "Speedup"],
                ["break", "Break"],
                ["checkin", "Checkin"],
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

          {/* Session Metadata */}
          <section
            style={{
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: 8,
              marginBottom: 12,
              background: "#fff",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Session Info</h3>
            <p style={{ fontSize: "0.85rem", color: "#666", margin: 0 }}>
              Session metadata will appear here.
            </p>
          </section>

          {/* Insights Placeholder (read-only) */}
          <section
            style={{
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: 8,
              marginBottom: 12,
              background: "#fff",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Insights</h3>
            <p style={{ fontSize: "0.85rem", color: "#666", margin: 0 }}>
              Insights will appear here after the session.
            </p>
          </section>

          {/* Prior Moments (read-only) */}
          <section
            style={{
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: 8,
              marginBottom: 12,
              background: "#fff",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Prior Moments</h3>
            <p style={{ fontSize: "0.85rem", color: "#666", margin: 0 }}>
              No prior moments available.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function PulseTimeline({ eventLog = [], participantsCount = 0 }) {
  const canonicalPulseMap = {
    engaged: 1,
    neutral: 0,
    frustrated: -1,
  };

  const normalizedEvents = (Array.isArray(eventLog) ? eventLog : [])
    .map((entry, index) => {
      if (!entry) {
        return null;
      }

      const rawValue =
        typeof entry.value === "number"
          ? entry.value
          : canonicalPulseMap[entry.value];
      if (
        rawValue === null ||
        rawValue === undefined ||
        (rawValue !== 1 && rawValue !== 0 && rawValue !== -1)
      ) {
        return null;
      }

      return {
        ts: entry.ts ?? entry.timestamp ?? Date.now() + index,
        value: rawValue,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.ts - b.ts);

  const hasParticipantData = Number.isFinite(participantsCount);
  const participantScale = hasParticipantData ? participantsCount : 0;
  // displayCount bottoms out at 1 so a visible ± range exists even with zero/missing participants, and the left labels are strictly diagnostics for verifying that participant-based scaling.
  const displayCount = Math.max(1, participantScale);
  const minY = -displayCount;
  const maxY = displayCount;
  const safeScale = displayCount;

  const timelinePoints = [];
  const startTs = normalizedEvents[0]?.ts ?? Date.now();
  timelinePoints.push({ ts: startTs, netValue: 0 });

  let previousVote = 0;
  let netValueTotal = 0;

  normalizedEvents.forEach((entry) => {
    const delta = entry.value - previousVote;
    netValueTotal += delta;

    timelinePoints.push({
      ts: entry.ts,
      netValue: netValueTotal,
    });

    previousVote = entry.value;
  });

  const width =
    Math.max(360, Math.max(normalizedEvents.length - 1, 0) * 48 + 80);
  const height = 180;
  const centerY = height / 2;
  const amplitude = centerY - 16;

  const earliestTs = timelinePoints[0]?.ts ?? Date.now();
  const latestTs = timelinePoints[timelinePoints.length - 1]?.ts ?? earliestTs;
  const span = Math.max(latestTs - earliestTs, 1);

  const xForTs = (ts) => {
    const progress = (ts - earliestTs) / span;
    return Math.max(0, Math.min(width, progress * width));
  };

  const yForValue = (value) =>
    centerY - (value / safeScale) * amplitude;

  const commands = timelinePoints.map((point, index) => {
    const x = xForTs(point.ts);
    const y = yForValue(point.netValue);
    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });

  const latestNetValue =
    timelinePoints[timelinePoints.length - 1]?.netValue ?? 0;
  commands.push(
    `L ${width.toFixed(2)} ${yForValue(latestNetValue).toFixed(2)}`
  );

  const pathD = commands.join(" ");

  const formatAxisTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const netLabel =
    latestNetValue >= 0 ? `+${latestNetValue}` : `${latestNetValue}`;
  const voteLabelMap = {
    1: "Engaged",
    0: "Neutral",
    "-1": "Frustrated",
  };
  const latestVote = normalizedEvents[normalizedEvents.length - 1]?.value ?? 0;

  const scaleLabel = hasParticipantData
    ? `Scale based on participants: ±${participantsCount}`
    : "Scale based on participants: ±1 (participant data pending)";

  const axisLineValues = [maxY, 0, minY];

  return (
    <div className="pulse-timeline">
      <div className="pulse-timeline-header">
        <div>
          <div className="pulse-timeline-title">Pulse timeline</div>
          <div className="pulse-timeline-scale">{scaleLabel}</div>
        </div>
        <div className="pulse-timeline-current">
          Net movement: {netLabel} · Last vote: {voteLabelMap[latestVote] ?? "Neutral"}
        </div>
      </div>
      <div className="pulse-timeline-track">
        <div
          className="pulse-timeline-track-inner"
          style={{ minHeight: height }}
        >
          <div
            className="pulse-timeline-scale-axis"
            style={{ height }}
            aria-hidden="true"
          >
            {[
              { value: maxY, label: maxY >= 0 ? `+${maxY}` : `${maxY}`, key: "max" },
              { value: 0, label: "0", key: "zero" },
              { value: minY, label: `${minY}`, key: "min" },
            ].map(({ value, label, key }) => (
              <span
                key={`scale-label-${key}`}
                className="pulse-timeline-scale-label"
                style={{ top: `${yForValue(value)}px` }}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="pulse-timeline-svg-wrapper">
            <svg
              className="pulse-timeline-svg"
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
            >
              {axisLineValues.map((value) => (
                <line
                  key={`axis-${value}`}
                  x1="0"
                  x2={width}
                  y1={yForValue(value)}
                  y2={yForValue(value)}
                  stroke="#eee"
                  strokeWidth="1"
                />
              ))}
              <line
                x1="0"
                x2={width}
                y1={height - 4}
                y2={height - 4}
                stroke="#ccc"
                strokeWidth="1"
              />
              <path d={pathD} fill="none" stroke="#0066ff" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
      <div className="pulse-timeline-legend">
        <span>Net movement history</span>
        <span>±1 per vote</span>
        <span>Driven by pulse:update</span>
      </div>
      {timelinePoints.length > 1 && (
        <div className="pulse-timeline-time-axis">
          <span>{formatAxisTime(earliestTs)}</span>
          <span>{formatAxisTime(latestTs)}</span>
        </div>
      )}
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
