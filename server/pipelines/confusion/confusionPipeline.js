/**
 * Confusion Pipeline
 *
 * Orchestrates confusion signal handling.
 * No router assumptions. No socket knowledge.
 */

// BEGIN CONFUSION SIGNAL

import { handleConfusionSignal } from "./confusion.handleSignal.js";
import { broadcastConfusionUpdate } from "./confusion.broadcast.js";
import { getSessionConfusion } from "./confusion.state.js";

export function createConfusionPipeline() {
  let lastBroadcastTs = 0;
  const BROADCAST_DEBOUNCE_MS = 1500;

  return {
    handleConfusionSignal({
      io,
      sessionId,
      rootMessageId,
      scoreDelta = 0,
      contributorDelta = 0,
      ts = Date.now(),
    }) {
      handleConfusionSignal({
        sessionId,
        rootMessageId,
        scoreDelta,
        contributorDelta,
        ts,
      });

      const now = Date.now();
      if (now - lastBroadcastTs < BROADCAST_DEBOUNCE_MS) {
        return;
      }

      lastBroadcastTs = now;

      const sessionState = getSessionConfusion(sessionId);
      const envelopes = sessionState.map((entry) => {
        let level = "low";

        if (entry.contributors >= 3 || entry.score >= 5) {
          level = "high";
        } else if (entry.contributors >= 2 || entry.score >= 2) {
          level = "medium";
        }

        return {
          rootMessageId: entry.rootMessageId,
          level,
        };
      });

      broadcastConfusionUpdate({
        io,
        sessionId,
        envelopes,
      });
    },
  };
}

// END CONFUSION SIGNAL
