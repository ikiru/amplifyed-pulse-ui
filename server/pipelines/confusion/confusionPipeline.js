/**
 * Confusion Pipeline
 *
 * Orchestrates confusion signal handling.
 * No router assumptions. No socket knowledge.
 */

// BEGIN CONFUSION SIGNAL

import {
  handleConfusionSignal as persistConfusionSignal,
  handleConfusionClear as persistConfusionClear,
} from "./confusion.handleSignal.js";
import { broadcastConfusionUpdate } from "./confusion.broadcast.js";
import {
  getContributorCount,
  getSessionConfusion,
  resolveConfusionEnvelope,
} from "./confusion.state.js";

export function createConfusionPipeline(io) {
  // Debounce per-session so one busy room doesn't throttle another.
  const lastBroadcastTsBySession = new Map();
  const BROADCAST_DEBOUNCE_MS = 1500;
  const pipelineIo = io;

  const determineLevel = (entry) => {
    const contributorCount = getContributorCount(entry);
    // Prefer the unique contributor-based counter (confusionScore).
    const uniqueScore =
      typeof entry?.confusionScore === "number"
        ? entry.confusionScore
        : contributorCount;

    if (uniqueScore >= 3 || contributorCount >= 3) {
      return "high";
    }
    if (uniqueScore >= 2 || contributorCount >= 2) {
      return "medium";
    }
    return "low";
  };

  const buildEnvelopes = (sessionState) =>
    sessionState.map((entry) => ({
      rootMessageId: entry.rootMessageId,
      level: determineLevel(entry),
      contributors: getContributorCount(entry),
      resolvedAt: entry.resolvedAt,
      resolvedBy: entry.resolvedBy,
      resolutionType: entry.resolutionType,
    }));

  const broadcastSession = (socketIo, sessionId, force = false) => {
    if (!socketIo || !sessionId) {
      return;
    }
    const now = Date.now();

    const lastTs = lastBroadcastTsBySession.get(sessionId) ?? 0;
    if (!force && now - lastTs < BROADCAST_DEBOUNCE_MS) {
      return;
    }

    lastBroadcastTsBySession.set(sessionId, now);

    const sessionState = getSessionConfusion(sessionId);
    broadcastConfusionUpdate({
      io: socketIo,
      sessionId,
      envelopes: buildEnvelopes(sessionState),
    });
  };

  return {
    handleConfusionSignal({
      io = pipelineIo,
      sessionId,
      rootMessageId,
      participantId,
      source,
      scoreDelta = 0,
      contributorDelta = 0,
      ts = Date.now(),
    }) {
      persistConfusionSignal({
        sessionId,
        rootMessageId,
        participantId,
        source,
        scoreDelta,
        contributorDelta,
        ts,
      });

      broadcastSession(io, sessionId);
    },
    handleConfusionClear({
      io = pipelineIo,
      sessionId,
      rootMessageId,
      participantId,
      ts = Date.now(),
    }) {
      if (!sessionId || !rootMessageId || !participantId) {
        return;
      }

      persistConfusionClear({
        sessionId,
        rootMessageId,
        participantId,
        ts,
      });

      broadcastSession(io, sessionId);
    },
    handleConfusionResolution({
      io = pipelineIo,
      sessionId,
      rootMessageId,
      resolutionType,
    }) {
      // Stage 2 records the trainer's response to confusion; it never decides whether confusion mattered.
      if (!sessionId || !rootMessageId || !resolutionType) {
        return;
      }

      const updated = resolveConfusionEnvelope({
        sessionId,
        rootMessageId,
        resolutionType,
      });
      if (!updated) {
        return;
      }

      broadcastSession(io, sessionId, true);
    },
    /**
     * Sync confusion state to a specific socket (for join/rejoin)
     * 
     * @param {Object} socket - Socket.IO socket instance
     * @param {string} sessionId - Session identifier
     */
    syncConfusionState(socket, sessionId) {
      if (!socket || !sessionId) {
        return;
      }

      const sessionState = getSessionConfusion(sessionId);
      const envelopes = buildEnvelopes(sessionState);

      // Clients subscribe to `confusion:update`; use the same event for sync.
      socket.emit("confusion:update", {
        sessionId,
        threads: envelopes,
      });
    },
  };
}

// END CONFUSION SIGNAL
