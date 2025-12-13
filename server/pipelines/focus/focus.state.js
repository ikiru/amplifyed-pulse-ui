/**
 * Focus Pipeline — focus state placeholder
 */
// In-memory focus state per session
// sessionId -> activeFocus | null

const focusState = new Map();

export function getActiveFocus(sessionId) {
  return focusState.get(sessionId) || null;
}

export function setActiveFocus(sessionId, focus) {
  focusState.set(sessionId, focus);
}

export function clearActiveFocus(sessionId) {
  focusState.delete(sessionId);
}
