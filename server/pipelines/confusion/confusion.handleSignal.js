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

export function handleConfusionSignal(payload) {
  console.group("[CONFUSION][STEP 1][INCOMING SIGNAL]");
  console.log("raw payload:", payload);
  console.log("rootMessageId:", payload?.rootMessageId);
  console.log("participantId:", payload?.participantId);
  console.log("source:", payload?.source ?? "self");
  console.log("timestamp:", payload?.ts);
  console.groupEnd();

  const {
    sessionId,
    rootMessageId,
    scoreDelta = 0,
    contributorDelta = 0,
    ts = Date.now(),
  } = payload ?? {};
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
