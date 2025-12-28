/**
 * Audience Drift Classification — Dark Scaffold
 *
 * Internal-only structure for holding ephemeral message classifications.
 * No logic, no consumers, no side effects.  This is preparatory structure only.
 */

const AudienceDriftClassification = Object.freeze({
  ON_FOCUS: "on_focus",
  OFF_FOCUS: "off_focus",
  IGNORED: "ignored",
  UNKNOWN: "unknown",
});

const DEFAULT_CLASSIFICATION = AudienceDriftClassification.UNKNOWN;

const sessionClassifications = new Map(); // sessionId -> Map(messageId -> classification)

function ensureSessionMap(sessionId) {
  if (!sessionId) return null;
  if (!sessionClassifications.has(sessionId)) {
    sessionClassifications.set(sessionId, new Map());
  }
  return sessionClassifications.get(sessionId);
}

function initializeMessageClassification(sessionId, messageId) {
  const sessionMap = ensureSessionMap(sessionId);
  if (!sessionMap || !messageId) return null;
  if (!sessionMap.has(messageId)) {
    sessionMap.set(messageId, DEFAULT_CLASSIFICATION);
  }
  return sessionMap.get(messageId);
}

function getMessageClassification(sessionId, messageId) {
  const sessionMap = sessionClassifications.get(sessionId);
  if (!sessionMap || !messageId) {
    return null;
  }
  return sessionMap.get(messageId) ?? null;
}

function setMessageClassification(sessionId, messageId, classification = DEFAULT_CLASSIFICATION) {
  const sessionMap = ensureSessionMap(sessionId);
  if (!sessionMap || !messageId) return null;
  sessionMap.set(messageId, classification);
  return classification;
}

function getSessionClassifications(sessionId) {
  const sessionMap = sessionClassifications.get(sessionId);
  if (!sessionMap) {
    return new Map();
  }
  return new Map(sessionMap);
}

function clearSessionClassifications(sessionId) {
  if (!sessionId) return;
  sessionClassifications.delete(sessionId);
}

export {
  AudienceDriftClassification,
  initializeMessageClassification,
  getMessageClassification,
  setMessageClassification,
  getSessionClassifications,
  clearSessionClassifications,
};
