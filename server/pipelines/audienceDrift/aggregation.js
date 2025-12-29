import {
  AudienceDriftClassification,
  getMessageClassification,
} from "./classification.state.js";

const FEATURE_AUDIENCE_DRIFT_AGGREGATION =
  process.env.FEATURE_AUDIENCE_DRIFT_AGGREGATION === "1";

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
  if (!FEATURE_AUDIENCE_DRIFT_AGGREGATION) {
    return null;
  }
  if (!sessionId || !messageId) {
    return null;
  }

  const classification =
    getMessageClassification(sessionId, messageId) ??
    AudienceDriftClassification.UNKNOWN;
  if (classification === AudienceDriftClassification.IGNORED) {
    return getDriftScore(sessionId);
  }

  const state = ensureSessionState(sessionId);
  const entry = {
    messageId,
    timestamp: typeof timestamp === "number" ? timestamp : Date.now(),
    classification,
    epochWeight: determineEpochWeight(focusEpoch),
  };

  state.entries.push(entry);
  pruneWindow(state);

  const { F, D, N } = aggregateEntries(state.entries);
  if (N < MIN_WINDOW_COUNT) {
    return state.score;
  }

  const raw = D - F;
  state.raw = raw;
  const shaped = shapeRaw(raw);
  state.score = smooth(state.score, shaped);

  return state.score;
}

export { FEATURE_AUDIENCE_DRIFT_AGGREGATION };
