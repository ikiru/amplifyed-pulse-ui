/**
 * Trainer Pipeline (Step 6.5 — Scaffold Only)
 * No behavior. No socket emits. No state.
 * Trainer commands will activate in Step 7.
 */

export function createTrainerPipeline(io) {
  return {

    // Generic trainer command (e.g., "start discussion", "silence", etc.)
    handleCommand({ socketId, command, payload }) {
      // placeholder — activation occurs in Step 7
    },

    // Trainer nudges (future use case; you noted uncertainty earlier)
    handleNudge({ socketId, payload }) {
      // placeholder — will be explored in a later phase
    }

  };
}
