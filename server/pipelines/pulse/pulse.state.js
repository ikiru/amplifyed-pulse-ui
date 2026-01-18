/**
 * Pulse State Module (Step 7.3.1 — Scaffold Only)
 * No logic moved here yet.
 * This will gradually replace inline roomState in pulsePipeline.
 */

export function createPulseState() {

  // ----------------------------------------------------
  // REAL PULSE STATE (moved from pulsePipeline)
  // ----------------------------------------------------
  const stateBySession = new Map(); // sessionId -> { votes, eventLog }

  function ensureSession(sessionId) {
    const sid = sessionId || "session:default";
    if (!stateBySession.has(sid)) {
      stateBySession.set(sid, {
        votes: {},
        eventLog: [],
      });
    }
    return stateBySession.get(sid);
  }

  // ----------------------------------------------------
  // ACCESSORS
  // ----------------------------------------------------
  return {
    getSessionState(sessionId) {
      return ensureSession(sessionId);
    },

    getSessionSnapshot(sessionId) {
      const s = ensureSession(sessionId);
      return {
        votes: s.votes ?? {},
        eventLog: s.eventLog ?? [],
      };
    },

    // Participant state (Session Pipeline writes here)
    // Pulse votes
    setVote(sessionId, id, value) {
      const s = ensureSession(sessionId);
      s.votes[id] = value;
    },

    clearVote(sessionId, id) {
      const s = ensureSession(sessionId);
      // Remove entirely to avoid unbounded growth across reconnects.
      delete s.votes[id];
    },

    // Event log
    addEventLog(sessionId, entry) {
      const s = ensureSession(sessionId);
      s.eventLog.push(entry);
    },
  };
}
