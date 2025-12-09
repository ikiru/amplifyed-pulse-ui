// ------------------------------------------------------------------
// Message Pipeline
// ------------------------------------------------------------------
// MessagePipeline never reads participants or pulse state.
// Only analyzes text → emits messageSignal → contributes to unified moment.
// Owns:
//   Audience messages and derived message signals.
//   Broadcasts messages to Trainer UI.
//
// Never:
//   Touches pulse state or participants.
//
// Phase 2.3.6:
//   Integrates message-derived signals into Moment Builder.
// ------------------------------------------------------------------

import { extractMessageSignal } from "./messageSignalExtractor.js";

export function createMessagePipeline(io, momentBuilder = null) {

  function handleAudienceMessage({ socketId, text }) {
    if (!text) return;

    // 1. Emit raw message (unchanged existing behavior)
    io.emit("audience:message", {
      socketId,
      text,
      timestamp: Date.now()
    });

    // 2. Derive message-level signal
    const messageSignal = extractMessageSignal(text);

    // 3. Add message contribution to unified moment
    if (momentBuilder && messageSignal) {
      momentBuilder.addMessage({ messageSignal });
    }
  }

  return {
    handleAudienceMessage
  };
}
