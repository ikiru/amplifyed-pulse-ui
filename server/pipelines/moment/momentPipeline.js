// ------------------------------------------------------------------
// Moment Pipeline (Phase 2.4.1)
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

export function createMomentPipeline(io) {
  const MAX_HISTORY = 200;
  const momentHistory = [];

  function addMoment(envelope) {
    if (!envelope) return;

    momentHistory.push(envelope);
    if (momentHistory.length > MAX_HISTORY) {
      momentHistory.shift();
    }

    io.emit("moment:update", envelope);
  }

  function getHistory() {
    return [...momentHistory];
  }

  return {
    addMoment,
    getHistory,
  };
}
