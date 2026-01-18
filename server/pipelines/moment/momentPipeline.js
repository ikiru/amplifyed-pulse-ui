// ------------------------------------------------------------------
// Moment Pipeline (Phase 2.4.1)
// Phase 3 Patch:
// Inject emotionPipeline.applyEmotion() before dispatch.
// ------------------------------------------------------------------
// Responsibilities:
// * Maintain a rolling moment history buffer
// * Dispatch finalized moment envelopes to all trainer clients
// * Provide safe getter for history during reconnect
//
// Never:
// * Read pulse/emotion/session state directly
// * Mutate other pipelines
// ------------------------------------------------------------------

export function createMomentPipeline(io, emotionPipeline = null) {
  const MAX_HISTORY = 200;
  const momentHistoryBySession = new Map(); // sessionId -> envelope[]

  function ensureSession(sessionId) {
    const sid = sessionId || "session:default";
    if (!momentHistoryBySession.has(sid)) {
      momentHistoryBySession.set(sid, []);
    }
    return momentHistoryBySession.get(sid);
  }

  function addMoment(envelope) {
    if (!envelope) return;
    const sessionId = envelope?.sessionId ?? "session:default";

    // Phase 3: Apply emotional evaluation before dispatch
    let enriched = envelope;
    if (emotionPipeline && typeof emotionPipeline.applyEmotion === "function") {
      try {
        enriched = emotionPipeline.applyEmotion(envelope);
      } catch (err) {
        console.error("[Emotion] applyEmotion failed:", err);
        enriched = envelope;
      }
    }

    const history = ensureSession(sessionId);
    history.push(enriched);
    if (history.length > MAX_HISTORY) {
      history.shift();
    }

    if (
      emotionPipeline &&
      typeof emotionPipeline.handleMoment === "function"
    ) {
      try {
        emotionPipeline.handleMoment(enriched);
      } catch (err) {
        console.error("[Emotion] handleMoment failed:", err);
      }
    }

    io.to(`${sessionId}:trainers`).emit("moment:update", enriched);
  }

  function getHistory(sessionId) {
    if (sessionId) {
      const history = ensureSession(sessionId);
      return [...history];
    }
    // Backwards-compat: without sessionId, return a flattened snapshot.
    return Array.from(momentHistoryBySession.values()).flat();
  }

  return {
    addMoment,
    getHistory,
  };
}
