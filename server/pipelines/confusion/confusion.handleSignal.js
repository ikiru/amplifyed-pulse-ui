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
  clearConfusionContribution,
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

  const isConfusionSource =
    source === "self_report" || source === "detection";

  if (isConfusionSource) {
    const contributors = Array.isArray(envelope.contributors)
      ? envelope.contributors
      : (envelope.contributors = []);

    const hasAlreadyContributed = Boolean(
      participantId && contributors.includes(participantId)
    );

    if (!hasAlreadyContributed) {
      const before = envelope.confusionScore;

      if (participantId) {
        contributors.push(participantId);
      }

      envelope.confusionScore += 1;

      if (source === "self_report") {
        console.groupCollapsed("[CONFUSION][STEP 6.1][SELF_REPORT]");
        console.log("rootMessageId:", rootMessageId);
        console.log("participantId:", participantId);
        console.log("before:", before);
        console.log("after:", envelope.confusionScore);
        console.groupEnd();
      }

      console.log("[CONFUSION][STEP 6.2][APPLIED]", {
        rootMessageId,
        participantId,
        confusionScore: envelope.confusionScore,
      });
    } else {
      console.log("[CONFUSION][STEP 6.2][IGNORED][DUPLICATE]", {
        rootMessageId,
        participantId,
        confusionScore: envelope.confusionScore,
      });
    }
  }

  console.log(
    "[CONFUSION][STEP 3][AFTER]",
    rootMessageId,
    "score:",
    envelope.confusionScore
  );

  return envelope;
}

export function handleConfusionClear(payload) {
  console.group("[CONFUSION][CLEAR][INCOMING]");
  console.log("raw payload:", payload);
  console.groupEnd();

  const {
    sessionId,
    rootMessageId,
    participantId,
    ts = Date.now(),
  } = payload ?? {};

  if (!sessionId || !rootMessageId || !participantId) {
    return null;
  }

  return clearConfusionContribution({
    sessionId,
    rootMessageId,
    participantId,
    ts,
  });
}

// END CONFUSION SIGNAL
