import {
  AudienceDriftClassification,
  getClassificationSource,
  getMessageClassification,
} from "./classification.state.js";

const FEATURE_AUDIENCE_DRIFT_AGGREGATION =
  process.env.ENABLE_AUDIENCE_DRIFT === "true"; // Dev flag; set ENABLE_AUDIENCE_DRIFT=true to allow aggregation.

const WINDOW_DURATION_MS = 2 * 60 * 1000; // 2 minutes
const MIN_WINDOW_COUNT = 5;
const SMOOTHING_ALPHA = 0.2;
const MAX_ENTRIES = 200;
const CLAMP_MIN = -1;
const CLAMP_MAX = 1;

const EPOCH_WEIGHTS = {
  current: 1,
  previous: 0.8,
  older: 0.5,
  unknown: 0.5,
};

const sessionDriftState = new Map();
let audienceDriftEmitter = null;

export function setAudienceDriftEmitter(emitter) {
  audienceDriftEmitter = typeof emitter === "function" ? emitter : null;
}

function ensureSessionState(sessionId) {
  if (!sessionDriftState.has(sessionId)) {
    sessionDriftState.set(sessionId, {
      entries: [],
      score: 0,
      raw: 0,
    });
  }
  return sessionDriftState.get(sessionId);
}

function pruneWindow(state) {
  const cutoff = Date.now() - WINDOW_DURATION_MS;
  while (state.entries.length && state.entries[0].timestamp < cutoff) {
    state.entries.shift();
  }
  if (state.entries.length > MAX_ENTRIES) {
    state.entries.splice(0, state.entries.length - MAX_ENTRIES);
  }
}

function aggregateEntries(entries) {
  let F = 0;
  let D = 0;
  let U = 0;
  let N = 0;

  entries.forEach((entry) => {
    const weight = typeof entry.epochWeight === "number" ? entry.epochWeight : 1;
    switch (entry.classification) {
      case AudienceDriftClassification.ON_FOCUS:
        F += weight;
        N += weight;
        break;
      case AudienceDriftClassification.OFF_FOCUS:
        D += weight;
        N += weight;
        break;
      case AudienceDriftClassification.UNKNOWN:
        U += weight;
        N += weight;
        break;
      default:
        break;
    }
  });

  return { F, D, U, N };
}

function clamp(value) {
  return Math.max(CLAMP_MIN, Math.min(CLAMP_MAX, value));
}

function shapeRaw(raw) {
  return Math.tanh(raw);
}

function smooth(previous, shaped) {
  const prior = typeof previous === "number" ? previous : 0;
  return clamp((1 - SMOOTHING_ALPHA) * prior + SMOOTHING_ALPHA * shaped);
}

function determineEpochWeight(epoch) {
  if (!epoch) {
    return EPOCH_WEIGHTS.current;
  }
  return EPOCH_WEIGHTS[epoch] ?? EPOCH_WEIGHTS.unknown;
}

function logAggregateInput({
  sessionId,
  messageId,
  label,
  source,
  priorScore,
  weights,
}) {
  console.log("[AUDIENCE_DRIFT][AGGREGATE_INPUT]", {
    sessionId,
    messageId,
    label,
    source,
    priorScore,
    weights,
  });
}

function logAggregateOutput({ sessionId, messageId, newScore, priorScore, reason }) {
  const delta =
    typeof newScore === "number" && typeof priorScore === "number"
      ? newScore - priorScore
      : null;
  console.log("[AUDIENCE_DRIFT][AGGREGATE_OUTPUT]", {
    sessionId,
    messageId,
    newScore,
    delta,
    reason,
  });
}

export function getDriftScore(sessionId) {
  const state = sessionDriftState.get(sessionId);
  if (!state) {
    return 0;
  }
  return typeof state.score === "number" ? state.score : 0;
}

export function updateDriftForMessage({
  sessionId,
  messageId,
  timestamp,
  focusEpoch,
} = {}) {
  const classification =
    getMessageClassification(sessionId, messageId) ??
    AudienceDriftClassification.UNKNOWN;
  const classificationSource = getClassificationSource(sessionId, messageId);
  const source =
    classificationSource ??
    (classification === AudienceDriftClassification.OFF_FOCUS
      ? "self_report"
      : classification === AudienceDriftClassification.IGNORED
        ? "ignored"
        : null);
  const priorScore = getDriftScore(sessionId);
  const epochWeight = determineEpochWeight(focusEpoch);
  const weights = {
    focusEpoch: focusEpoch ?? null,
    epochWeight,
  };

  logAggregateInput({
    sessionId,
    messageId,
    label: classification,
    source,
    priorScore,
    weights,
  });

  if (!FEATURE_AUDIENCE_DRIFT_AGGREGATION) {
    console.log(
      `[AUDIENCE_DRIFT] feature_disabled (pid=${process.pid}) ENABLE_AUDIENCE_DRIFT=${process.env.ENABLE_AUDIENCE_DRIFT}`
    );
    logAggregateOutput({
      sessionId,
      messageId,
      newScore: priorScore,
      priorScore,
      reason: "feature_disabled",
    });
    return null;
  }

  if (!sessionId || !messageId) {
    logAggregateOutput({
      sessionId,
      messageId,
      newScore: priorScore,
      priorScore,
      reason: "missing_identifiers",
    });
    return null;
  }

  if (classification === AudienceDriftClassification.IGNORED) {
    const outputScore = getDriftScore(sessionId);
    logAggregateOutput({
      sessionId,
      messageId,
      newScore: outputScore,
      priorScore,
      reason: "ignored_classification",
    });
    return outputScore;
  }

  const state = ensureSessionState(sessionId);
  const entry = {
    messageId,
    timestamp: typeof timestamp === "number" ? timestamp : Date.now(),
    classification,
    epochWeight,
  };

  state.entries.push(entry);
  pruneWindow(state);

  const { F, D, U, N } = aggregateEntries(state.entries);
  // Expose the post-filter/window classification totals for ON/OFF/UNKNOWN (ignored always 0).
  console.log(
    `[AUDIENCE_DRIFT][COUNTS] on=${F} off=${D} unknown=${U} ignored=0`
  );
  if (N < MIN_WINDOW_COUNT) {
    logAggregateOutput({
      sessionId,
      messageId,
      newScore: state.score,
      priorScore,
      reason: "insufficient_entries",
    });
    return state.score;
  }

  const raw = D - F;
  state.raw = raw;
  const shaped = shapeRaw(raw);
  // Show the raw delta and its shaped equivalent before smoothing alters it.
  console.log(`[AUDIENCE_DRIFT][MATH] raw=${raw} shaped=${shaped}`);
  const previousScore = state.score;
  const nextScore = smooth(previousScore, shaped);
  state.score = nextScore;
  const delta =
    typeof nextScore === "number" && typeof priorScore === "number"
      ? nextScore - priorScore
      : null;
  console.log(
    `[AUDIENCE_DRIFT][SMOOTH] previous=${previousScore} next=${nextScore}`
  );

  logAggregateOutput({
    sessionId,
    messageId,
    newScore: nextScore,
    priorScore,
    reason: "smoothed",
  });

  if (typeof delta === "number" && delta !== 0) {
    // Passive emission boundary; listeners may not exist and that's valid.
    audienceDriftEmitter?.({
      sessionId,
      messageId,
      score: nextScore,
      delta,
      source,
    });
  }

  return state.score;
}

export { FEATURE_AUDIENCE_DRIFT_AGGREGATION };
