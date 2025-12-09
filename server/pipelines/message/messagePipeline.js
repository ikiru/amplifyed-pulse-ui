/**
 * Message Pipeline (Step 6.1 — Scaffold Only)
 * No behavior. No socket emits. No state.
 * These handlers will be activated in Step 7.
 */

export function createMessagePipeline(io) {
  return {

    // Audience sends a message to the trainer
    handleAudienceMessage({ socketId, message }) {
      // placeholder — activation happens in Phase 7
    },

    // Trainer replies to audience or thread
    handleTrainerReply({ socketId, reply }) {
      // placeholder — activation happens in Phase 7
    }

  };
}
