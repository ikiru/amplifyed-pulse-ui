import { getSessionMessages } from "../message/message.state.js";
import { getActiveFocus } from "../focus/focus.state.js";

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

const IGNORE_MINIMAL_LENGTH = 3;
const IGNORE_MINIMAL_RESPONSES = new Set([
  "yes",
  "no",
  "maybe",
  "?",
  "ok",
  "👍",
  "👎",
]);

function shouldIgnoreMessage(text) {
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (trimmed.length === 0) {
    return true;
  }
  if (trimmed.length <= IGNORE_MINIMAL_LENGTH) {
    return true;
  }
  return IGNORE_MINIMAL_RESPONSES.has(trimmed.toLowerCase());
}

function applyIgnoreGate({ sessionId, messageId, text }) {
  if (!sessionId || !messageId) return null;

  const sessionMap = ensureSessionMap(sessionId);
  if (!sessionMap) return null;

  if (shouldIgnoreMessage(text)) {
    sessionMap.set(messageId, AudienceDriftClassification.IGNORED);
    return AudienceDriftClassification.IGNORED;
  }

  if (!sessionMap.has(messageId)) {
    sessionMap.set(messageId, DEFAULT_CLASSIFICATION);
  }

  return sessionMap.get(messageId);
}

function applyOffFocusSelfReportGate({ sessionId, messageId, type }) {
  if (!sessionId || !messageId || type !== "off_focus") {
    return null;
  }

  const sessionMap = ensureSessionMap(sessionId);
  if (!sessionMap) return null;

  sessionMap.set(messageId, AudienceDriftClassification.OFF_FOCUS);
  return AudienceDriftClassification.OFF_FOCUS;
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

function buildChildrenMap(sessionId) {
  const map = new Map();
  const messages = getSessionMessages(sessionId);
  messages.forEach((message) => {
    const parentId = message?.envelope?.parentMessageId;
    const childId = message?.envelope?.messageId;
    if (!parentId || !childId) return;

    const bucket = map.get(parentId) ?? [];
    bucket.push(childId);
    map.set(parentId, bucket);
  });
  return map;
}

function traverseChildren(childrenMap, parentId, callback, visited = new Set()) {
  const children = childrenMap.get(parentId);
  if (!children?.length) {
    return;
  }

  children.forEach((childId) => {
    if (visited.has(childId)) {
      return;
    }
    visited.add(childId);
    callback(childId);
    traverseChildren(childrenMap, childId, callback, visited);
  });
}

function applyThreadInheritanceGate({ sessionId, messageId }) {
  if (!sessionId || !messageId) return null;

  const sessionMap = ensureSessionMap(sessionId);
  if (!sessionMap) return null;

  if (!sessionMap.has(messageId)) {
    sessionMap.set(messageId, DEFAULT_CLASSIFICATION);
  }

  const classification = sessionMap.get(messageId);
  if (classification === AudienceDriftClassification.IGNORED) {
    return AudienceDriftClassification.IGNORED;
  }

  const childrenMap = buildChildrenMap(sessionId);
  if (!childrenMap.size) {
    return classification;
  }

  const ensureChildEntry = (childId) => {
    if (!sessionMap.has(childId)) {
      sessionMap.set(childId, DEFAULT_CLASSIFICATION);
    }
  };

  if (classification === AudienceDriftClassification.OFF_FOCUS) {
    traverseChildren(childrenMap, messageId, (childId) => {
      ensureChildEntry(childId);
      if (sessionMap.get(childId) !== AudienceDriftClassification.IGNORED) {
        sessionMap.set(childId, AudienceDriftClassification.OFF_FOCUS);
      }
    });
    return AudienceDriftClassification.OFF_FOCUS;
  }

  if (classification === AudienceDriftClassification.ON_FOCUS) {
    traverseChildren(childrenMap, messageId, (childId) => {
      ensureChildEntry(childId);
      const childClass = sessionMap.get(childId);
      if (
        childClass !== AudienceDriftClassification.IGNORED &&
        childClass !== AudienceDriftClassification.OFF_FOCUS
      ) {
        sessionMap.set(childId, AudienceDriftClassification.ON_FOCUS);
      }
    });
    return AudienceDriftClassification.ON_FOCUS;
  }

  return classification;
}

function buildFocusKeywords(text = "") {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function applyLiteralFocusGate({ sessionId, messageId, text }) {
  if (!sessionId || !messageId || typeof text !== "string") return null;

  const focus = getActiveFocus(sessionId);
  if (!focus?.text) return null;

  const sessionMap = ensureSessionMap(sessionId);
  if (!sessionMap) return null;

  const current = sessionMap.get(messageId) ?? DEFAULT_CLASSIFICATION;
  if (current !== AudienceDriftClassification.UNKNOWN) {
    return null;
  }

  const keywords = buildFocusKeywords(focus.text);
  if (!keywords.length) return null;

  const lowerText = text.toLowerCase();
  if (keywords.some((keyword) => lowerText.includes(keyword))) {
    sessionMap.set(messageId, AudienceDriftClassification.ON_FOCUS);
    return AudienceDriftClassification.ON_FOCUS;
  }

  return null;
}

function callAIBinaryJudge({ focusText, messageText }) {
  if (!focusText || !messageText) {
    return AudienceDriftClassification.UNKNOWN;
  }

  // Placeholder for future AI integration: include focusText & messageText in prompt
  return AudienceDriftClassification.UNKNOWN;
}

function applyAIBinaryGate({ sessionId, messageId, text }) {
  if (!sessionId || !messageId || typeof text !== "string") return null;

  const sessionMap = sessionClassifications.get(sessionId);
  if (!sessionMap) return null;

  const current = sessionMap.get(messageId) ?? DEFAULT_CLASSIFICATION;
  if (current !== AudienceDriftClassification.UNKNOWN) return null;

  const focus = getActiveFocus(sessionId);
  if (!focus?.text) return null;

  const aiResult = callAIBinaryJudge({
    focusText: focus.text,
    messageText: text,
  });

  if (
    aiResult === AudienceDriftClassification.ON_FOCUS ||
    aiResult === AudienceDriftClassification.OFF_FOCUS
  ) {
    sessionMap.set(messageId, aiResult);
    return aiResult;
  }

  return null;
}

export {
  AudienceDriftClassification,
  initializeMessageClassification,
  getMessageClassification,
  setMessageClassification,
  getSessionClassifications,
  clearSessionClassifications,
  applyIgnoreGate,
  applyOffFocusSelfReportGate,
  applyThreadInheritanceGate,
  applyLiteralFocusGate,
  applyAIBinaryGate,
};
