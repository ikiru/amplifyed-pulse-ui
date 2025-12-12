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
  const momentHistory = [];

  function addMoment(envelope) {
    if (!envelope) return;

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

    momentHistory.push(enriched);
    if (momentHistory.length > MAX_HISTORY) {
      momentHistory.shift();
    }

    io.emit("moment:update", enriched);
  }

  function getHistory() {
    return [...momentHistory];
  }

  return {
    addMoment,
    getHistory,
  };
}
