/**
 * Focus Pipeline — server-authoritative focus state (Phase 8+ Focus Box)
 *
 * Contract invariants:
 * - Exactly one active focus per session at all times
 * - Default baseline focus is "Open Conversation"
 * - Trainer-only staged list exists, but only active focus is broadcast to the room
 */

// sessionId -> { entries: FocusEntry[], activeFocusId: string }
const focusStateBySession = new Map();

export const DEFAULT_FOCUS_ID = "focus:open_conversation";
export const DEFAULT_FOCUS_TEXT = "Open Conversation";

function nowMs() {
  return Date.now();
}

function clone(obj) {
  return obj ? JSON.parse(JSON.stringify(obj)) : obj;
}

function buildDefaultEntry(sessionId) {
  return {
    focusId: DEFAULT_FOCUS_ID,
    sessionId,
    text: DEFAULT_FOCUS_TEXT,
    createdAt: nowMs(),
    activatedAt: nowMs(),
    deactivatedAt: null,
    authorRole: "system",
    revisedFromFocusId: null,
  };
}

function ensureSession(sessionId) {
  if (!sessionId) {
    throw new Error("[focus.state] sessionId required");
  }

  const existing = focusStateBySession.get(sessionId);
  if (existing?.entries?.length && existing.activeFocusId) {
    return existing;
  }

  const seeded = {
    entries: [buildDefaultEntry(sessionId)],
    activeFocusId: DEFAULT_FOCUS_ID,
  };
  focusStateBySession.set(sessionId, seeded);
  return seeded;
}

export function getFocusState(sessionId) {
  const state = ensureSession(sessionId);
  return clone(state);
}

export function getFocusEntries(sessionId) {
  return getFocusState(sessionId).entries;
}

export function getActiveFocusId(sessionId) {
  return ensureSession(sessionId).activeFocusId;
}

export function getActiveFocus(sessionId) {
  const state = ensureSession(sessionId);
  const active = state.entries.find((e) => e.focusId === state.activeFocusId);
  // Defensive: if activeFocusId got out of sync, snap back to default.
  if (!active) {
    state.activeFocusId = DEFAULT_FOCUS_ID;
    const fallback =
      state.entries.find((e) => e.focusId === DEFAULT_FOCUS_ID) ??
      buildDefaultEntry(sessionId);
    if (!state.entries.some((e) => e.focusId === fallback.focusId)) {
      state.entries.unshift(fallback);
    }
    return clone(fallback);
  }
  return clone(active);
}

export function addFocusEntry(sessionId, { text, authorRole = "trainer" } = {}) {
  const state = ensureSession(sessionId);
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (!trimmed) {
    return getFocusState(sessionId);
  }

  const entry = {
    focusId: `focus:${Math.random().toString(16).slice(2)}:${nowMs()}`,
    sessionId,
    text: trimmed,
    createdAt: nowMs(),
    activatedAt: null,
    deactivatedAt: null,
    authorRole,
    revisedFromFocusId: null,
  };

  state.entries.push(entry);
  return getFocusState(sessionId);
}

export function activateFocusById(sessionId, focusId, { authorRole = "trainer" } = {}) {
  const state = ensureSession(sessionId);
  const nextId = typeof focusId === "string" ? focusId : DEFAULT_FOCUS_ID;

  const nextEntry = state.entries.find((e) => e.focusId === nextId);
  if (!nextEntry) {
    // Invalid id → do nothing, preserve invariants.
    return getFocusState(sessionId);
  }

  const previous = state.entries.find((e) => e.focusId === state.activeFocusId);
  const ts = nowMs();

  if (previous && previous.focusId !== nextEntry.focusId) {
    previous.deactivatedAt = ts;
  }

  state.activeFocusId = nextEntry.focusId;
  nextEntry.activatedAt = ts;
  nextEntry.deactivatedAt = null;
  nextEntry.authorRole = nextEntry.authorRole || authorRole;

  return getFocusState(sessionId);
}

export function resetFocusToDefault(sessionId) {
  const state = ensureSession(sessionId);
  if (!state.entries.some((e) => e.focusId === DEFAULT_FOCUS_ID)) {
    state.entries.unshift(buildDefaultEntry(sessionId));
  }
  return activateFocusById(sessionId, DEFAULT_FOCUS_ID, { authorRole: "system" });
}

export function editFocusInPlace(sessionId, focusId, { text } = {}) {
  const state = ensureSession(sessionId);
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (!trimmed) return getFocusState(sessionId);

  const entry = state.entries.find((e) => e.focusId === focusId);
  if (!entry) return getFocusState(sessionId);

  entry.text = trimmed;
  return getFocusState(sessionId);
}

export function reviseFocusByNew(sessionId, focusId, { text, authorRole = "trainer" } = {}) {
  const state = ensureSession(sessionId);
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (!trimmed) return getFocusState(sessionId);

  const entry = {
    focusId: `focus:${Math.random().toString(16).slice(2)}:${nowMs()}`,
    sessionId,
    text: trimmed,
    createdAt: nowMs(),
    activatedAt: null,
    deactivatedAt: null,
    authorRole,
    revisedFromFocusId: typeof focusId === "string" ? focusId : null,
  };
  state.entries.push(entry);
  return getFocusState(sessionId);
}

export function reorderFocusEntries(sessionId, orderedFocusIds = []) {
  const state = ensureSession(sessionId);
  if (!Array.isArray(orderedFocusIds) || orderedFocusIds.length === 0) {
    return getFocusState(sessionId);
  }

  const byId = new Map(state.entries.map((e) => [e.focusId, e]));
  const reordered = [];

  orderedFocusIds.forEach((id) => {
    const entry = byId.get(id);
    if (entry) reordered.push(entry);
  });

  // Append any entries not included to preserve data.
  state.entries.forEach((e) => {
    if (!orderedFocusIds.includes(e.focusId)) reordered.push(e);
  });

  // Ensure default is always present.
  if (!reordered.some((e) => e.focusId === DEFAULT_FOCUS_ID)) {
    reordered.unshift(buildDefaultEntry(sessionId));
  }

  state.entries = reordered;
  return getFocusState(sessionId);
}

// -----------------------------------------------------------------------------
// Backwards-compat surface for existing code paths (legacy focus:set / focus:clear)
// -----------------------------------------------------------------------------
export function setActiveFocus(sessionId, focus) {
  // Legacy path: setting focus directly implies activation.
  // We preserve invariants by ensuring the entry exists and then activating it.
  const state = ensureSession(sessionId);
  const text = focus?.text;
  if (typeof text !== "string" || !text.trim()) {
    return resetFocusToDefault(sessionId);
  }

  const trimmed = text.trim();
  const existing = state.entries.find((e) => e.text === trimmed);
  if (existing) {
    activateFocusById(sessionId, existing.focusId);
    return;
  }

  addFocusEntry(sessionId, { text: trimmed, authorRole: focus?.authorRole || "trainer" });
  const created = state.entries[state.entries.length - 1];
  if (created?.focusId) {
    activateFocusById(sessionId, created.focusId);
  }
}

export function clearActiveFocus(sessionId) {
  // Legacy clear now means reset to default.
  resetFocusToDefault(sessionId);
}
