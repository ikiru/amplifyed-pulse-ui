/**
 * Confusion Pipeline
 *
 * Orchestrates confusion signal handling.
 * No router assumptions. No socket knowledge.
 */

// BEGIN CONFUSION SIGNAL

import {
  handleConfusionSignal as persistConfusionSignal,
} from "./confusion.handleSignal.js";
import { broadcastConfusionUpdate } from "./confusion.broadcast.js";
import {
  getContributorCount,
  getSessionConfusion,
  resolveConfusionEnvelope,
} from "./confusion.state.js";

export function createConfusionPipeline(io) {
  let lastBroadcastTs = 0;
  const BROADCAST_DEBOUNCE_MS = 1500;
  const pipelineIo = io;

  const determineLevel = (entry) => {
    let level = "low";
    const contributorCount = getContributorCount(entry);

    if (contributorCount >= 3 || entry.score >= 5) {
      level = "high";
    } else if (contributorCount >= 2 || entry.score >= 2) {
      level = "medium";
    }

    return level;
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

    if (!force && now - lastBroadcastTs < BROADCAST_DEBOUNCE_MS) {
      return;
    }

    lastBroadcastTs = now;

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

      socket.emit('confusion:advisory', {
        sessionId,
        threads: envelopes,
      });
    },
  };
}

// END CONFUSION SIGNAL
