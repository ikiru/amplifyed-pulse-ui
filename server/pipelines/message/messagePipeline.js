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
import { v4 as uuidv4 } from "uuid";

export function createMessagePipeline(io, momentBuilder = null) {

  function handleAudienceMessage({ socketId, text, content }) {
    const effectiveContent = content ?? (text ? { type: "text", text } : null);
    if (!effectiveContent) return;

    const now = Date.now();
    const sessionId = this.getSessionIdForSocket?.(socketId);

    const message = {
      messageId: uuidv4(),
      sessionId,
      timestamp: now,

      sourceRole: "audience",
      sourceRef: socketId,

      content: effectiveContent,

      parentMessageId: null,
      threadRootId: null,

      reactions: { up: 0, down: 0 },

      state: { visible: true, locked: false },

      // momentId is a referential hook only.
      // Messages may reference an existing moment.
      // Messages do not create, mutate, or evaluate moments.
      // All behavior based on moment association is deferred to later phases.
      momentId: null,
    };

    io.emit("message:audience", message);

    const signalText = text ?? effectiveContent.text;
    const messageSignal = signalText ? extractMessageSignal(signalText) : null;

    if (momentBuilder && messageSignal) {
      momentBuilder.addMessage({ messageSignal });
    }
  }

  return {
    handleAudienceMessage
  };
}
