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
    participantId,
    source,
    scoreDelta = 0,
    contributorDelta = 0,
    ts = Date.now(),
  } = payload ?? {};
  if (!sessionId || !rootMessageId) return null;

  const envelope = upsertConfusionEnvelope({
    sessionId,
    rootMessageId,
    scoreDelta,
    contributorDelta,
    ts,
  });

  console.log(
    "[CONFUSION][STEP 3][BEFORE]",
    rootMessageId,
    "score:",
    envelope.confusionScore
  );

  // STEP 6.1 — Self-report confusion scoring
  if (source === "self_report") {
    const before = envelope.confusionScore;

    envelope.confusionScore += 1;

    console.groupCollapsed("[CONFUSION][STEP 6.1][SELF_REPORT]");
    console.log("rootMessageId:", rootMessageId);
    console.log("participantId:", participantId);
    console.log("before:", before);
    console.log("after:", envelope.confusionScore);
    console.groupEnd();
  }

  return envelope;
}

// END CONFUSION SIGNAL
