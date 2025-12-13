/**
 * Focus Pipeline — handleFocusSet (Placeholder)
 */
import { randomUUID } from "crypto";
import {
  getActiveFocus,
  setActiveFocus,
} from "./focus.state.js";
import { broadcastFocus } from "./focus.broadcast.js";

export function handleSetFocus({ io, sessionId, text }) {
  const now = Date.now();
  const existing = getActiveFocus(sessionId);

  if (existing) {
    existing.deactivatedAt = now;
  }

  const focus = {
    focusId: randomUUID(),
    sessionId,
    text,
    activatedAt: now,
    deactivatedAt: null,
    authorRole: "trainer",
  };

  setActiveFocus(sessionId, focus);

  // session event (non-signal)
  io.to(sessionId).emit("session:event", {
    type: "focus:set",
    sessionId,
    timestamp: now,
    focusId: focus.focusId,
  });

  broadcastFocus(io, sessionId, focus);
}
