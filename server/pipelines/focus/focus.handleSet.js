/**
 * Focus Pipeline — handleFocusSet (Placeholder)
 */
import { randomUUID } from "crypto";
import {
  getActiveFocus,
  setActiveFocus,
  addFocusEntry,
  activateFocusById,
  getFocusState,
} from "./focus.state.js";
import { broadcastFocus } from "./focus.broadcast.js";

export function handleSetFocus({ io, sessionId, text }) {
  const now = Date.now();
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (!trimmed) {
    // Preserve invariants: never clear to null from legacy set path.
    const active = getActiveFocus(sessionId);
    if (active) broadcastFocus(io, sessionId, active);
    return;
  }

  // Legacy behavior: focus:set implies immediate activation.
  // We map to: ensure entry exists, then activate it.
  const state = getFocusState(sessionId);
  const existing = state.entries.find((e) => e.text === trimmed);
  if (existing?.focusId) {
    activateFocusById(sessionId, existing.focusId, { authorRole: "trainer" });
  } else {
    addFocusEntry(sessionId, { text: trimmed, authorRole: "trainer" });
    const next = getFocusState(sessionId).entries.slice(-1)[0];
    if (next?.focusId) {
      activateFocusById(sessionId, next.focusId, { authorRole: "trainer" });
    }
  }

  const focus = getActiveFocus(sessionId);

  // session event (non-signal)
  io.to(sessionId).emit("session:event", {
    type: "focus:set",
    sessionId,
    timestamp: now,
    focusId: focus?.focusId ?? randomUUID(),
  });

  if (focus) {
    broadcastFocus(io, sessionId, focus);
  }
}
