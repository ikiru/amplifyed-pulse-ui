/**
 * Pulse State Module (Step 7.3.1 — Scaffold Only)
 * No logic moved here yet.
 * This will gradually replace inline roomState in pulsePipeline.
 */

export function createPulseState() {

  // ----------------------------------------------------
  // REAL PULSE STATE (moved from pulsePipeline)
  // ----------------------------------------------------
  const state = {
    votes: {},          // updated by Pulse Pipeline
    eventLog: [],       // pulse event log
  };


  // ----------------------------------------------------
  // ACCESSORS
  // ----------------------------------------------------
  return {
    state,

    // Participant state (Session Pipeline writes here)
    // Pulse votes
    setVote(id, value) {
      state.votes[id] = value;
    },

    clearVote(id) {
      state.votes[id] = null;
    },

    // Event log
    addEventLog(entry) {
      state.eventLog.push(entry);
    },
  };
}
