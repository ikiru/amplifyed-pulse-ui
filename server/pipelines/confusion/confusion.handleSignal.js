/**
 * Confusion Signal Handler
 *
 * Accepts normalized confusion signals and updates
 * ephemeral confusion state.
 *
 * No routing, no broadcasting, no scoring policy.
 */

// BEGIN CONFUSION SIGNAL

import {
  upsertConfusionEnvelope,
} from "./confusion.state.js";

export function handleConfusionSignal({
  sessionId,
  rootMessageId,
  scoreDelta = 0,
  contributorDelta = 0,
  ts = Date.now(),
}) {
  if (!sessionId || !rootMessageId) return null;

  return upsertConfusionEnvelope({
    sessionId,
    rootMessageId,
    scoreDelta,
    contributorDelta,
    ts,
  });
}

// END CONFUSION SIGNAL
