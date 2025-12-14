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
import { formatMessage } from "./message.format.js";
import { broadcastAudienceMessage } from "./message.broadcast.js";
import { v4 as uuidv4 } from "uuid";

export function createMessagePipeline(io, momentBuilder = null) {

  function handleAudienceMessage({
    socketId,
    text,
    content,
    parentMessageId,
  } = {}) {
    const effectiveContent = content ?? (text ? { type: "text", text } : null);
    if (!effectiveContent) return;

    const now = Date.now();
    const sessionId = this.getSessionIdForSocket?.(socketId);
    const messageId = uuidv4();

    const message = formatMessage({
      messageId,
      sessionId,
      authorRole: "audience",
      timestamp: now,
      parentMessageId: parentMessageId ?? null,
      content: effectiveContent,
    });

    broadcastAudienceMessage(io, message);

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
