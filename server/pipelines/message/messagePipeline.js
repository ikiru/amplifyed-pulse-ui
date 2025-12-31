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
import { broadcastMessageState } from "./message.broadcast.js";
import { addMessage, getMessage } from "./message.state.js";
import { getSessionVoteTotals } from "./message.vote.state.js";
import { broadcastVoteUpdate } from "./message.vote.broadcast.js";
import { v4 as uuidv4 } from "uuid";
import { detectConfusionFromText } from "../../confusion/confusion.phrases.js";
import { handleVoteIntent as processVoteIntent } from "./message.vote.handle.js";
import { setAudienceLabelEmitter } from "../audienceDrift/classification.state.js";
import {
  setAudienceDriftEmitter,
  updateDriftForMessage,
} from "../audienceDrift/aggregation.js";
import {
  FEATURE_AUDIENCE_DRIFT_METER,
  getMeterProjection,
} from "../audienceDrift/meter.js";

function resolveRootMessageId(sessionId, parentMessageId, fallbackId) {
  if (!parentMessageId) {
    return fallbackId;
  }

  let currentId = parentMessageId;
  let nextParentId = parentMessageId;

  while (nextParentId) {
    const parentMessage = getMessage(sessionId, nextParentId);
    if (!parentMessage) {
      break;
    }

    const nextParent = parentMessage.envelope?.parentMessageId;
    if (!nextParent) {
      break;
    }

    currentId = nextParent;
    nextParentId = nextParent;
  }

  return currentId ?? parentMessageId ?? fallbackId;
}

export function createMessagePipeline(io, momentBuilder = null, confusionPipeline = null) {
  setAudienceDriftEmitter((payload) => {
    if (!payload || !io || !payload.sessionId) {
      return;
    }
    console.log(
      "[WIRE_TEST][SERVER_EMIT][AUDIENCE_DRIFT]",
      payload
    );
    // Passive emission boundary; listeners are optional.
    io.to(payload.sessionId).emit("audience:drift:update", payload);
  });

  setAudienceLabelEmitter((payload) => {
    if (!payload || !io || !payload.sessionId) {
      return;
    }
    // Passive emission boundary; listeners are optional.
    io.to(payload.sessionId).emit("audience:label:update", payload);
  });

  function emitDriftProjection(sessionId) {
    if (!FEATURE_AUDIENCE_DRIFT_METER || !sessionId || !io) {
      return;
    }

    const projection = getMeterProjection(sessionId);
    if (!projection) {
      return;
    }

    io.to(sessionId).emit("audience.drift.update", {
      sessionId,
      projection,
    });
  }

  function handleAudienceMessage({
    socketId,
    sessionId: providedSessionId,
    text,
    content,
    parentMessageId,
  } = {}) {
    const effectiveContent = content ?? (text ? { type: "text", text } : null);
    if (!effectiveContent) return;

    const now = Date.now();
    const sessionId =
      providedSessionId ?? this.getSessionIdForSocket?.(socketId);
    if (!sessionId) return;
    const messageId = uuidv4();

    const message = formatMessage({
      messageId,
      sessionId,
      authorRole: "audience",
      timestamp: now,
      parentMessageId: parentMessageId ?? null,
      content: effectiveContent,
    });

    const storedMessage = addMessage({
      sessionId,
      message,
    });
    if (!storedMessage) return;

    // Incremental audience broadcast disabled.
    // Authoritative message state is broadcast below.
    broadcastMessageState({ io, sessionId });

    updateDriftForMessage({
      sessionId,
      messageId,
      timestamp: now,
      focusEpoch: message.envelope?.focusEpoch,
    });

    emitDriftProjection(sessionId);

    const audienceText =
      typeof text === "string"
        ? text
        : typeof effectiveContent === "string"
          ? effectiveContent
          : effectiveContent?.text ?? null;

    const detected = detectConfusionFromText(audienceText);

    if (detected) {
      const rootMessageId = resolveRootMessageId(
        sessionId,
        parentMessageId,
        messageId
      );

      console.groupCollapsed("[CONFUSION][STEP 7.1][DETECTED]");
      console.log("messageId:", messageId);
      console.log("rootMessageId:", rootMessageId);
      console.log("text:", audienceText);
      console.groupEnd();

      if (confusionPipeline?.handleConfusionSignal) {
        console.log("[CONFUSION][STEP 7.2][EMIT]", {
          rootMessageId,
          participantId: socketId,
          source: "detection",
        });

        confusionPipeline.handleConfusionSignal({
          sessionId,
          rootMessageId,
          participantId: socketId,
          source: "detection",
          ts: now,
        });
      }
    }

    const signalText = audienceText;
    const messageSignal = signalText ? extractMessageSignal(signalText) : null;

    if (momentBuilder && messageSignal) {
      momentBuilder.addMessage({ messageSignal });
    }
  }

  function handleTrainerReply({
    socketId,
    sessionId: providedSessionId,
    text,
    content,
    parentMessageId,
  } = {}) {
    const effectiveContent = content ?? (text ? { type: "text", text } : null);
    if (!effectiveContent) return;

    const now = Date.now();
    const sessionId =
      providedSessionId ?? this.getSessionIdForSocket?.(socketId);
    if (!sessionId) return;
    const messageId = uuidv4();

    const message = formatMessage({
      messageId,
      sessionId,
      authorRole: "trainer",
      timestamp: now,
      parentMessageId: parentMessageId ?? null,
      content: effectiveContent,
    });

    const storedMessage = addMessage({
      sessionId,
      message,
    });
    if (!storedMessage) return;

    broadcastMessageState({ io, sessionId });

    updateDriftForMessage({
      sessionId,
      messageId,
      timestamp: now,
      focusEpoch: message.envelope?.focusEpoch,
    });

    emitDriftProjection(sessionId);

    const signalText =
      typeof text === "string"
        ? text
        : typeof effectiveContent === "string"
          ? effectiveContent
          : effectiveContent?.text ?? null;
    const messageSignal = signalText ? extractMessageSignal(signalText) : null;

    if (momentBuilder && messageSignal) {
      momentBuilder.addMessage({ messageSignal });
    }
  }

  function syncSessionState(sessionId) {
    if (!sessionId) return;
    // Always broadcast authoritative message state on session sync
    broadcastMessageState({ io, sessionId });
    // Replay stored vote totals so trainers receive aggregates on join/reconnect.
    const voteTotals = getSessionVoteTotals(sessionId);
    Object.entries(voteTotals).forEach(([messageId, totals]) => {
      broadcastVoteUpdate({
        io,
        sessionId,
        messageId,
        totals,
      });
    });
  }

  function handleVoteIntent(args) {
    return processVoteIntent(args);
  }

  return {
    handleAudienceMessage,
    handleTrainerReply,
    syncSessionState,
    handleVoteIntent,
  };
}
