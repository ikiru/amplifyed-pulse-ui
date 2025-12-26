/**
 * Confusion State — Ephemeral, Session-Scoped
 *
 * Purpose:
 *  - Track advisory confusion signals at the thread-root level
 *  - Never mutate message state
 *  - Never persist or replay
 *
 * Keying:
 *  Map<sessionId, Map<rootMessageId, ConfusionEnvelope>>
 *
 * This file intentionally contains:
 *  - No scoring logic
 *  - No pipeline wiring
 *  - No router knowledge
 *  - No imports from other pipelines
 */

// BEGIN CONFUSION SIGNAL

const confusionState = new Map();
const ALLOWED_RESOLUTION_TYPES = new Set([
  "explanation",
  "example",
  "pause",
  "reframe",
]);

function ensureSession(sessionId) {
  if (!confusionState.has(sessionId)) {
    confusionState.set(sessionId, new Map());
  }
  return confusionState.get(sessionId);
}

export function getConfusionEnvelope(sessionId, rootMessageId) {
  if (!sessionId || !rootMessageId) return null;

  const sessionMap = confusionState.get(sessionId);
  if (!sessionMap) return null;

  return sessionMap.get(rootMessageId) ?? null;
}

export function upsertConfusionEnvelope({
  sessionId,
  rootMessageId,
  scoreDelta = 0,
  contributorDelta = 0,
  ts = Date.now(),
}) {
  if (!sessionId || !rootMessageId) return null;

  const sessionMap = ensureSession(sessionId);

  const existing =
    sessionMap.get(rootMessageId) ?? {
      score: 0,
      contributors: 0,
      ts,
    };

  const next = {
    score: existing.score + scoreDelta,
    contributors: Math.max(
      0,
      existing.contributors + contributorDelta
    ),
    ts,
  };

  sessionMap.set(rootMessageId, next);
  return next;
}

export function resolveConfusionEnvelope({
  sessionId,
  rootMessageId,
  resolutionType,
}) {
  if (!sessionId || !rootMessageId || !resolutionType) return null;
  if (!ALLOWED_RESOLUTION_TYPES.has(resolutionType)) return null;

  const sessionMap = confusionState.get(sessionId);
  if (!sessionMap) return null;

  const existing = sessionMap.get(rootMessageId);
  if (!existing) return null;

  const next = {
    ...existing,
    resolvedAt: Date.now(),
    resolvedBy: "trainer",
    resolutionType,
  };

  sessionMap.set(rootMessageId, next);
  return next;
}

export function getSessionConfusion(sessionId) {
  const sessionMap = confusionState.get(sessionId);
  if (!sessionMap) return [];

  return Array.from(sessionMap.entries()).map(
    ([rootMessageId, envelope]) => ({
      rootMessageId,
      ...envelope,
    })
  );
}

export function clearSessionConfusion(sessionId) {
  if (!sessionId) return;
  confusionState.delete(sessionId);
}

// END CONFUSION SIGNAL
