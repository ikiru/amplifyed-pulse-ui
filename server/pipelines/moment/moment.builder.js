// ------------------------------------------------------------------
// Moment Builder (Phase 2.3.2)
// ------------------------------------------------------------------
// Owns:
//   Gather partial signal fragments from:
//     - Pulse Pipeline
//     - Safety Pipeline
//     - Emotion Pipeline
//     - Message Pipeline
//     - Trainer Pipeline
//   Merge them into ONE unified moment object using buildMomentEnvelope.
//
// Never:
//   Stores long-term state.
//   Reads participants.
//   Reads or writes pulse/eventLog/session state.
//
// Pure short-lived builder for a SINGLE timeline event.
// ------------------------------------------------------------------

import { buildMomentEnvelope } from "./moment.envelope.js";

export function createMomentBuilder(dispatchMoment = null) {

  // Private working context for one moment
  let context = {
    pulseValue: null,
    safetyFlag: "none",
    emotionScore: null,
    messageSignal: null,
    trainerSignal: null,
  };

  // ----------------------------------------------------
  // Begin a moment with a pulse contribution
  // ----------------------------------------------------
  function beginMoment({ pulseValue = null } = {}) {
    context = {
      ...context,
      pulseValue,
    };
  }

  // ----------------------------------------------------
  // Add safety classification
  // ----------------------------------------------------
  function addSafety({ safetyFlag = "none" } = {}) {
    context = {
      ...context,
      safetyFlag,
    };
  }

  // ----------------------------------------------------
  // Add emotion scoring
  // ----------------------------------------------------
  function addEmotion({ emotionScore = null } = {}) {
    context = {
      ...context,
      emotionScore,
    };
  }

  // ----------------------------------------------------
  // Add message signal (confusion, barrier, etc.)
  // ----------------------------------------------------
  function addMessage({ messageSignal = null } = {}) {
    context = {
      ...context,
      messageSignal,
    };
  }

  // ----------------------------------------------------
  // Add trainer signal (nudge, pace change, etc.)
  // ----------------------------------------------------
  function addTrainer({ trainerSignal = null } = {}) {
    // Trainer signals are instantaneous meta-events.
    // They do NOT represent trainer state.
    // They annotate the moment for UI timelines.
    context = {
      ...context,
      trainerSignal,
    };
  }

  // ----------------------------------------------------
  // Finalize a unified moment
  // ----------------------------------------------------
  function finalize() {
    const moment = buildMomentEnvelope({ ...context });

    // Phase 2.4.3 — Dispatch finalized moment into the history buffer
    if (dispatchMoment) {
      dispatchMoment(moment);
    }

    // Clear builder context for next moment
    context = {
      pulseValue: null,
      safetyFlag: "none",
      emotionScore: null,
      messageSignal: null,
      trainerSignal: null,
    };

    return moment;
  }

  return {
    beginMoment,
    addSafety,
    addEmotion,
    addMessage,
    addTrainer,
    finalize,
  };
}
