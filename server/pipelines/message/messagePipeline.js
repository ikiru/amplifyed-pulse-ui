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
import {
  broadcastAudienceMessage,
  broadcastMessageState,
} from "./message.broadcast.js";
import { addMessage } from "./message.state.js";
import { v4 as uuidv4 } from "uuid";

export function createMessagePipeline(io, momentBuilder = null) {

  function handleAudienceMessage({
    socketId,
    sessionId,
    text,
    content,
    parentMessageId,
  } = {}) {
    const effectiveContent = content ?? (text ? { type: "text", text } : null);
    if (!effectiveContent) return;

    const now = Date.now();
    const resolvedSessionId = sessionId;
    if (!resolvedSessionId) return; // hard guard — no silent corruption
    const messageId = uuidv4();

    const message = formatMessage({
      messageId,
      sessionId: resolvedSessionId,
      authorRole: "audience",
      timestamp: now,
      parentMessageId: parentMessageId ?? null,
      content: effectiveContent,
    });

    // ✅ Authoritative state mutation
    addMessage({ sessionId: resolvedSessionId, message });

    broadcastAudienceMessage(io, message);

    // ✅ Authoritative snapshot broadcast (Trainer + Audience + Late Join)
    broadcastMessageState({ io, sessionId: resolvedSessionId });

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
