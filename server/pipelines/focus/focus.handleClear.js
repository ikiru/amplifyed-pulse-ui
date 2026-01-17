/**
 * Focus Pipeline — handleFocusClear (Placeholder)
 */
import {
  getActiveFocus,
  clearActiveFocus,
  resetFocusToDefault,
} from "./focus.state.js";
import { broadcastFocus } from "./focus.broadcast.js";

export function handleClearFocus({ io, sessionId }) {
  const now = Date.now();
  const existing = getActiveFocus(sessionId);
  if (!existing) {
    // Ensure default exists even if state was never initialized.
    resetFocusToDefault(sessionId);
  } else {
    existing.deactivatedAt = now;
    // Legacy clear now means reset to default.
    clearActiveFocus(sessionId);
  }
  const active = getActiveFocus(sessionId);

  // session event (non-signal)
  io.to(sessionId).emit("session:event", {
    type: "focus:reset_default",
    sessionId,
    timestamp: now,
    focusId: active?.focusId ?? existing?.focusId,
  });

  // Contract invariant: there is always an active focus.
  if (active) {
    broadcastFocus(io, sessionId, active);
  }
}
