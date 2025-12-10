/**
 * Pulse Pipeline — handlePulseSubmit
 * Minimal working implementation:
 * 1. Validate input
 * 2. Update in-memory pulse state
 * 3. Broadcast updated pulse data
 */

import { updatePulseState } from "./pulse.state.js";
import { broadcastPulse } from "./pulse.broadcast.js";

export function handlePulseSubmit(io, socket, payload) {
  try {
    const { pulse } = payload || {};

    if (!pulse) {
      console.warn("[PULSE] Missing pulse value:", payload);
      return;
    }

    const allowed = ["engaged", "neutral", "frustrated"];
    if (!allowed.includes(pulse)) {
      console.warn("[PULSE] Invalid pulse:", pulse);
      return;
    }

    // Update internal state using socket.id as the participant ID
    const roomState = updatePulseState(socket.id, pulse);

    // Broadcast to all trainer views + console tools
    broadcastPulse(io, roomState);

    console.log("[PULSE] Updated:", roomState);
  } catch (err) {
    console.error("[PULSE] Error in handlePulseSubmit:", err);
  }
}
