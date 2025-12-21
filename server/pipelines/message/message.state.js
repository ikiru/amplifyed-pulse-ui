/**
 * Message State — Authoritative, In-Memory (Session-Scoped)
 *
 * Holds canonical message state for replay and late join.
 * Mirrors message.vote.state.js patterns.
 */

const messageState = new Map();

function ensureSession(sessionId) {
  if (!messageState.has(sessionId)) {
    messageState.set(sessionId, {
      order: [],
      messages: new Map(),
    });
  }
  return messageState.get(sessionId);
}

export function addMessage({ sessionId, message }) {
  const messageId = message?.messageId ?? message?.envelope?.messageId;
  if (!sessionId || !messageId) return null;

  const session = ensureSession(sessionId);

  // Prevent duplicate insertion
  if (session.messages.has(messageId)) {
    return session.messages.get(messageId);
  }

  session.order.push(messageId);
  session.messages.set(messageId, message);

  return message;
}

export function getSessionMessages(sessionId) {
  const session = messageState.get(sessionId);
  if (!session) return [];

  return session.order.map((id) => session.messages.get(id));
}
