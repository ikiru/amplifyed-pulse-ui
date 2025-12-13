/**
 * Focus Pipeline — handleFocusClear (Placeholder)
 */
import {
  getActiveFocus,
  clearActiveFocus,
} from "./focus.state.js";
import { broadcastFocusCleared } from "./focus.broadcast.js";

export function handleClearFocus({ io, sessionId }) {
  const now = Date.now();
  const existing = getActiveFocus(sessionId);

  if (!existing) return;

  existing.deactivatedAt = now;
  clearActiveFocus(sessionId);

  // session event (non-signal)
  io.to(sessionId).emit("session:event", {
    type: "focus:cleared",
    sessionId,
    timestamp: now,
    focusId: existing.focusId,
  });

  broadcastFocusCleared(io, sessionId);
}
