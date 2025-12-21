/**
 * Message Pipeline — broadcastMessage (Placeholder)
 */
import { getSessionMessages } from "./message.state.js";

// Thin transport layer. Sends whatever shape was composed upstream.
export function broadcastAudienceMessage(io, message) {
  // DISABLED: Incremental audience message broadcast
  // Rendering must rely exclusively on authoritative state snapshots
  // via `message.state.update`
  return;
}

/**
 * Broadcast authoritative message state snapshot
 */
export function broadcastMessageState({ io, sessionId }) {
  if (!io || !sessionId) return;

  const messages = getSessionMessages(sessionId);

  io.to(sessionId).emit("message.state.update", {
    sessionId,
    messages,
  });
}
